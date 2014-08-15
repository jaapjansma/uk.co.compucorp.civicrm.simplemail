<?php

/**
 * SimpleMail.create API specification (optional)
 * This is used for documentation and validation.
 *
 * @param array $spec description of fields supported by this API call
 * @return void
 * @see http://wiki.civicrm.org/confluence/display/CRM/API+Architecture+Standards
 */
function _civicrm_api3_simple_mail_create_spec(&$spec) {
  // $spec['some_parameter']['api.required'] = 1;
}

/**
 * SimpleMail.create API
 *
 * @param array $params
 * @return array API result descriptor
 * @throws API_Exception
 */
function civicrm_api3_simple_mail_create($params) {
  return _civicrm_api3_basic_create(_civicrm_api3_get_BAO(__FUNCTION__), $params);
}

/**
 * SimpleMail.delete API
 *
 * @param array $params
 * @return array API result descriptor
 * @throws API_Exception
 */
function civicrm_api3_simple_mail_delete($params) {
  return _civicrm_api3_basic_delete(_civicrm_api3_get_BAO(__FUNCTION__), $params);
}

/**
 * SimpleMail.get API
 *
 * @param array $params
 * @return array API result descriptor
 * @throws API_Exception
 */
function civicrm_api3_simple_mail_get($params) {
  return _civicrm_api3_basic_get(_civicrm_api3_get_BAO(__FUNCTION__), $params);
}

/**
 * SimpleMail.SubmitMassEmail API
 *
 * TODO (robin): Refactor this towards the end
 * TODO (robin): Should this better be pushed to the queue instead?
 *
 * @param array $params
 *
 * @return array API result descriptor
 * @see civicrm_api3_create_success
 * @see civicrm_api3_create_error
 * @throws API_Exception
 */
function civicrm_api3_simple_mail_submitmassemail($params) {
  /*
   * Overview:
   *
   * 1. Get the SM mailing using the API
   * 2. Generate a Civi mailing from the SM mailing
   * 3. Return the Civi mailing ID
   */

  require_once 'sites/all/modules/civicrm/api/class.api.php';

  if (!isset($params['id'])) {
    throw new API_Exception('Failed to submit mass emailing job as Simple Mail mailing ID was not provided', 405);
  }

  $crmMailing = _create_or_update_civicrm_mass_mailing((int) $params['id']);

  return array('crmMailingId' => $crmMailing->id);
}

/**
 * SimpleMail.DeleteMassEmail API
 *
 * @param array $params
 *
 * @return array API result descriptor
 * @see civicrm_api3_create_success
 * @see civicrm_api3_create_error
 * @throws API_Exception
 */
function civicrm_api3_simple_mail_deletemassemail($params) {
  if (!isset($params['crmMailingId'])) {
    throw new API_Exception(
      'Failed to delete mass email as CiviCRM mailing ID not provided', 405);
  }

  $crmMailingId = $params['crmMailingId'];

  CRM_Mailing_BAO_Mailing::del($crmMailingId);

  return TRUE;
}

/**
 * SimpleMail.SendTestEmail API
 *
 * @param array $params
 *
 * @return array API result descriptor
 * @see civicrm_api3_create_success
 * @see civicrm_api3_create_error
 * @throws API_Exception
 */
