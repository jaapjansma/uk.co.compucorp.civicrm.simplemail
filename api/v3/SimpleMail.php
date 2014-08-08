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
    throw new API_Exception(
      'Failed to submit for mass email as Simple Mail mailing ID was not provided', 405);
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
 * @param $params
 *
 * @throws API_Exception
 */
function civicrm_api3_simple_mail_sendtestemail($params) {
  require_once 'sites/all/modules/civicrm/api/class.api.php';

  /*
   * Overview:
   *
   * 1. Get the SM mailing using the API
   * 2. Generate a Civi mailing from the SM mailing
   * 3. Return the Civi mailing ID
   */

  /*
   * Buttons on the last page of the wizard:
   * 1. Draft - Submit
   *    Show this for mailings without a schedule date AND Civi mailing ID
   *
   * 2. Scheduled - Update
   *    Show this for mailings with a schedule data AND Civi mailing ID
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

  $crmMailing = _create_or_update_civicrm_mass_mailing((int) $params['id']);

  return TRUE;
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

  $template = _generate_email_template($mailing, $campaignMsg);

  return $template;
}


//////////////////////
// Helper Functions //
//////////////////////

/**
 * @param int $smMailingId The ID of the Simple Mail mailing
 *
 * @return CRM_Mailing_DAO_Mailing
 * @throws API_Exception
 */
function _create_or_update_civicrm_mass_mailing($smMailingId) {
  $mailing = _get_simple_mail_mailing($smMailingId);
  $crmMailingParamGroups = _get_formatted_recipient_groups($smMailingId);

  $template = _generate_email_template($mailing);


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
 * @param int $smMailingId
 *
 * @return mixed
 * @throws API_Exception
 */
function _get_simple_mail_mailing($smMailingId) {
  $api = new civicrm_api3();

  $entity = 'SimpleMail';

  $apiParams = array(
    'id' => $smMailingId
  );

  $api->$entity->Get($apiParams);

  $mailing = reset($api->values());

  if ($api->is_error()) {
    throw new API_Exception('An error occurred when trying to retrieve mailing: ' . $api->errorMsg(), 500);
  }

  return $mailing;
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
  $message = '';

  if ($campaignMsgId) {
    // TODO (robin): The below steps are duplicate - refactor this
    $api = new civicrm_api3();

    $entity = 'SimpleMailMessage';

    $apiParams = array(
      'id' => $campaignMsgId
    );

    $api->$entity->Get($apiParams);

    $message = reset($api->values());

    if ($api->is_error()) {
      throw new API_Exception('An error occurred when trying to retrieve campaign message: ' . $api->errorMsg(), 500);
    }
  }

  return $message;
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
 *
 * @param $campaignMsg
 *
 * @return string
 */
function _generate_email_template($mailing, $campaignMsg) {
  // Setup paths
  $templateDir = 'civicrm_custom/extensions/compucorp/uk.co.compucorp.civicrm.simplemail/email-templates/';
  $templateFileName = 'wave.html';
  $templateFile = $templateDir . $templateFileName;

  // Setup template variables
  $title = $mailing->title;
  $body = $mailing->body;
  $contactDetails = $mailing->contact_details;

  if (is_object($campaignMsg)) {
    $campaignMessage = $campaignMsg->text;
  }

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
