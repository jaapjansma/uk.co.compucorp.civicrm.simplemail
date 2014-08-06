<?php

/**
 * SimpleMail.SubmitMassEmail API specification (optional)
 * This is used for documentation and validation.
 *
 * @param array $spec description of fields supported by this API call
 *
 * @return void
 * @see http://wiki.civicrm.org/confluence/display/CRM/API+Architecture+Standards
 */
/*function _civicrm_api3_simple_mail_submitmassemail_spec(&$spec) {
  $spec['magicword']['api.required'] = 1;
}*/

/**
 * SimpleMail.SubmitMassEmail API
 *
 * TODO (robin): Refactor this towards the end
 *
 * @param array $params
 *
 * @return array API result descriptor
 * @see civicrm_api3_create_success
 * @see civicrm_api3_create_error
 * @throws API_Exception
 */
/*function civicrm_api3_simple_mail_submitmassemail($params) {
  require_once 'sites/all/modules/civicrm/api/class.api.php';

  if (!isset($params['id'])) {
    throw new API_Exception(
      'Failed to submit for mass email as Simple Mail mailing ID was not provided', 405);
  }

  $smMailingId = (int) $params['id'];

  // /civicrm/ajax/rest?entity=SimpleMail&action=submitmassemail&id=1

  $api = new civicrm_api3();

  /////////////////////////////////
  // Get the Simple Mail mailing //
  /////////////////////////////////
  $entity = 'SimpleMail';
  $apiParams = array(
    'id' => $smMailingId
  );

  $api->$entity->Get($apiParams);

  $mailing = reset($api->values());

  if ($api->is_error()) {
    throw new API_Exception('An error occured when trying to retrieve mailing: ' . $api->errorMsg(), 500);
  }

  //////////////////////////////////////////////////////////
  // Get the recipient groups for the Simple Mail mailing //
  //////////////////////////////////////////////////////////
  $entity = 'SimpleMailRecipientGroup';
  $apiParams = array(
    'mailing_id' => $smMailingId
  );
  $api->$entity->Get($apiParams);

  $groups = $api->values();

  if ($api->is_error()) {
    throw new API_Exception('An error occured when trying to retrieve recipient groups: ' . $api->errorMsg(), 500);
  }

  $crmMailingParamGroups = array(
    'include' => array()
  );

  foreach ($groups as $group) {
    $crmMailingParamGroups['include'][] = $group->entity_id;
  }

  $template = '<h1>' . $mailing->title . '</h1>';
  $template .= $mailing->body;

  $session = CRM_Core_Session::singleton();

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
    'scheduled_id'       => $session->get('userID'),
    'approver_id'        => $session->get('userID'),
    'approval_date'      => date('YmdHis'),
    'approval_status_id' => 1
  );

  $crmMailingId = array(
    'mailing_id' => $mailing->crm_mailing_id ? : NULL
  );

  $crmMailing = CRM_Mailing_BAO_Mailing::create($crmMailingParams, $crmMailingId);

  $dedupeEmail = FALSE;

  // also compute the recipients and store them in the mailing recipients table
  CRM_Mailing_BAO_Mailing::getRecipients(
    $crmMailing->id,
    $crmMailing->id,
    NULL,
    NULL,
    TRUE,
    $dedupeEmail
  );

  return array('crmMailingId' => $crmMailing->id);
}*/