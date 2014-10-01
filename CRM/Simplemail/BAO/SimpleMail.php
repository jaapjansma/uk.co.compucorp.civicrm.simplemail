<?php

/**
 * Class CRM_Simplemail_BAO_SimpleMail
 */
class CRM_Simplemail_BAO_SimpleMail extends CRM_Simplemail_DAO_SimpleMail {

  /**
   * Name of the extension (and the directory)
   */
  const EXT_NAME = 'uk.co.compucorp.civicrm.simplemail';

  const PERMISSION_ACCESS = 'access CiviSimpleMail';
  const PERMISSION_EDIT = 'edit CiviSimpleMail';
  const PERMISSION_DELETE = 'delete CiviSimpleMail';

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
   * Delete the CiviCRM mailing corresponding to the SimpleMail mailing currently being deleted, as it would indirectly
   * cause deletion of SimpleMail mailing and any associated scheduled mailing jobs
   *
   * @return void
   * @throws CRM_Extension_Exception
   */
  public function delete() {
    if (!static::authorised(static::PERMISSION_DELETE)) {
      throw new CRM_Extension_Exception('Sorry! You do not have permission to delete mailings', 500);
    }
    if (!$this->crm_mailing_id) {
      throw new CRM_Extension_Exception(
        'Failed to delete mailing it does not have a corresponding CiviCRM mailing associated', 500
      );
    }

    $civiMailing = new CRM_Mailing_BAO_Mailing();
    $civiMailing->id = (int) $this->crm_mailing_id;
    $civiMailing->find(TRUE);
    $civiMailing->delete(); // This will cascade and delete the corresponding SimpleMail mailing and mailing jobs
  }

  /**
   * @param $params
   *
   * @throws CRM_Extension_Exception
   */
  public static function cancelMassEmail($params) {
    if (empty($params['crm_mailing_id'])) {
      throw new CRM_Extension_Exception('Failed to cancel mass mailing as CiviCRM mailing ID not available', 500);
    }

    static::cancelMailingJobs($params['crm_mailing_id']);
  }

