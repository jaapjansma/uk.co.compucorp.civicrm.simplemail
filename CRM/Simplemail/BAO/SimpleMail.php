<?php

/**
 * Class CRM_Simplemail_BAO_SimpleMail
 * TODO (robin): Refactor the class to make it less reliant on static methods
 */
class CRM_Simplemail_BAO_SimpleMail extends CRM_Simplemail_DAO_SimpleMail {

  /**
   * This mailing group type is used for as an unsubscribe group for a mailing
   */
  const MAILING_GROUP_TYPE_BASE = 'Base';

  /**
   * This mailing group type is used for including contacts from the group in the mailing
   */
  const MAILING_GROUP_TYPE_INCLUDE = 'Include';

  /**
   * This mailing group type is used for excluding contacts from the group in the mailing
   */
  const MAILING_GROUP_TYPE_EXCLUDE = 'Exclude';

  /**
   * Status of mailing when it has been scheduled
   */
  const MAILING_STATUS_SCHEDULED = 'Scheduled';

  /**
   * status of mailing when it is currently running
   */
  const MAILING_STATUS_RUNNING = 'Running';

  /**
   * Status of mailing when it is currently paused
   */
  const MAILING_STATUS_PAUSED = 'Paused';

  /**
   * Yes, incorrectly spelt because that's the way it is in Civi!
   */
  const MAILING_STATUS_CANCELLED = 'Canceled';

  /**
   * Status of mailing when it's not yet been scheduled - more accurately, when a mailing job for the mailing has never
   * been created. Note that this is a calculated value (further down this class), and CiviCRM does not store this.
   */
  const MAILING_STATUS_NOT_SCHEDULED = 'Not Scheduled';

  const ACTION_ALLOWED_UPDATE = 'update';
  const ACTION_ALLOWED_DELETE = 'delete';
  const ACTION_ALLOWED_CANCEL = 'cancel';

  /**
   * Params that are required when submitting an email for mass mailing (i.e. when being scheduled).
   *
   * Note: include a sub-array to signify that at least one of the params in the sub-array must be provided.
   *
   * @var array
   */
  protected static $requiredParams = array(
    'crm_mailing_id' => 'CRM mailing ID',
    'scheduled_date' => 'schedule date',
    'category_id'    => 'category ID',
    array(
      'recipient_group_entity_ids'        => 'recipient group(s)',
      'hidden_recipient_group_entity_ids' => 'smart group'
    )
  );

  /**
   * This is used for storing mailing jobs between method calls
   *
   * @var null
   */
  private static $jobs = NULL;

  /////////////////
  // API Methods //
  /////////////////

