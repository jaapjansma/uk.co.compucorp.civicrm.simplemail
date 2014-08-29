<?php

/**
 * Class CRM_Simplemail_BAO_SimpleMail
 */
class CRM_Simplemail_BAO_SimpleMail extends CRM_Simplemail_DAO_SimpleMail {

  /**
   * Create or update a SimpleMail mailing and the corresponding CiviCRM mailing, along with other related tasks, such
   * as creating a mailing job for scheduling mass emailing.
   *
   * @param array $params key-value pairs
   *
   * @return CRM_Simplemail_DAO_SimpleMail|NULL
   */
  public static function create($params) {
    static::sanitiseParams($params);

    $civiMailing = static::createCiviMailing($params);

    if ($civiMailing->id) {
      $params['crm_mailing_id'] = $civiMailing->id;
    }

    static::updateRecipientGroups($params);

    $entityName = 'SimpleMail';

    $hook = empty($params['id']) ? 'create' : 'edit';

    CRM_Utils_Hook::pre($hook, $entityName, CRM_Utils_Array::value('id', $params), $params);
    $instance = new static;
    $instance->copyValues($params);
    $instance->save();
    CRM_Utils_Hook::post($hook, $entityName, $instance->id, $instance);

    return $instance;
  }

  /**
   * @param $params
   *
   * @throws CRM_Extension_Exception
   */
  public static function submitMassEmail($params) {
    static::sanitiseParams($params);

    /* Scheduled mailing jobs are being updated first here as it will help in two ways:
     *
     * 1. In case mass mailing was being submitted for the first time, there won't be any jobs for it. The update method
     *    would simply not find any jobs and therefore won't have to save any records.
     *
     * 2. CRM_Mailing_BAO_Mailing::create() created a mailing job if one does not exist yet. For such situation, if the
     *    update method was used after the create() method below, the mailing job's scheduled date would be updated
     *    unnecessarily.
    */
    static::updateScheduledMailingJobs($params);
    static::create($params);
  }

  /**
   * Cancel mailing jobs for a CiviCRM mailing with the provided ID
   *
   * @param int $crmMailingId CiviCRM mailing ID
   */
  public static function cancelMailingJobs($crmMailingId) {
    CRM_Mailing_BAO_MailingJob::cancel($crmMailingId);
  }

  /**
   * Get a list of mailings, which consist of data combined from Simple Mail, CiviCRM Mail, mailing job and contact
   * tables
   *
   * @param array $params Array of optional params. Providing 'id' as a param would return a particular mailing with the
   *                      corresponding Simple Mail ID.
   *
   * @return array
   * @throws CRM_Extension_Exception
   */
  public static function getMailing($params) {
    $whereClause = isset($params['id']) ? 'sm.id = ' . (int) $params['id'] : 'true';

    $query
      = "
    SELECT
      sm.id, sm.crm_mailing_id, sm.from_address, sm.header_id, sm.title, sm.body, sm.contact_details, sm.message_id,
      cm.name, cm.subject, cm.body_html, cm.created_id, cm.created_date, cm.scheduled_date,
      MIN(j.start_date) start_date, MAX(j.end_date) end_date, j.status,
      c.sort_name

    FROM civicrm_simplemail sm

    LEFT JOIN civicrm_mailing cm
    ON sm.crm_mailing_id = cm.id

    LEFT JOIN civicrm_mailing_job j
    ON (sm.crm_mailing_id = j.mailing_id AND j.is_test = 0 AND j.parent_id IS NULL)

    LEFT JOIN civicrm_contact c
    ON cm.created_id = c.id

    WHERE $whereClause

    GROUP BY sm.id
  ";

    $mailings = array();

    try {
      /** @var CRM_Core_DAO $dao */
      $dao = CRM_Core_DAO::executeQuery($query);

      while ($dao->fetch()) {
        $mailing = $dao->toArray();
        $mailing['status'] = $mailing['status'] ?: 'Not Scheduled';

        $crmMailingId = $mailing['crm_mailing_id'];

        $group = new CRM_Mailing_DAO_MailingGroup();
        $group->mailing_id = $crmMailingId;
        $group->find();

        $groupEntityIds = array();
        while ($group->fetch()) {
          $groupEntityIds[] = $group->entity_id;
        }

        $mailing['recipient_group_entity_ids'] = $groupEntityIds;

        $mailings[] = $mailing;
      }
    } catch (Exception $e) {
      $dao = isset($dao) ? $dao : NULL;

      throw new CRM_Extension_Exception('Failed to retrieve mailings: ' . $e->getMessage(), 500, array('dao' => $dao));
    }

    return array('values' => $mailings, 'dao' => $dao);
  }