function civicrm_api3_simple_mail_sendtestemail($params) {
  require_once 'sites/all/modules/civicrm/api/class.api.php';

  /*
   * Overview:
   * 1. Get the SM mailing using the API
   * 2. Generate a Civi mailing from the SM mailing
   * 3. Return the Civi mailing ID
   */

  /*
   * Buttons on the last page of the wizard:
   * 1. Draft - Prev, Submit, Cancel
   *    Show this for mailings without either schedule date or Civi mailing ID, or none
   *
   * 2. Scheduled - Prev, Update, Cancel
   *    Otherwise, show this for mailings i.e. with both schedule data and Civi mailing ID
  */

  /*
   * Buttons next to mailings in the SM mailing listing:
   * 1. Draft - Edit, Delete:
   *    Show these for mailings without a Civi mailing ID
   *
   * 2. Scheduled - Edit, Delete (, Cancel):
   *    Show these for mailings with scheduled date in the future and with Civi mailing ID
   *
   * 3. Complete - Delete (, Archive, Re-use):
   *    Show these for mailings with scheduled date in the past and with Civi mailing ID
   */

  if (!isset($params['id'])) {
    throw new API_Exception(
      'Failed to submit for mass email as Simple Mail mailing ID was not provided', 405);
  }
  if (!isset($params['groupId'])) {
    throw new API_Exception('Failed to submit mass emailing job as no group was provided', 405);
  }

  // Create or update CiviCRM mass emailing
  $crmMailing = _create_or_update_civicrm_mass_mailing((int) $params['id']);

  // Create a mass test emailing job and run it
  if ($crmMailing->id) {

    $job = new CRM_Mailing_BAO_MailingJob();
    $job->mailing_id = $crmMailing->id;
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

    return array('crmMailingId' => $crmMailing->id);
  }
  else {
    throw new API_Exception('Failed to create or update CiviCRM mass mailing', 500);
  }
}

/**
 * SimpleMail.GetEmailHtml API
 *
 * @param array $params
 *
 * @return array API result descriptor
 * @see civicrm_api3_create_success
 * @see civicrm_api3_create_error
 * @throws API_Exception
 */
function civicrm_api3_simple_mail_getemailhtml($params) {
  require_once 'sites/all/modules/civicrm/api/class.api.php';

  if (!isset($params['id'])) {
    throw new API_Exception(
      'Failed to submit for mass email as Simple Mail mailing ID was not provided', 405);
  }

  $mailing = _get_simple_mail_mailing((int) $params['id']);
  $campaignMsg = _get_simple_mail_campaign_message((int) $mailing->message_id);
  $header = _get_simple_mail_header((int) $mailing->header_id);

  $template = _generate_email_template($mailing, $campaignMsg, $header);

  return $template;
}


//////////////////////
// Helper Functions //
//////////////////////

/**
 * Create a new or update an existing CiviCRM mailing from a Simple Mail mailing, along with other related tasks, such
 * as creating a job in the queue, etc., necessary for scheduling mass emailing.
 *
 * @param int $smMailingId The ID of the Simple Mail mailing
 *
 * @return int CRM_Mailing_DAO_Mailing The ID of the CiviCRM mailing
 * @throws API_Exception
 */
function _create_or_update_civicrm_mass_mailing($smMailingId) {
  $mailing = _get_simple_mail_mailing($smMailingId);

  $campaignMsg = _get_simple_mail_campaign_message((int) $mailing->message_id);
  $header = _get_simple_mail_header((int) $mailing->header_id);

  $crmMailingParamGroups = _get_formatted_recipient_groups($smMailingId);

  $template = _generate_email_template($mailing, $campaignMsg, $header);

  $userId = CRM_Core_Session::singleton()->get('userID');

  $fromName = NULL;
  $fromEmail = NULL;

  if (preg_match('/"(.*)" <(.*)>/', $mailing->from_address, $match)) {
    $fromName = $match[1];
    $fromEmail = $match[2];
  }

  $crmMailingParams = array(
    'name'               => $mailing->name,
    'from_name'          => $fromName,
    'from_email'         => $fromEmail,
    'subject'            => $mailing->subject,
    'body_html'          => $template,
    'groups'             => $crmMailingParamGroups,
    'scheduled_date'     => str_replace(array('-', ':', ' '), '', $mailing->send_on),
    'scheduled_id' => $userId,
    'approver_id'  => $userId,
    'approval_date'      => date('YmdHis'),
    'approval_status_id' => 1
  );

  $crmMailingId = array(
    'mailing_id' => $mailing->crm_mailing_id ? : NULL
  );

  // Create or update CiviCRM mailing
  $crmMailing = CRM_Mailing_BAO_Mailing::create($crmMailingParams, $crmMailingId);

  // TODO (robin): Make this dynamic
  $dedupeEmail = FALSE;

  // Compute the recipients and store them in the mailing recipients table
  CRM_Mailing_BAO_Mailing::getRecipients(
    $crmMailing->id,
    $crmMailing->id,
    NULL,
    NULL,
    TRUE,
    $dedupeEmail
  );

  return $crmMailing;
}

