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
function _civicrm_api3_simple_mail_submitmassemail_spec(&$spec) {
  $spec['magicword']['api.required'] = 1;
}

/**
 * SimpleMail.SubmitMassEmail API
 *
 * @param array $params
 *
 * @return array API result descriptor
 * @see civicrm_api3_create_success
 * @see civicrm_api3_create_error
 * @throws API_Exception
 */
function civicrm_api3_simple_mail_submitmassemail($params) {
  require_once 'sites/all/modules/civicrm/api/class.api.php';

//  require_once '/api/class.api.php';
  if (!array_key_exists('id', $params)) {
    throw new API_Exception(
      'Failed to submit for mass email as mailing ID not provided', 405);
  }

  $entity = 'SimpleMail';

  $apiParams = array(
    'id' => (int) $params['id']
  );

  // /civicrm/ajax/rest?entity=SimpleMail&action=submitmassemail&id=1

  // TODO (robin): Push stuff to the core queue instead of doing it here synchronously

  $template = '<h1>Hello World</h1><p>This is a dummy email template</p>';


  $api = new civicrm_api3();

  $api->$entity->Get($apiParams);

  if ($api->is_error()) {
    throw new API_Exception('An error occured when trying to retrieve mailing: ' . $api->errorMsg(), 500);
  }

  $mailing = reset($api->values());

  $template .= $mailing->body;

//  if ($mailing['now']) {
//    $params['scheduled_date'] = date('YmdHis');
//  }
//  else {
//    $params['scheduled_date'] = CRM_Utils_Date::processDate($params['start_date'] . ' ' . $params['start_date_time']);
//  }

  $session = CRM_Core_Session::singleton();

  $crmMailingParams = array(
    'name'               => $mailing->name,
    'from_email'         => $mailing->from_email,
    'subject'            => $mailing->subject,
    'body_html'          => $template,
    'groups'             => array('include' => array('4', '5')),
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

  return array('crmMailingId' => $crmMailing->id);
}