  /**
   * @param $params
   *
   * @return array
   * @throws CRM_Extension_Exception
   */
  public static function sendTestEmail($params) {
    if (empty($params['crmMailingId'])) {
      throw new CRM_Extension_Exception(
        'Failed to send test email as CiviCRM mailing ID not provided', 405, array('dao' => NULL)
      );
    }

    if (empty($params['groupId'])) {
      throw new CRM_Extension_Exception(
        'Failed to send test email as recipient group was not provided', 405, array('dao' => NULL)
      );
    }

    $job = new CRM_Mailing_BAO_MailingJob();
    $job->mailing_id = $params['crmMailingId'];
    $job->is_test = TRUE;
    $job->save();

    $testParams = array(
      'test_group' => (int) $params['groupId'],
      'job_id'     => $job->id
    );

    $isComplete = FALSE;
    while (!$isComplete) {
      $isComplete = CRM_Mailing_BAO_MailingJob::runJobs($testParams);
    }

    return array('values' => array(array('jobId' => $job->id)), 'dao' => $job);
  }

  ///////////////////////
  // Protected Methods //
  ///////////////////////

  /**
   * Update scheduled jobs for the mailing
   *
   * @param $params
   *
   * @throws CRM_Extension_Exception
   */
  protected static function updateScheduledMailingJobs($params) {
    if (empty($params['scheduled_date'])) {
      throw new CRM_Extension_Exception(
        'Failed to update scheduled job(s) for the mailing as scheduled date not provided', 405, array('dao' => NULL)
      );
    }

    static::rescheduleMailingJobs($params['crm_mailing_id'], $params['scheduled_date']);
  }

  /**
   * Reschedule jobs for a mailing given by CiviCRM mailing ID
   *
   * @param int    $crmMailingId The ID of CiviCRM mailing for which the jobs need to be rescheduled
   * @param string $date         Date to reschedule to
   */
  protected static function rescheduleMailingJobs($crmMailingId, $date) {
    $mailingJob = new CRM_Mailing_BAO_MailingJob();

    // This needs to be done as there can only be one query per DAO (see docs for reset()) - without this, the DAO
    // object was keeping residual data from previous operations elsewhere on the same DAO, making the below operations
    // unpredictable and fail
    $mailingJob->reset();

    // This is needed as the reset() above clears the query completely
    $mailingJob->selectAdd('*');

    $mailingJob->mailing_id = $crmMailingId;
    $mailingJob->status = 'Scheduled';
    $mailingJob->is_test = 0;

    if ($mailingJob->find()) {
      while ($mailingJob->fetch()) {
        $mailingJob->scheduled_date = $date;
        $mailingJob->save();
      }
    }
  }

  /**
   * Update recipient groups for the mailing - add new groups, and delete removed groups
   *
   * @param $params
   * @return void
   */
  protected static function updateRecipientGroups($params) {
    if (empty($params['recipient_group_entity_ids'])) {
      return;
    }

    $currentGroupEntityIds = $params['recipient_group_entity_ids'];

    $group = new CRM_Mailing_DAO_MailingGroup();
    $group->mailing_id = $params['crm_mailing_id'];
    $group->find();

    $existingGroupsWithEntityIdKeys = array();
    while ($group->fetch()) {
      $existingGroupsWithEntityIdKeys[$group->entity_id] = $group->toArray();
    }

    $existingGroupEntityIds = array_keys($existingGroupsWithEntityIdKeys);

    $removedGroupEntityIds = array_diff($existingGroupEntityIds, $currentGroupEntityIds);
    $addedGroupEntityIds = array_diff($currentGroupEntityIds, $existingGroupEntityIds);

    // Add new groups
    foreach ($addedGroupEntityIds as $id) {
      $group->reset();
      $group->mailing_id = $params['crm_mailing_id'];
      $group->group_type = 'Include';
      $group->entity_table = 'civicrm_group';
      $group->entity_id = $id;
      $group->save();
    }

    // Delete removed groups
    foreach ($removedGroupEntityIds as $id) {
      $removedGroup = $existingGroupsWithEntityIdKeys[$id];

      $group->reset();
      $group->id = $removedGroup['id'];
      $group->delete();
    }
  }

  /**
   * Get the path of the email template to be used for rendering the email HTML body
   *
   * @return string
   */
  protected static function getEmailTemplatePath() {
    // TODO (robin): Retrieve the extension directory from Core_Config
    $templateDir = 'civicrm_custom/extensions/compucorp/uk.co.compucorp.civicrm.simplemail/email-templates/';
    $templateFileName = 'wave.html';

    return $templateDir . $templateFileName;
  }