  /**
   * Create or update a SimpleMail mailing and the corresponding CiviCRM mailing, along with other related tasks, such
   * as creating a mailing job for scheduling mass emailing.
   *
   * @param array $params key-value pairs
   *
   * @return \CRM_Simplemail_DAO_SimpleMail|NULL
   * @throws \CRM_Extension_Exception
   */
  public static function create($params) {
    if (!static::isActionAllowed(static::ACTION_ALLOWED_UPDATE, $params)) {
      throw new CRM_Extension_Exception('Cannot update a scheduled mailing',
        405);
    }

    if (simplemail_civicrm_getFromSessionScope('createdFromSearch')) {
      static::createSmartContactGroupForSearchContacts();
    }

    static::sanitiseParams($params);

    // buids the mailing to be sent
    // things like the email body etc
    $civiMailing = static::createCiviMailing($params);

    if ($civiMailing->id) {
      $params['crm_mailing_id'] = $civiMailing->id;
    }

    static::updateRecipientGroups($params);
    static::setMailingCategory($params);

    $entityName = 'SimpleMail';

    $hook = empty($params['id']) ? 'create' : 'edit';

    CRM_Utils_Hook::pre($hook, $entityName,
      CRM_Utils_Array::value('id', $params), $params);
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
   * @param bool $useWhere
   *
   * @return mixed|void
   * @throws \CRM_Extension_Exception
   */
  public function delete($useWhere = FALSE) {
    if (!static::authorised(SM_PERMISSION_DELETE)) {
      throw new CRM_Extension_Exception('Sorry! You do not have permission to delete mailings',
        500);
    }
    if (!static::isActionAllowed(static::ACTION_ALLOWED_DELETE,
      $this->toArray())
    ) {
      throw new CRM_Extension_Exception('Cannot delete a scheduled/running mailing',
        405);
    }
    if (!$this->crm_mailing_id) {
      throw new CRM_Extension_Exception(
        'Failed to delete mailing it does not have a corresponding CiviCRM mailing associated',
        500
      );
    }

    // Delete the inline attachments first, because they are tied to a cascade delete on the simple mailing table
    $attachments = CRM_Simplemail_BAO_SimpleMailInlineAttachment::removeAll((int) $this->id);

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
    if (!static::isActionAllowed(static::ACTION_ALLOWED_CANCEL, $params)) {
      throw new CRM_Extension_Exception('Cannot cancel the mailing',
        405);
    }
    if (empty($params['crm_mailing_id'])) {
      throw new CRM_Extension_Exception('Failed to cancel mass mailing as CiviCRM mailing ID not available',
        500);
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
    try {
      static::sanitiseParams($params);
      static::validateOnSchedule($params);

      $params['scheduled_id'] = CRM_Core_Session::singleton()->get('userID');

      $params['approval_date'] = date('YmdHis');
      $params['approval_status_id'] = 1;

      /* Scheduled mailing jobs are being updated first here as it will help in two ways:
         *
         * 1. In case mass mailing was being submitted for the first time, there won't be any jobs for it. The update method
         *    would simply not find any jobs and therefore won't have to save any records.
         *
         * 2. CRM_Mailing_BAO_Mailing::create() created a mailing job if one does not exist yet. For such situation, if the
         *    update method was used after the create() method below, the mailing job's scheduled date would be updated
         *    unnecessarily.
        */
      // Update: This is no longer needed since updating an already scheduled
      // or running mailing is no longer allowed
//      static::updateScheduledMailingJobs($params);

      // This wouldn't have been needed if CRM_Mailing_BAO_Mailing::create() was able to run getRecipients() itself
      // towards the end, which unfortunately fails due to a bug in the add() method where it instantiates the DAO
      // instead of the BAO!
      static::createRecipients((int) $params['crm_mailing_id'],
        static::shouldRemoveDuplicateEmails($params));

      $dao = static::create($params);

      // This is only done once the mailing is finally 'scheduled' for sending. We can't do this step before, since
      // someone might decide to change the mailing category on a future date, before mailing has been scheduled, and it
      // won't be possible to remove back the contacts which were added to the prior group since there is no way of
      // know this from the current data structure.
      // Once the mailing has been scheduled, we can simply disable changing the mailing category altogether, so that
      // no one can change the mailing category :)
      static::updateMailingCategoryContacts($params);

      return array('values' => $dao->toArray(), 'dao' => $dao);
    } catch (CRM_Extension_Exception $e) {
      $errorMsg = $e->getMessage();
      $errorCode = $e->getErrorCode() ?: 405;
      $errorData = $e->getErrorData() ?: array('dao' => NULL);

      throw new CRM_Extension_Exception($errorMsg, $errorCode, $errorData);
    }
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

    $isSingle = isset($params['id']);

    $whereClause = $isSingle ? 'sm.id = ' . (int) $params['id'] : 'true';

    if (!CRM_Core_Permission::check('manage all CiviSimpleMail mails')) {

      $session = CRM_Core_Session::singleton();
      $contactId = $session->get('userID');
      $whereClause .= ' AND cm.created_id = ' . $contactId . ' ';

    }

    $query
      = "
    SELECT
      sm.id, sm.crm_mailing_id, sm.from_address, sm.header_id, sm.title, sm.body, sm.contact_details, sm.message_id, sm.reply_address,
      cm.name, cm.subject, cm.body_html, cm.from_name, cm.created_id, cm.created_date, cm.scheduled_id, cm.scheduled_date, cm.dedupe_email,
      MIN(j.start_date) start_date, MAX(j.end_date) end_date, j.status, sm.social_link,
      c.sort_name,
      GROUP_CONCAT(DISTINCT CONCAT(g.id, ':', g.is_hidden, ':', g.group_type)) recipient_group_entities

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
    ON mg.entity_id = g.id

    WHERE $whereClause

    GROUP BY sm.id
    ";


    $mailings = array();

    try {
      /** @var CRM_Core_DAO $dao */
      $dao = CRM_Core_DAO::executeQuery($query);

      while ($dao->fetch()) {
        $mailing = $dao->toArray();

        $mailing['status'] =
          $mailing['status'] ?: static::MAILING_STATUS_NOT_SCHEDULED;

        $groups = explode(',', $mailing['recipient_group_entities']);

        $groupIds = $hiddenGroupIds = array();
        $categoryId = NULL;

        foreach ($groups as $group) {
          $id = strtok($group, ':');
          $isHidden = strtok(':');
          $groupTypes = strtok(':');
          $groupTypes =
            explode(CRM_Core_DAO::VALUE_SEPARATOR, substr($groupTypes, 1, -1));

          if ($isHidden) {
            $hiddenGroupIds[] = $id;
          }
          else {
            if (in_array(SM_MAILING_CATEGORY_GROUP_TYPE_VALUE, $groupTypes)) {
              $categoryId = $id;
            }
            else {
              $groupIds[] = $id;
            }
          }
        }

        $mailing['recipient_group_entity_ids'] = $groupIds;
        $mailing['hidden_recipient_group_entity_ids'] = $hiddenGroupIds;
        $mailing['category_id'] = $categoryId;

        // we don't need this in the output
        unset($mailing['recipient_group_entities']);

        $mailings[] = $mailing;
      }
    } catch (Exception $e) {

      $dao = isset($dao) ? $dao : NULL;

      throw new CRM_Extension_Exception('Failed to retrieve mailings: '
        . $e->getMessage(), 500, array('dao' => $dao));
    }

    $mailings = static::postProcessMailings($params, $mailings);

    $extraValues = static::getExtraValuesForMailings($params, $mailings);

    return array(
      'values'      => $mailings,
      'dao'         => $dao,
      'extraValues' => $extraValues
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
        'Failed to send test email as CiviCRM mailing ID not provided', 405,
        array('dao' => NULL)
      );
    }

    $jobIds = array();
    $jobs = array();

    if ($params['groupId'] || $params['emails']) {
      if ($params['groupId']) {
        $jobs[] = static::sendTestEmailToGroup($params['crmMailingId'],
          $params['groupId']);
      }
      if ($params['emails']) {
        $jobs[] = static::sendTestEmailToIndividuals($params['crmMailingId'],
          $params['emails']);
      }
    }
    else {
      throw new CRM_Extension_Exception(
        'Failed to send test email as no recipient provided', 405,
        array('dao' => NULL)
      );
    }

    foreach ($jobs as $job) {
      $jobIds[] = $job->id;
      $job->free();
    }

    return array('values' => array(array('jobIds' => $jobIds)));
  }

  /**
   * @return array
   */
  public static function isCreatedFromSearch() {
    $createdFromSearch =
      simplemail_civicrm_getFromSessionScope('createdFromSearch');

    return array('values' => array(array('answer' => $createdFromSearch)));
  }


  public static function getSearchContacts() {
    $contactIds = simplemail_civicrm_getFromSessionScope('contactIds');
    $contactCount = simplemail_civicrm_getFromSessionScope('contactCountFromSearch');
    return array(
      'contactIds'   => $contactIds,
      'contactCount' => $contactCount
    );
  }

  public static function getMailingContacts($entityId, $mailingId) {

    $retry = 0;
    $foundContacts = FALSE;

    do {
      $sql = "
				SELECT COUNT(*) AS total
				FROM civicrm_group_contact_cache
				WHERE group_id = '" . (int) $entityId . "'
			";

      try {
        $dao = CRM_Core_DAO::executeQuery($sql);
        $dao->fetch();
        $row = $dao->toArray();

        if ($row['total'] == 0) {
          CRM_Mailing_BAO_Mailing::getRecipients($mailingId, $mailingId, NULL,
            NULL, TRUE, TRUE);
        }
        else {
          $foundContacts = $row['total'];
        }
      } catch (Exception $e) {
        throw new CRM_Extension_Exception("Error finding contacts: "
          . $e->getMessage(), 500, array('dao' => $dao));
      }

      $retry++;
    } while (($retry <= 1) && !$foundContacts);

    return $foundContacts;

  }

  /**
   * Updates an email body and changes all the images to point to HTTPS or vice-versa
   *
   * @param string  $emailBody the email body of text to update
   * @param boolean $makeHttps whether the images should be made to point to HTTPS or not (HTTP)
   *
   * @return string
   */
  public static function updateEmailBodyHttps(
    $emailBody,
    $makeHttps = TRUE
  ) {        // Should there be SSL content in the email?

    if ($makeHttps) {
      $from = 'http://';
      $to = 'https://';
    }
    else {
      $from = 'https://';
      $to = 'http://';
    }

    // match any img tags, and replace the https://  ...
    $regex = '|(<img.*?src=["]?)' . $from . '|';

    // ... for http://
    $emailBody = preg_replace($regex, '$1' . $to, $emailBody);

    return $emailBody;

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
   * Update recipient groups for the mailing - add new groups, and delete removed groups
   *
   * @param $params
   *
   * @return void
   */
  protected static function updateRecipientGroups($params) {
    if (!empty($params['recipient_group_entity_ids'])) {
      static::updateMailingRecipientGroups((int) $params['crm_mailing_id'],
        $params['recipient_group_entity_ids']);
    }

    if ($smartContactGroupId =
      simplemail_civicrm_getFromSessionScope('smartGroupId')
    ) {
      static::createMailingGroupForSmartContactGroup((int) $params['crm_mailing_id'],
        $smartContactGroupId);

      // Clearing the session scope will essentially clear the smart contact group ID from the session, which will make
      // sure that we only create mailing group for the smart contact group only once, as otherwise duplicates would get
      // created
      simplemail_civicrm_clearSessionScope();
    }
  }

  /**
   * Validate upon submission of mass mailing (i.e. once it's been scheduled)
   *
   * @param $params
   *
   * @throws CRM_Extension_Exception
   */
  protected static function validateOnSchedule($params) {
    $errors = array();

    foreach (static::$requiredParams as $param => $name) {
      // Process the 'at least one' clause
      if (is_array($name)) {
        $allEmpty = TRUE;
        foreach ($name as $eitherParam => $eitherName) {
          if (!empty($params[$eitherParam])) {
            $allEmpty = FALSE;
            break;
          }
        }

        if ($allEmpty) {
          $errors[] =
            '<li>Neither of these provided: ' . implode(', ', $name) . '</li>';
        }
      }
      // Process the usual required param
      else {
        if (empty($params[$param])) {
          $errors[] = '<li>' . ucfirst($name) . ' not provided</li>';
        }
      }
    }

    if ($errors) {
      throw new CRM_Extension_Exception('<ul>' . implode('', $errors)
        . '</ul>');
    }
  }

  /**
   * Set or update the category of the mailing.
   *
   * A mailing category is simply a mailing group of type 'Mailing Category', in addition to being of type 'Mailing
   * List'.
   *
   * A mailing can only ever be associated with one category (i.e. mailing group of type 'Mailing Category')
   *
   * @param $params
   *
   * @return $this
   */
  protected static function setMailingCategory($params) {
    if (!empty($params['category_id'])) {
      $group = new CRM_Mailing_DAO_MailingGroup();

      $group->reset();
      $group->selectAdd('*');

      $group->mailing_id = $params['crm_mailing_id'];
      $group->group_type = static::MAILING_GROUP_TYPE_BASE;
      $group->entity_table = 'civicrm_group';

      if ($group->find(TRUE)) {
        $group->entity_id = $params['category_id'];

        return $group->save();
      }

      $group->entity_id = $params['category_id'];

      return $group->save();
    }
  }

  /**
   * Update the list of contacts associated with a mailing category (i.e. group of type 'Mailing Category'), by adding
   * contacts from the recipient groups (normal or smart), which are not already included in the mailing category,
   * to the mailing category.
   *
   * @param $params
   *
   * @throws CRM_Extension_Exception
   */
  protected static function updateMailingCategoryContacts($params) {
    if (empty($params['category_id'])) {
      throw new CRM_Extension_Exception(
        'Failed to update mailing category as category ID not provided', 405,
        array('dao' => NULL)
      );
    }

    if (empty($params['recipient_group_entity_ids'])
      && empty($params['hidden_recipient_group_entity_ids'])
    ) {
      throw new CRM_Extension_Exception(
        'Failed to update mailing category as neither recipient nor smart group ID not provided',
        405,
        array('dao' => NULL)
      );
    }

    // This is needed in order to process large group concat - MySQL's default is a measly 1024 characters
    CRM_Core_DAO::executeQuery('SET group_concat_max_len = 1000000');

    $groupEntityIds = empty($params['recipient_group_entity_ids'])
      ? array()
      : $params['recipient_group_entity_ids'];

    $hiddenGroupEntityIds = empty($params['hidden_recipient_group_entity_ids'])
      ? array()
      : $params['hidden_recipient_group_entity_ids'];

    $groupIds =
      implode(', ', array_merge($groupEntityIds + $hiddenGroupEntityIds));

    $query =
      "SELECT GROUP_CONCAT(DISTINCT contact_id) contact_ids
         FROM civicrm_group_contact
         WHERE
         	group_id IN (%0)
         	AND status = %1";

    $queryParams = array(
      array($groupIds, 'String'),
      array('Added', 'String')
    );

    $dao = CRM_Core_DAO::executeQuery($query, $queryParams);

    /** @var array IDs of contacts included in the mailing recipient *group* currently selected $contactIds */
    $contactIds = $dao->fetch() ? explode(',', $dao->contact_ids) : array();

    $dao = CRM_Core_DAO::executeQuery(
      'SELECT GROUP_CONCAT(contact_id) contact_ids FROM civicrm_group_contact WHERE group_id = %0',
      array(array($params['category_id'], 'Integer'))
    );

    /** @var array IDs of contacts included in the mailing *category* currently selected $existingContactIds */
    $existingContactIds =
      $dao->fetch() ? explode(',', $dao->contact_ids) : array();

    /** @var array IDs of contacts which are included in the mailing recipient group but not in the category (i.e.
     * which need to be added to the category) $newContactIds */
    $newContactIds = array_diff($contactIds, $existingContactIds);

    // Add contacts currently in the mailing groups (normal as well as smart groups), but not already in mailing
    // category group, to the mailing category group
    if ($newContactIds && $newContactIds[0]) {
      $result = CRM_Contact_BAO_GroupContact::addContactsToGroup($newContactIds,
        $params['category_id']);
    }

    // Set the group type to 'NULL' for mailing groups which are set as 'Include'. This is to ensure that there is
    // only one mailing group (i.e. a category) from which a recipient can unsubscribe from.
    // Note that this is done now (i.e. during scheduling and after the recipient list has been prepared for the
    // mailing), as doing this anytime before would lead to no recipients being created since the mailing groups
    // from which to create recipients would have group type set as 'NULL' (and recipients are only created from
    // groups which have type set to 'Include' and excluded from ones which have it as 'Exclude)
    static::unsetGroupTypeForMailingGroups($params['crm_mailing_id']);
  }

  /**
   * @param $crmMailingId
   *
   * @return array
   */
  protected static function getRecipientGroups($crmMailingId) {
    $sql
      = "SELECT
    	  mg.*,
    	  g.is_hidden, g.saved_search_id, g.group_type
        FROM civicrm_mailing_group mg
        LEFT JOIN civicrm_group g
        ON mg.entity_id = g.id
        WHERE mg.mailing_id = $crmMailingId";

    /** @var CRM_Core_DAO|CRM_Mailing_DAO_MailingGroup|CRM_Contact_BAO_Group $dao */
    $dao = CRM_Core_DAO::executeQuery($sql);

    $groups = $smartGroups = array();
    $category = NULL;

    while ($dao->fetch()) {
      if ($dao->is_hidden) {
        $smartGroups[] = $dao->toArray();
      }
      else {
        $groupTypes = explode(CRM_Core_DAO::VALUE_SEPARATOR,
          substr($dao->group_type, 1, -1));
        if (in_array(SM_MAILING_CATEGORY_GROUP_TYPE_VALUE, $groupTypes)) {
          $category = $dao->toArray();
        }
        else {
          $groups[] = $dao->toArray();
        }
      }
    }

    return array($groups, $smartGroups, $category);
  }

  /**
   * Update scheduled jobs for the mailing
   *
   * @deprecated Once scheduled, the mailing should not be allowed to be updated
   *
   * @param $params
   *
   * @throws CRM_Extension_Exception
   */
  protected static function updateScheduledMailingJobs($params) {
    if (empty($params['scheduled_date'])) {
      throw new CRM_Extension_Exception(
        'Failed to update scheduled job(s) for the mailing as scheduled date not provided',
        405, array('dao' => NULL)
      );
    }

    static::rescheduleMailingJobs($params['crm_mailing_id'],
      $params['scheduled_date']);
  }

  /**
   * Reschedule jobs for a mailing given by CiviCRM mailing ID
   *
   * @deprecated Once scheduled, the mailing should not be allowed to be updated
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

  /**
   * @param $mailingId
   * @param $groupId
   *
   * @return CRM_Mailing_BAO_MailingJob
   */
  protected static function sendTestEmailToGroup($mailingId, $groupId) {
    $job = static::createTestMailingJob($mailingId);

    static::runTestEmailJobs($job, $groupId);

    return $job;
  }

  /**
   * @param $mailingId
   * @param $emails
   *
   * @return CRM_Mailing_BAO_MailingJob
   */
  protected static function sendTestEmailToIndividuals($mailingId, $emails) {
    $job = static::createTestMailingJob($mailingId);

    $emailArr = explode(',', $emails);

    array_walk(
      $emailArr, function (&$email) {
      $email = trim($email);
    }
    );

    $emailStr = implode(
      ', ', array_map(
        function ($email) {
          return '\'' . $email . '\'';
        }, $emailArr
      )
    );

    $query = "
      SELECT e.id, e.contact_id, e.email
      FROM civicrm_email e

      INNER JOIN civicrm_contact c ON e.contact_id = c.id

      WHERE e.email IN ($emailStr)
        AND e.on_hold = 0
        AND c.is_opt_out = 0
        AND c.do_not_email = 0
        AND c.is_deceased = 0

      GROUP BY e.id
      ORDER BY e.is_bulkmail DESC, e.is_primary DESC
    ";

    $dao = CRM_Core_DAO::executeQuery($query);

    $emailDetail = array();
    // fetch contact_id and email id for all existing emails
    while ($dao->fetch()) {
      $emailDetail[$dao->email] = array(
        'contact_id' => $dao->contact_id,
        'email_id'   => $dao->id,
      );
    }

    $dao->free();
    foreach ($emailArr as $email) {
      $email = trim($email);
      $contactId = $emailId = NULL;
      if (array_key_exists($email, $emailDetail)) {
        $emailId = $emailDetail[$email]['email_id'];
        $contactId = $emailDetail[$email]['contact_id'];
      }

      if (!$contactId) {
        //create new contact.
        $createParams = array(
          'contact_type' => 'Individual',
          'email'        => array(
            1 => array(
              'email'            => $email,
              'is_primary'       => 1,
              'location_type_id' => 1,
            )
          ),
        );
        $contact = CRM_Contact_BAO_Contact::create($createParams);
        $emailId = $contact->email[0]->id;
        $contactId = $contact->id;
        $contact->free();
      }

      $queueParams = array(
        'job_id'     => $job->id,
        'email_id'   => $emailId,
        'contact_id' => $contactId,
      );

      CRM_Mailing_Event_BAO_Queue::create($queueParams);
    }

    static::runTestEmailJobs($job);

    return $job;
  }

  /**
   * Get the path of the email template to be used for rendering the email HTML body
   *
   * @return string
   */
  protected static function getEmailTemplatePath() {
    // TODO (robin): Probably add template dir as a constant
    $templateDir = simplemail_civicrm_getExtensionDir() . 'email-templates'
      . DIRECTORY_SEPARATOR;
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

    $twoColumn = new CRM_Simplemail_BAO_TwoColumn();
    $template->isTwoColumn = $twoColumn->isTwoColumn($template->body);
    if ($template->isTwoColumn) {
      list($bodyColumn1, $bodyColumn2) =
        $twoColumn->getColumns($template->body);
      $template->bodyColumn1 = $bodyColumn1;
      $template->bodyColumn2 = $bodyColumn2;
    }

    $template->facebookUrl =
      static::getOptionValue('email_social_facebook_links',
        $params['social_link']);
    $template->twitterUrl = static::getOptionValue('email_social_twitter_links',
      $params['social_link']);

    static::updateSignature($template->body);

    $template->contactDetails =
      isset($params['contact_details']) && $params['contact_details']
        ? $params['contact_details']
        : NULL;
    // TODO (robin): Make this dynamic as useful when testing on a dev box
    $template->unsubscribeLink = static::getOptOutLink();

    // Retrieve header if the mailing has one, and assign header and logo images in the template accordingly
    if (isset($params['header_id'])) {
      $header = new CRM_Simplemail_BAO_SimpleMailHeader();
      $header->id = (int) $params['header_id'];

      // TODO (robin): Change this to the form if ($header->find(TRUE) { ... } and test
      $header->find();

      if ($header->fetch()) {
        $template->headerImage = $header->image
          ? CRM_Simplemail_BAO_SimpleMailHeader::getImageUrl($header->image,
            'image')
          : NULL;

        $template->logo = $header->show_logo && $header->logo_image
          ? CRM_Simplemail_BAO_SimpleMailHeader::getImageUrl($header->logo_image,
            'logo_image')
          : NULL;
      }
    }

    // Retrieve campaign message if the mailing has one, and assign campaign text in the template accordingly
    if (isset($params['message_id'])) {
      $message = new CRM_Simplemail_BAO_SimpleMailMessage();
      $message->id = (int) $params['message_id'];

      // TODO (robin): Change this to the form if ($header->find(TRUE) { ... } and test
      $message->find();

      if ($message->fetch()) {
        $template->campaignMessage = $message->text ?: NULL;
      }
    }

    // Output parsed template
    ob_start();

    require $templateFile;

    $emailBody = ob_get_clean();

    ob_end_clean();


    return $emailBody;

  }

  /**
   * Searches the email body for signature tags {signature} or {xxx_signature} and replaces
   * it with a graphic that is of the user's signature
   */
  protected static function updateSignature(&$body) {
    $matches = array();
    $total = preg_match_all('/\{(.*)signature\}/', $body, $matches);

    if (!$total) {
      return;
    }

    $sigMatches = array_unique($matches[0]);
    $sigNames = array_unique($matches[1]);

    foreach ($sigMatches as $index => $match) {
      $name = $sigNames[$index];
      if (strlen($name) > 0) {
        // trim the trailing underscore
        $name = substr($name, 0, -1);
      }
      $filename =
        CRM_Simplemail_BAO_SimpleMailHelper::getSignatureFilename($name);

      $replacement =
        (!empty($filename) ? '<img src="' . $filename . '" />' : '');
      $body = str_replace($sigMatches[$index], $replacement, $body);

    }

  }


  /**
   * Uses the Civi API to retrieve an option value from the specified option group
   * For example, there may be an Option Group called: email_social_facebook_links
   * And contained within that group is an Option Value with the name 'UK'
   *
   * So you would pass in the parameteres:
   * $optionGroupName = 'email_social_facebook_links'
   * $optionValueName = 'UK'
   *
   * @return {String}
   */
  protected static function getOptionValue($optionGroupName, $optionValueName) {
    $optionGroupResult = civicrm_api('OptionGroup', 'getvalue', array(
      'version' => '3',
      'name'   => $optionGroupName,
      'return' => 'id'
    ));

    if (!$optionGroupResult) {
      throw new CRM_Extension_Exception("Error finding option group ($optionGroupName)");
    }

    $optionValueResult = civicrm_api('OptionValue', 'get', array(
      'version'   => '3',
      'option_group_id' => $optionGroupResult,
      'label'     => $optionValueName,
      'is_active' => '1'
    ));

    if (!$optionValueResult) {
      throw new CRM_Extension_Exception("Error finding option value ($optionValueName)");
    }

    if ($optionValueResult['is_error']) {
      throw new CRM_Extension_Exception("No option found with value ($optionValueName)");
    }

    // Get the values array from the result
    $values = $optionValueResult['values'];

    // the $values array is an associative array and we don't know the key,
    /// so use "each" to extract the kv pair
    list($key, $value) = each($values);
    $firstResult = $value;

    // return the actual value that is stored in the OptionValue
    return $firstResult['value'];
  }

  /**
   * Generate the link for mailto for the reply button in the template
   *
   * @param $params
   *
   * @return string
   */
  protected static function getMailToLink($params) {
    if (empty($params['reply_address']) || empty($params['subject'])
      || empty($params['id'])
    ) {
      return NULL;
    }

    $subject = rawurlencode($params['subject']);
    $subject .= rawurlencode(' -- Membership ID: ')
      . '{contact.external_identifier} ';
    $subject .= rawurlencode(' -- Mailing ID: ' . $params['id']);

    $mailToLink = $params['reply_address'];
    $mailToLink .= '?subject=' . $subject;

    return 'mailto:' . $mailToLink;
  }

  /**
   * Get the URL for opting out of all emails. Currently, this has been hardcoded to a certain webform that handles
   * unsubscribe from all operation.
   *
   * @return string
   */
  protected function getOptOutLink() {
    return CRM_Core_Config::singleton()->userFrameworkBaseURL
    . 'node/5?cid1={contact.contact_id}&{contact.checksum}';
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
      'mailing_id' => isset($params['crm_mailing_id'])
        ? $params['crm_mailing_id'] : NULL
    );

    // Create or update CiviCRM mailing - a mailing job would be created (scheduled) if scheduled date has been set
    $crmMailing =
      CRM_Mailing_BAO_Mailing::create($crmMailingParams, $crmMailingId);

    return $crmMailing;
  }

  /**
   * Build the params array needed for creating CiviCRM mailing and related things (e.g. jobs), in a format required by
   * the CRM_Mailing_BAO_Mailing::create() method
   *
   * This builds things like the email body
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

      $crmMailingParams['from_name'] =
        empty($params['from_name']) ? $fromName : $params['from_name'];
      $crmMailingParams['from_email'] = $fromEmail;
    }

    // Mailing subject
    if (isset($params['subject'])) {
      $crmMailingParams['subject'] = $params['subject'];
    }

    // Body HTML
    $crmMailingParams['body_html'] = static::generateEmailHtml($params);

    // check if we're allowing SimpleMail to send emails with SSL / HTTPS linked content
    // this is controlled by SM_CONTENT_SSL
    // if we're not allowing SSL/HTTPS content then this method rewrites HTTPS to HTTP
    $crmMailingParams['body_html'] = static::updateEmailBodyHttps(
      $crmMailingParams['body_html'],
      SM_CONTENT_SSL
    );

    // Scheduler ID - this is only set when submitting for mass emailing (last page of the wizard)
    if (!empty($params['scheduled_id'])) {
      $crmMailingParams['scheduled_id'] = $params['scheduled_id'];
    }

    // Scheduled date - this is being defaulted to null so as to disallow the core mailing BAO from scheduling the
    // mailing with default date (in v4.4.6), which is incorrect for SimpleMail's setup as the mailing isn't scheduled
    // until the last step of the wizard at which point it is set
    $crmMailingParams['scheduled_date'] =
      empty($params['scheduled_date']) ? NULL : $params['scheduled_date'];

    // Approval date - this is being defaulted to null because of the same reason above
    $crmMailingParams['approval_date'] =
      empty($params['approval_date']) ? NULL : $params['approval_date'];

    // Approval status ID - this is only set when submitting for mass emailing (last page of the wizard)
    if (!empty($params['approval_status_id'])) {
      $crmMailingParams['approval_status_id'] = $params['approval_status_id'];
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
  protected static function createRecipients(
    $crmMailingId,
    $removeDuplicateEmails
  ) {
    CRM_Mailing_BAO_Mailing::getRecipients($crmMailingId, $crmMailingId, NULL,
      NULL, TRUE, $removeDuplicateEmails);
  }

  /**
   * Sanitise the params in order to make it conform to the requirements of the entity
   * TODO (robin): This could be moved to the constructor when migrating to instance methods for the class from the current static ones
   *
   * @param $params
   */
  protected static function sanitiseParams(&$params) {
    if (!empty($params['id'])) {
      $params['id'] = (int) $params['id'];
    }
    if (!empty($params['crm_mailing_id'])) {
      $params['crm_mailing_id'] = (int) $params['crm_mailing_id'];
    }

    if (!empty($params['from_name'])) {
      $params['from_address'] =
        preg_replace('/\".+\"/', '"' . $params['from_name'] . '"',
          $params['from_address']);
    }
    if (!empty($params['body'])) {
      // Decode the encoded HTML entities (due to sending data via HTTP POST) back to HTML for saving into the DB
      $params['body'] =
        html_entity_decode($params['body'], ENT_NOQUOTES, 'UTF-8');
    }
    if (!empty($params['contact_details'])) {
      // Decode the encoded HTML entities (due to sending data via HTTP POST) back to HTML for saving into the DB
      $params['contact_details'] =
        html_entity_decode($params['contact_details']);

      // Replace nbsp; with space as otherwise it will make MySQL save fail
      $params['contact_details'] =
        str_replace("\xA0", ' ', $params['contact_details']);
    }
    if (!empty($params['from_address'])) {
      // Decode the encoded HTML entities (due to sending data via HTTP POST) back to HTML for saving into the DB
      $params['from_address'] = html_entity_decode($params['from_address']);
    }

    // Reformat the scheduled date for a format required by CivCRM
    if (!empty($params['created_date'])) {
      $dateTime = new DateTime($params['created_date']);
      $params['created_date'] = $dateTime->format('YmdHis');
    }
    if (!empty($params['scheduled_date'])) {
      // This will get rid of the double timezone specification error (where sometimes the timezone is also included
      // wrapped up in braces towards the end)
      $dateTime =
        new DateTime(preg_replace('/\(.+?\)/', '', $params['scheduled_date']));
      $params['scheduled_date'] = $dateTime->format('YmdHis');
    }
    if (!empty($params['approval_date'])) {
      $dateTime = new DateTime($params['approval_date']);
      $params['approval_date'] = $dateTime->format('YmdHis');
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
  // Private Methods //
  /////////////////////

  private function postProcessMailings($params, $mailings) {
    $isSingle = isset($params['id']);

    if ($isSingle) {
      // check to see how this script is being requested
      $isHttpsConnection = !empty($_SERVER['HTTPS']);

      // if the call to this method is over HTTPS, then we return content to the front end
      // with HTTPS linked content (in the email body)
      // And if it's a HTTP call, then return HTTP linked content
      $emailBody = CRM_Simplemail_BAO_SimpleMail::updateEmailBodyHttps(
        $mailings[0]['body_html'],
        $isHttpsConnection
      );

      $mailings[0]['body_html'] = $emailBody;
    }

    foreach ($mailings as &$mailing) {
      // part of this code was taken straight from sites/all/modules/civicrm/CRM/Mailing/BAO/Mailing.php
      // but it doesn't quite fit our needs
      //$value['report_url'] = CRM_Utils_System::url('civicrm/mailing/report', 'reset=1&html=1&mid=' . $value['crm_mailing_id']);
      $mailing['report_url'] = '/civicrm/mailing/report?reset=1&html=1&mid='
        . $mailing['crm_mailing_id'];
    }

    return $mailings;
  }

  private static function getExtraValuesForMailings($params, array $mailings) {
    $values = [];
    $values['userId'] = CRM_Core_Session::singleton()->get('userID');

    $isSingle = isset($params['id']);
    if ($isSingle) {
      $mailing = reset($mailings);

      if ($entities = $mailing['hidden_recipient_group_entity_ids']) {
        $entityId = $entities[0];
        $mailingId = $mailing['crm_mailing_id'];

        $apiResult = civicrm_api('GroupContact', 'getcount', array(
          'version'  => 3,
          'group_id' => $entityId
        ));

        if (!$apiResult) {
          $contactsCount =
            (int) CRM_Simplemail_BAO_SimpleMail::getMailingContacts(
              $entityId, $mailingId
            );
        }
        else {
          $contactsCount = (int) $apiResult;
        }

        if ($contactsCount) {
          $values['contactsCount'] = $contactsCount;
        }
      }
    }

    return $values;
  }

  private static function isActionAllowed($action, $params) {
    switch ($action) {
      case static::ACTION_ALLOWED_UPDATE:
        return static::isUpdateActionAllowed($params);

      case static::ACTION_ALLOWED_DELETE:
        return static::isDeleteActionAllowed($params);

      case static::ACTION_ALLOWED_CANCEL:
        return static::isCancelActionAllowed($params);
    }

    return TRUE;
  }

  private static function isUpdateActionAllowed($params) {
    return static::isScheduled($params) || static::isRunning($params) ? FALSE : TRUE;
  }

  private static function isDeleteActionAllowed($params) {
    return static::isScheduled($params) || static::isRunning($params) ? FALSE : TRUE;
  }

  private static function isCancelActionAllowed($params) {
    return static::isScheduled($params) || static::isRunning($params) ? TRUE : FALSE;
  }

  /**
   * @param $params
   *
   * @return bool
   */
  private static function isScheduled($params) {
    if ($jobs = static::getMailingJobs($params)) {
      foreach ($jobs as $job) {
        if ($job['status'] === static::MAILING_STATUS_SCHEDULED) {
          return TRUE;
        }
      }
    }

    return FALSE;
  }

  /**
   * @param $params
   *
   * @return bool
   */
  private static function isRunning($params) {
    if ($jobs = static::getMailingJobs($params)) {
      foreach ($jobs as $job) {
        if ($job['status'] === static::MAILING_STATUS_RUNNING) {
          return TRUE;
        }
      }
    }

    return FALSE;
  }

  private static function getMailingJobs($params) {
    if (is_array(static::$jobs)) {
      return static::$jobs;
    }

    static::$jobs = array();

    if (!$params['crm_mailing_id']) {
      return static::$jobs;
    }

    $jobBao = new CRM_Mailing_BAO_MailingJob();

    // This needs to be done as there can only be one query per DAO (see docs for reset()) - without this, the DAO
    // object was keeping residual data from previous operations elsewhere on the same DAO, making the below operations
    // unpredictable and fail
    $jobBao->reset();

    // This is needed as the reset() above clears the query completely
    $jobBao->selectAdd('*');

    $jobBao->mailing_id = $params['crm_mailing_id'];
    $jobBao->is_test = 0;

    if ($jobBao->find()) {
      while ($jobBao->fetch()) {
        static::$jobs[] = $jobBao->toArray();
      }
    }

    $jobBao->free();

    return static::$jobs;
  }

  /**
   * @param int   $crmMailingId
   * @param array $newGroupEntityIds
   */
  private static function updateMailingRecipientGroups(
    $crmMailingId,
    $newGroupEntityIds
  ) {
    list($existingGroups) = static::getRecipientGroups($crmMailingId);

    $existingGroupsWithEntityIdAsKeys = array();
    foreach ($existingGroups as $group) {
      $existingGroupsWithEntityIdAsKeys[$group['entity_id']] = $group;
    }

    $existingGroupEntityIds = array_keys($existingGroupsWithEntityIdAsKeys);

    $removedGroupEntityIds =
      array_diff($existingGroupEntityIds, $newGroupEntityIds);
    $addedGroupEntityIds =
      array_diff($newGroupEntityIds, $existingGroupEntityIds);

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
   * @param $smartContactGroupId
   */
  private static function createMailingGroupForSmartContactGroup(
    $crmMailingId,
    $smartContactGroupId
  ) {
    static::createMailingGroup($crmMailingId, $smartContactGroupId);
  }

  /**
   * @param        $crmMailingId
   * @param        $entityId
   * @param string $groupType
   */
  private static function createMailingGroup(
    $crmMailingId,
    $entityId,
    $groupType = 'Include'
  ) {
    $group = new CRM_Mailing_DAO_MailingGroup();

    $group->reset();
    $group->mailing_id = $crmMailingId;
    $group->group_type = $groupType;
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

  /**
   * TODO: Find a way to move this into CRM_Simplemail_Form_Task_SimpleMail::postProcess()
   *
   * Note: A lot of the logic in this method (for creating hidden and smart groups) is taken from
   * CRM_Mailing_Form_Group::postProcess()
   *
   * @return null|string
   * @throws Exception
   */
  private static function createSmartContactGroupForSearchContacts() {
    $searchParams = simplemail_civicrm_getFromSessionScope('searchParams');
    $contactIds = simplemail_civicrm_getFromSessionScope('contactIds');

    $smartGroupId = NULL;

    if ($contactIds) {
      $resultSelectOption = $searchParams['radio_ts'];

      // Only the ticked contacts in the search result need to be sent mailing - create a hidden group for them
      if ($resultSelectOption == 'ts_sel') {
        // create a static grp if only a subset of result set was selected:
        $randID = md5(time());
        $grpTitle = "Hidden Group {$randID}";
        $grpID =
          CRM_Core_DAO::getFieldValue('CRM_Contact_DAO_Group', $grpTitle, 'id',
            'title');

        if (!$grpID) {
          $groupParams = array(
            'title'      => $grpTitle,
            'is_active'  => 1,
            'is_hidden'  => 1,
            'group_type' => array('2' => 1),
          );

          $group = CRM_Contact_BAO_Group::create($groupParams);
          $grpID = $group->id;

          CRM_Contact_BAO_GroupContact::addContactsToGroup($contactIds,
            $group->id);

          $newGroupTitle = "Hidden Group {$grpID}";
          $groupParams = array(
            'id'         => $grpID,
            'name'       => CRM_Utils_String::titleToVar($newGroupTitle),
            'title'      => $newGroupTitle,
            'group_type' => array('2' => 1),
          );
          $group = CRM_Contact_BAO_Group::create($groupParams);
        }

        // note at this point its a static group
        $smartGroupId = $grpID;
      }
      // All the contacts in the search result need to be sent mailing - create a dynamic smart group for the search
      else {
        // Get the saved search ID
        $ssId = simplemail_civicrm_getFromSessionScope('ssId');
        $formValues = simplemail_civicrm_getFromSessionScope('formValues');
        $customSearchId =
          simplemail_civicrm_getFromSessionScope('customSearchId');
        $context = simplemail_civicrm_getFromSessionScope('context');

        $hiddenSmartParams = array(
          'group_type'       => array('2' => 1),
          'form_values'      => $formValues,
          'saved_search_id'  => $ssId,
          'search_custom_id' => $customSearchId,
          'search_context'   => $context,
        );

        list($smartGroupId, $savedSearchId) =
          CRM_Contact_BAO_Group::createHiddenSmartGroup($hiddenSmartParams);

        // Set the saved search ID
        if (!$ssId) {
          if ($savedSearchId) {
            simplemail_civicrm_addToSessionScope('ssId', $savedSearchId);
          }
          else {
            CRM_Core_Error::fatal();
          }
        }
      }
    }

    simplemail_civicrm_addToSessionScope('smartGroupId', $smartGroupId);
  }

  /**
   * @param $mailingId
   *
   * @return CRM_Mailing_BAO_MailingJob
   */
  private static function createTestMailingJob($mailingId) {
    $job = new CRM_Mailing_BAO_MailingJob();
    $job->mailing_id = $mailingId;
    $job->is_test = TRUE;
    $job->save();

    return $job;
  }

  /**
   * @param $job
   * @param $groupId
   */
  private static function runTestEmailJobs($job, $groupId = NULL) {
    $testJobParams = array();
    $testJobParams['job_id'] = $job->id;

    if ($groupId) {
      $testJobParams['test_group'] = $groupId;
    }

    $isComplete = FALSE;
    while (!$isComplete) {
      $isComplete = CRM_Mailing_BAO_MailingJob::runJobs($testJobParams);
    }
  }

  /**
   * Unset (i.e. set to NULL) the group type for all mailing groups for the mailing given by its ID, where the group
   * type is currently set to 'Include'.
   *
   * @param $mailingId
   */
  private static function unsetGroupTypeForMailingGroups($mailingId) {
    $dao = CRM_Core_DAO::executeQuery(
      'UPDATE civicrm_mailing_group SET group_type = NULL WHERE mailing_id = %0 AND group_type = %1',
      array(
        array($mailingId, 'Integer'),
        array('Include', 'String')
      )
    );

    $dao->free();
  }

}