  /**
   * @param $params
   *
   * @return \CRM_Simplemail_DAO_SimpleMail|NULL
   * @throws CRM_Extension_Exception
   */
  public static function submitMassEmail($params) {
    $params['scheduled_id'] = CRM_Core_Session::singleton()->get('userID');

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

    // This wouldn't have been needed if CRM_Mailing_BAO_Mailing::create() was able to run getRecipients() itself
    // towards the end, which unfortunately fails due to a bug in the add() method where it instantiates the DAO
    // instead of the BAO!
    static::createRecipients((int) $params['crm_mailing_id'], static::shouldRemoveDuplicateEmails($params));

    return static::create($params);
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
      sm.id, sm.crm_mailing_id, sm.from_address, sm.header_id, sm.title, sm.body, sm.contact_details, sm.message_id, sm.reply_address,
      cm.name, cm.subject, cm.body_html, cm.created_id, cm.created_date, cm.scheduled_id, cm.scheduled_date,
      MIN(j.start_date) start_date, MAX(j.end_date) end_date, j.status,
      c.sort_name, c.external_identifier,
      GROUP_CONCAT(DISTINCT g.id) recipient_group_entity_ids

    FROM civicrm_simplemail sm

    LEFT JOIN civicrm_mailing cm
    ON sm.crm_mailing_id = cm.id

    LEFT JOIN civicrm_mailing_job j
    ON (sm.crm_mailing_id = j.mailing_id AND j.is_test = 0 AND j.parent_id IS NULL)

    LEFT JOIN civicrm_contact c
    ON cm.created_id = c.id

    LEFT JOIN civicrm_mailing_group mg
    ON cm.id = mg.mailing_id

    LEFT JOIN civicrm_group g
    ON (mg.entity_id = g.id AND g.is_hidden = 0)

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
        $mailing['recipient_group_entity_ids'] = explode(',', $mailing['recipient_group_entity_ids']);

        $mailings[] = $mailing;
      }
    } catch (Exception $e) {
      $dao = isset($dao) ? $dao : NULL;

      throw new CRM_Extension_Exception('Failed to retrieve mailings: ' . $e->getMessage(), 500, array('dao' => $dao));
    }

    return array(
      'values'      => $mailings,
      'dao'         => $dao,
      'extraValues' => array('userId' => CRM_Core_Session::singleton()->get('userID'))
    );
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

  /**
   * @param $crmMailingId
   *
   * @return array
   */
  public static function getRecipientGroups($crmMailingId) {
    $sql
      = "SELECT
    	  mg.*,
    	  g.is_hidden, g.saved_search_id
        FROM civicrm_mailing_group mg
        LEFT JOIN civicrm_group g
        ON mg.entity_id = g.id
        WHERE mg.mailing_id = $crmMailingId";

    /** @var CRM_Core_DAO|CRM_Mailing_DAO_MailingGroup|CRM_Contact_BAO_Group $dao */
    $dao = CRM_Core_DAO::executeQuery($sql);

    $groups = $smartGroups = array();

    while ($dao->fetch()) {
      if ($dao->is_hidden) {
        $smartGroups[] = $dao->toArray();
      }
      else {
        $groups[] = $dao->toArray();
      }
    }

    return array($groups, $smartGroups);
  }

  /**
   * Update recipient groups for the mailing - add new groups, and delete removed groups
   *
   * @param $params
   *
   * @return void
   */
  public static function updateRecipientGroups($params) {
    if (!empty($params['recipient_group_entity_ids'])) {
      static::updateGroups((int) $params['crm_mailing_id'], $params['recipient_group_entity_ids']);
    }

    static::updateSmartGroups((int) $params['crm_mailing_id']);
  }

  /**
   * Get the absolute path of the extension directory
   *
   * @return string
   */
  public static function getExtensionDir() {
    $files = static::getActiveModuleFiles();

    $extFile = '';
    foreach ($files as $file) {
      if ($file['prefix'] === 'simplemail') {
        $extFile = $file['filePath'];
        break;
      }
    }

    $extDir = str_replace('simplemail.php', '', $extFile);

    return $extDir;
  }

  /**
   * @return array
   */
  public static function getActiveModuleFiles() {
    return CRM_Extension_System::singleton()->getMapper()->getActiveModuleFiles();
  }

  /**
   * @return array
   */
  public static function getActiveModuleUrls() {
    $mapper = CRM_Extension_System::singleton()->getMapper();
    $urls = array();
    $urls['civicrm'] = $mapper->keyToUrl('civicrm');
    foreach ($mapper->getModules() as $module) {
      /** @var $module CRM_Core_Module */
      if ($module->is_active) {
        $urls[$module->name] = $mapper->keyToUrl($module->name);
      }
    }

    return $urls;
  }

  ///////////////////////
  // Protected Methods //
  ///////////////////////

  /**
   * Check whether the current user has a certain permission
   *
   * @param string $permission
   *
   * @return bool
   */
  protected static function authorised($permission) {
    return CRM_Core_Permission::check($permission);
  }

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

    $mailingJob->free();
  }

  /**
   * Cancel mailing jobs for a CiviCRM mailing with the provided ID
   *
   * @param int $crmMailingId CiviCRM mailing ID
   */
  protected static function cancelMailingJobs($crmMailingId) {
    CRM_Mailing_BAO_MailingJob::cancel($crmMailingId);
  }

  /////////////////////////
  // Protected Functions //
  /////////////////////////

  /**
   * Get the path of the email template to be used for rendering the email HTML body
   *
   * @return string
   */
  protected static function getEmailTemplatePath() {
    $templateDir = static::getExtensionDir() . 'email-templates' . DIRECTORY_SEPARATOR;
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
    $template->replyAddress = static::getMailToLink($params);
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
   * Generate the link for mailto for the reply button in the template
   *
   * @param $params
   *
   * @return string
   */
  protected static function getMailToLink($params) {
    if (empty($params['reply_address']) || empty($params['subject']) || empty($params['id'])) {
      return NULL;
    }

    $subject = rawurlencode($params['subject']);

    $subject .= !empty($params['external_identifier'])
      ? rawurlencode(' -- Membership ID: ') . '{contact.external_identifier} '
      : '';

    $subject .= rawurlencode(' -- Mailing ID: ' . $params['id']);

    $mailToLink = $params['reply_address'];
    $mailToLink .= '?subject=' . $subject;

    return 'mailto:' . $mailToLink;
  }

  /**
   * Create or update CiviCRM mailing
   *
   * @param $params
   *
   * @return object
   */
  protected static function createCiviMailing($params) {
    $crmMailingParams = static::buildCiviMailingParams($params);

    $crmMailingId = array(
      'mailing_id' => isset($params['crm_mailing_id']) ? $params['crm_mailing_id'] : NULL
    );

    // Create or update CiviCRM mailing - a mailing job would be created (scheduled) if scheduled date has been set
    $crmMailing = CRM_Mailing_BAO_Mailing::create($crmMailingParams, $crmMailingId);

    return $crmMailing;
  }

  /**
   * Build the params array needed for creating CiviCRM mailing and related things (e.g. jobs), in a format required by
   * the CRM_Mailing_BAO_Mailing::create() method
   *
   * @param array $params
   *
   * @return array
   */
  protected static function buildCiviMailingParams($params) {
    $crmMailingParams = array();

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

    // Scheduler ID
    if (!empty($params['scheduled_id'])) {
      $crmMailingParams['scheduled_id'] = $params['scheduled_id'];
    }

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

    return $crmMailingParams;
  }

  /**
   * Create recipients for the mailing. This should ideally be done at the end of the wizard, while scheduling a mailing.
   *
   * @param int  $crmMailingId
   * @param bool $removeDuplicateEmails
   */
  protected static function createRecipients($crmMailingId, $removeDuplicateEmails) {
    CRM_Mailing_BAO_Mailing::getRecipients($crmMailingId, $crmMailingId, NULL, NULL, TRUE, $removeDuplicateEmails);
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
      $params['body'] = str_replace("\xA0", ' ', $params['body']);
    }

    if (!empty($params['from_address'])) {
      $params['from_address'] = html_entity_decode($params['from_address']);
    }

    // Reformat the scheduled date for a format required by CivCRM
    if (!empty($params['scheduled_date'])) {
      $dateTime = new DateTime($params['scheduled_date']);
      $params['scheduled_date'] = $dateTime->format('YmdHis');
    }
  }

  /**
   * @param $params
   *
   * @return bool
   */
  protected static function shouldRemoveDuplicateEmails($params) {
    return isset($params['dedupe_email']);
  }

  /////////////////////
  // Private methods //
  /////////////////////

  /**
   * @param int   $crmMailingId
   * @param array $newGroupEntityIds
   */
  private static function updateGroups($crmMailingId, $newGroupEntityIds) {
    list($existingGroups) = static::getRecipientGroups($crmMailingId);

    $existingGroupsWithEntityIdAsKeys = array();
    foreach ($existingGroups as $group) {
      $existingGroupsWithEntityIdAsKeys[$group['entity_id']] = $group;
    }

    $existingGroupEntityIds = array_keys($existingGroupsWithEntityIdAsKeys);

    $removedGroupEntityIds = array_diff($existingGroupEntityIds, $newGroupEntityIds);
    $addedGroupEntityIds = array_diff($newGroupEntityIds, $existingGroupEntityIds);

    // Add new groups
    foreach ($addedGroupEntityIds as $entityId) {
      static::createMailingGroup($crmMailingId, $entityId);
    }

    // Delete removed groups
    foreach ($removedGroupEntityIds as $entityId) {
      $removedGroup = $existingGroupsWithEntityIdAsKeys[$entityId];

      static::deleteMailingGroup($removedGroup['id']);
    }
  }

  /**
   * @param $crmMailingId
   */
  private static function updateSmartGroups($crmMailingId) {
    // Clearing this from session will make sure that we only create smart group for the mailing once - otherwise, duplicates would get created
    $smartGroupId = static::getSmartGroupIdFromSession(TRUE);

    if ($smartGroupId) {
      $dao = new CRM_Mailing_DAO_MailingGroup();

      $dao->reset();
      $dao->mailing_id = $crmMailingId;
      $dao->group_type = 'Include';
      $dao->entity_table = 'civicrm_group';
      $dao->entity_id = $smartGroupId;
      $dao->save();
    }
  }

  /**
   * @param bool $clearFromSession
   * TODO (robin): This is not accurate - if someone cancels the mailing from search and creates a new one (not from search), the new one will also get all the recipients from search. This would likely be a critical bug.
   *
   * @return mixed
   */
  private static function getSmartGroupIdFromSession($clearFromSession = FALSE) {
    $session = CRM_Core_Session::singleton();
    $sessionScope = CRM_Simplemail_Form_SimpleMailRecipientsFromSearch::getSessionScope();

    $smartGroupId = $session->get('smartGroupId', $sessionScope);

    if ($clearFromSession) {
      $session->resetScope($sessionScope);
    }

    return $smartGroupId;
  }

  /**
   * @return bool
   */
  public static function isCreatedFromSearch() {
    $createdFromSearch = static::getSmartGroupIdFromSession() != NULL;

    return array('values' => array(array('created_from_search' => $createdFromSearch)));
  }

  /**
   * @param $crmMailingId
   * @param $entityId
   */
  private static function createMailingGroup($crmMailingId, $entityId) {
    $group = new CRM_Mailing_DAO_MailingGroup();

    $group->reset();
    $group->mailing_id = $crmMailingId;
    $group->group_type = 'Include';
    $group->entity_table = 'civicrm_group';
    $group->entity_id = $entityId;
    $group->save();
  }

  /**
   * @param $mailingGroupId
   */
  private static function deleteMailingGroup($mailingGroupId) {
    $group = new CRM_Mailing_DAO_MailingGroup();

    $group->reset();
    $group->id = $mailingGroupId;
    $group->delete();
  }

}