  /**
   * Generate email HTML body using the email template and mailing data
   *
   * @param $params
   *
   * @return string
   */
  protected static function generateEmailHtml($params) {
    // Setup paths
    $templateFile = static::getEmailTemplatePath();

    // Setup template variables
    $template = new stdClass();
    $template->title = empty($params['title']) ? NULL : $params['title'];
    $template->body = empty($params['body']) ? NULL : $params['body'];
    $template->contactDetails = isset($params['contact_details']) && $params['contact_details']
      ? $params['contact_details']
      : NULL;

    // Retrieve header if the mailing has one, and assign header and logo images in the template accordingly
    if (isset($params['header_id'])) {
      $header = new CRM_Simplemail_BAO_SimpleMailHeader();
      $header->id = (int) $params['header_id'];
      $header->find();

      if ($header->fetch()) {
        $template->headerImage = $header->image
          ? CRM_Simplemail_BAO_SimpleMailHeader::getImageUrl($header->image, 'image')
          : NULL;

        $template->logo = $header->show_logo && $header->logo_image
          ? CRM_Simplemail_BAO_SimpleMailHeader::getImageUrl($header->logo_image, 'logo_image')
          : NULL;
      }
    }

    // Retrieve campaign message if the mailing has one, and assign campaign text in the template accordingly
    if (isset($params['message_id'])) {
      $message = new CRM_Simplemail_BAO_SimpleMailMessage();
      $message->id = (int) $params['message_id'];
      $message->find();

      if ($message->fetch()) {
        $template->campaignMessage = $message->text ?: NULL;
      }
    }

    // Output parsed template
    ob_start();

    require $templateFile;

    return ob_get_clean();
  }

  /**
   * Create or update CiviCRM mailing
   *
   * @param $params
   *
   * @return object
   */
  protected static function createCiviMailing($params) {
    //////////////////////////////////
    // Setup CiviCRM mailing params //
    //////////////////////////////////

    // Mailing name
    if (isset($params['name'])) {
      $crmMailingParams['name'] = $params['name'];
    }

    // From name and email
    if (isset($params['from_address'])) {
      $fromName = $fromEmail = NULL;

      if (preg_match('/"(.*)" <(.*)>/', $params['from_address'], $match)) {
        $fromName = $match[1];
        $fromEmail = $match[2];
      }

      $crmMailingParams['from_name'] = $fromName;
      $crmMailingParams['from_email'] = $fromEmail;
    }

    // Mailing subject
    if (isset($params['subject'])) {
      $crmMailingParams['subject'] = $params['subject'];
    }

    // Body HTML
    $crmMailingParams['body_html'] = static::generateEmailHtml($params);

    // Scheduled date
    if (!empty($params['scheduled_date'])) {
      $crmMailingParams['scheduled_date'] = $params['scheduled_date'];
    }

    // De-duplicate emails
    if (isset($params['dedupe_email'])) {
      $crmMailingParams['dedupe_email'] = $params['dedupe_email'];
    }
    else {
      $crmMailingParams['dedupe_email'] = 0;
    }

    /////////
    // End //
    /////////

    $crmMailingId = array(
      'mailing_id' => isset($params['crm_mailing_id']) ? $params['crm_mailing_id'] : NULL
    );

    // Create or update CiviCRM mailing - a mailing job would be created (scheduled) if scheduled date has been set
    $crmMailing = CRM_Mailing_BAO_Mailing::create($crmMailingParams, $crmMailingId);

    /////////////////////////////////
    // Generate mailing recipients //
    /////////////////////////////////

    $removeDuplicateEmails = isset($params['dedupe_email']) ? TRUE : FALSE;

    // Compute the recipients and store them in the mailing recipients table
    CRM_Mailing_BAO_Mailing::getRecipients(
      $crmMailing->id,
      $crmMailing->id,
      NULL,
      NULL,
      TRUE,
      $removeDuplicateEmails
    );

    /////////
    // End //
    /////////

    return $crmMailing;
  }

  /**
   * Sanitise the params in order to make it conform to the requirements of the entity
   *
   * @param $params
   */
  protected static function sanitiseParams(&$params) {
    // Decode the encoded HTML entities (due to sending data via HTTP POST) back to HTML for saving into the DB
    if (!empty($params['body'])) {
      $params['body'] = html_entity_decode($params['body']);
    }

    // Reformat the scheduled date for a format required by CivCRM
    if (!empty($params['scheduled_date'])) {
      $dateTime = new DateTime($params['scheduled_date']);
      $params['scheduled_date'] = $dateTime->format('YmdHis');
    }
  }
}
