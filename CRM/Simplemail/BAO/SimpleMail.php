<?php

class CRM_Simplemail_BAO_SimpleMail extends CRM_Simplemail_DAO_SimpleMail {

  /**
   * Create a new SimpleMail based on array-data
   *
   * @param array $params key-value pairs
   *
   * @return CRM_Simplemail_DAO_SimpleMail|NULL
   */
  public static function create($params) {
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

    return array('is_error' => 0, 'values' => $mailings, 'dao' => $dao);
  }

  /**
   * Update recipient groups for the mailing - add new groups, and delete removed groups
   *
   * @param $params
   */
  public static function updateRecipientGroups($params) {
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

  ///////////////////////
  // Protected Methods //
  ///////////////////////

  protected static function getEmailTemplatePath() {
    // TODO (robin): Retrieve the extension directory from Core_Config
    $templateDir = 'civicrm_custom/extensions/compucorp/uk.co.compucorp.civicrm.simplemail/email-templates/';
    $templateFileName = 'wave.html';

    return $templateDir . $templateFileName;
  }

  protected static function generateEmailHtml($params) {
    // Setup paths
    $templateFile = static::getEmailTemplatePath();

    // Setup template variables
    $template = new stdClass();
    $template->title = isset($params['title']) && $params['title'] ? $params['title'] : NULL;
    $template->body = isset($params['title']) && $params['body'] ? $params['body'] : NULL;
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
    if (isset($params['scheduled_date'])) {
      $crmMailingParams['scheduled_date'] = str_replace(array('-', ':', ' '), '', $params['scheduled_date']) ?: NULL;
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
}
