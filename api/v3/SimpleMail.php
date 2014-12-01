<?php

/**
 * SimpleMail.create API specification (optional)
 * This is used for documentation and validation.
 *
 * @param array $spec description of fields supported by this API call
 *
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
 *
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
 *
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
 *
 * @return array API result descriptor
 * @throws API_Exception
 */
function civicrm_api3_simple_mail_get($params) {
  try {
    $result = CRM_Simplemail_BAO_SimpleMail::getMailing($params);

    return civicrm_api3_create_success($result['values'], $params, NULL, 'get', $result['dao'], $result['extraValues']);
  } catch (CRM_Extension_Exception $e) {
    $errorData = $e->getErrorData();

    return civicrm_api3_create_error($e->getMessage(), array(), $errorData['dao']);
  }
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
  try {
    $result = CRM_Simplemail_BAO_SimpleMail::submitMassEmail($params);

    return civicrm_api3_create_success($result['values'], $params, NULL, 'submitmassemail', $result['dao']);
  } catch (CRM_Extension_Exception $e) {
    $errorData = $e->getErrorData();

    return civicrm_api3_create_error($e->getMessage(), array(), $errorData['dao']);
  }
}

/**
 * SimpleMail.CancelMassEmail API
 *
 * @param array $params
 *
 * @return array API result descriptor
 * @see civicrm_api3_create_success
 * @see civicrm_api3_create_error
 * @throws API_Exception
 */
function civicrm_api3_simple_mail_cancelmassemail($params) {
  try {
    CRM_Simplemail_BAO_SimpleMail::cancelMassEmail($params);

    return civicrm_api3_create_success(1, $params, NULL, 'cancelmassemail');
  } catch (CRM_Extension_Exception $e) {
    return civicrm_api3_create_error($e->getMessage());
  }
}

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
  try {
    $result = CRM_Simplemail_BAO_SimpleMail::sendTestEmail($params);

    return civicrm_api3_create_success($result['values'], $params, NULL, 'sendtestemail');
  } catch (CRM_Extension_Exception $e) {
    $errorData = $e->getErrorData();

    return civicrm_api3_create_error($e->getMessage(), array(), $errorData['dao']);
  }
}

/**
 * SimpleMail.DuplicateMassEmail API
 *
 * @param array $params
 *
 * @return array API result descriptor
 * @see civicrm_api3_create_success
 * @see civicrm_api3_create_error
 * @throws API_Exception
 */
function civicrm_api3_simple_mail_duplicatemassemail($params) {
  $params['id']
    = $params['crm_mailing_id']
    = $params['created_date']
    = $params['created_id']
    = $params['approver_id']
    = $params['external_identifier']
    = $params['sort_name']
    = $params['scheduled_date']
    = $params['scheduled_id']
    = $params['status']
    = NULL;

  return civicrm_api3_simple_mail_create($params);
}

/**
 * SimpleMail.IsCreatedFromSearch API
 *
 * @param $params
 *
 * @return array API result descriptor
 * @see civicrm_api3_create_success
 * @see civicrm_api3_create_error
 * @throws API_Exception
 */
function civicrm_api3_simple_mail_iscreatedfromsearch($params) {
  try {
    $result = CRM_Simplemail_BAO_SimpleMail::isCreatedFromSearch();

    return civicrm_api3_create_success($result['values'], $params, NULL, 'iscreatedfromsearch');
  } catch (CRM_Extension_Exception $e) {
    return civicrm_api3_create_error($e->getMessage());
  }
}

/**
 * SimpleMail.ClearSearchContacts API
 *
 * @param $params
 *
 * @return array API result descriptor
 * @see civicrm_api3_create_success
 * @see civicrm_api3_create_error
 * @throws API_Exception
 */
function civicrm_api3_simple_mail_clearsearchcontacts($params) {
  try {
    simplemail_civicrm_clearSessionScope();

    return civicrm_api3_create_success(1, $params, NULL, 'clearsearchresultsfromsession');
  } catch (CRM_Extension_Exception $e) {
    return civicrm_api3_create_error($e->getMessage());
  }
}

//////////////////////
// Helper Functions //
//////////////////////

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
  require_once 'sites/all/modules/civicrm/api/class.api.php';

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
