<?php

/**
 * SimpleMailMessage.create API specification (optional)
 * This is used for documentation and validation.
 *
 * @param array $spec description of fields supported by this API call
 * @return void
 * @see http://wiki.civicrm.org/confluence/display/CRM/API+Architecture+Standards
 */
function _civicrm_api3_simple_mail_message_create_spec(&$spec) {
  // $spec['some_parameter']['api.required'] = 1;
}

/**
 * SimpleMailMessage.create API
 *
 * @param array $params
 * @return array API result descriptor
 * @throws API_Exception
 */
function civicrm_api3_simple_mail_message_create($params) {
  _sanitiseParams($params);
  return _civicrm_api3_basic_create(_civicrm_api3_get_BAO(__FUNCTION__), $params);
}

/**
 * SimpleMailMessage.delete API
 *
 * @param array $params
 * @return array API result descriptor
 * @throws API_Exception
 */
function civicrm_api3_simple_mail_message_delete($params) {
  return _civicrm_api3_basic_delete(_civicrm_api3_get_BAO(__FUNCTION__), $params);
}

/**
 * SimpleMailMessage.get API
 *
 * @param array $params
 * @return array API result descriptor
 * @throws API_Exception
 */
function civicrm_api3_simple_mail_message_get($params) {
  return _civicrm_api3_basic_get(_civicrm_api3_get_BAO(__FUNCTION__), $params);
}

/**
 * Helper function to sanitise received POST data before working on it
 *
 * @param $params
 */
function _sanitiseParams(&$params) {
  if (!empty($params['text'])) {
    // Decode the encoded HTML entities (due to sending data via HTTP POST) back to HTML for saving into the DB
    $params['text'] = html_entity_decode($params['text']);

    // Replace nbsp; with space as otherwise it will make MySQL save fail
    $params['text'] = str_replace("\xA0", ' ', $params['text']);
  }
}