/**
 * @param $entity
 * @param $id
 *
 * @return mixed
 * @throws api_exception
 */
function _get_entity_values($entity, $id) {
  $api = _get_api_instance();

  $params = array(
    'id' => $id
  );

  $api->$entity->Get($params);

  $values = reset($api->values());

  if ($api->is_error()) {
    throw new api_exception('an error occurred when trying to retrieve ' . $entity . ': ' . $api->errormsg(), 500);
  }

  return $values;
}

if (!function_exists('_get_api_instance')) {
  /**
   * @return civicrm_api3
   */
  function _get_api_instance() {
    static $api;

    if (!$api) {
      $api = new civicrm_api3();
    }

    return $api;
  }
}

/**
 * @param int $smMailingId
 *
 * @return mixed
 * @throws API_Exception
 */
function _get_simple_mail_mailing($smMailingId) {
  return _get_entity_values('SimpleMail', $smMailingId);
}

/**
 * @param $campaignMsgId
 *
 * @throws API_Exception
 * @internal param $smMailingId
 *
 * @return mixed
 */
function _get_simple_mail_campaign_message($campaignMsgId) {
  return _get_entity_values('SimpleMailMessage', $campaignMsgId) ? : NULL;
}

function _get_simple_mail_header($headerId) {
  return _get_entity_values('SimpleMailHeader', $headerId) ? : NULL;
}

/**
 * Get the recipient groups for the given Simple Mail mailing ID as a formatted array
 *
 * @param int $smMailingId The ID of the Simple Mail mailing
 *
 * @return array The returned array consists of two elements with keys 'include' and 'exclude' (todo) respectively. Each
 *               element has an array of corresponding group IDs as its value.
 */
function _get_formatted_recipient_groups($smMailingId) {
  $groups = _get_recipient_groups($smMailingId);

  $formattedGroups = array(
    'include' => array()
  );

  foreach ($groups as $group) {
    $formattedGroups['include'][] = $group->entity_id;
  }

  return $formattedGroups;
}

/**
 * Generate and return the HTML template for a mailing
 *
 * @param $mailing
 * @param $campaignMsg
 * @param $header
 *
 * @return string
 */
function _generate_email_template($mailing, $campaignMsg, $header) {
  // Setup paths
  $templateDir = 'civicrm_custom/extensions/compucorp/uk.co.compucorp.civicrm.simplemail/email-templates/';
  $templateFileName = 'wave.html';
  $templateFile = $templateDir . $templateFileName;

  // Setup template variables
  $template = new stdClass();
  $template->title = $mailing->title ? : NULL;
  $template->body = $mailing->body ? : NULL;
  $template->contactDetails = $mailing->contact_details ? : NULL;

  if (is_object($campaignMsg)) {
    $template->campaignMessage = $campaignMsg->text;
  }
  if (is_object($header)) {
    $api = _get_api_instance();

    if ($header->image) {
      $api->SimpleMailHeader->GetImageUrl(array('field' => 'image', 'fileName' => $header->image));
      $template->headerImage = $api->result();
    }
    else {
      $template->headerImage = NULL;
    }

    if ($header->show_logo && $header->logo_image) {
      $api->SimpleMailHeader->GetImageUrl(array('field' => 'logo_image', 'fileName' => $header->logo_image));
      $template->logo = $api->result();
    }
    else {
      $template->logo = NULL;
    }
  }

  // Output parsed template
  ob_start();

  require $templateFile;

  return ob_get_clean();
}

/**
 * Get the recipient groups for the given Simple Mail mailing
 *
 * @param int $smMailingId The ID of the Simple Mail mailing
 *
 * @return array
 * @throws API_Exception
 */
function _get_recipient_groups($smMailingId) {
  $api = new civicrm_api3();

  $entity = 'SimpleMailRecipientGroup';

  $params = array(
    'mailing_id' => $smMailingId
  );

  $api->$entity->Get($params);

  if ($api->is_error()) {
    throw new api_exception('an error occurred when trying to retrieve recipient groups: ' . $api->errormsg(), 500);
  }

  return $api->values();
}
