<?php


/**
 * SimpleMailHeader.create API specification (optional)
 * This is used for documentation and validation.
 *
 * @param array $spec description of fields supported by this API call
 * @return void
 * @see http://wiki.civicrm.org/confluence/display/crm/api+architecture+standards
 */
function _civicrm_api3_simple_mail_header_create_spec(&$spec) {
  // $spec['some_parameter']['api.required'] = 1;
}

/**
 * SimpleMailHeader.create API
 *
 * @param array $params
 * @return array API result descriptor
 * @throws API_Exception
 */
function civicrm_api3_simple_mail_header_create($params) {
	$result = _civicrm_api3_basic_create(_civicrm_api3_get_BAO(__FUNCTION__), $params);
  return $result;
}

/**
 * SimpleMailHeader.delete API
 *
 * This will delete the header, along with the images for header and logo. The filters in the linking table would get
 * delete automatically due to DB constraints (cascade).
 *
 * @param array $params
 *
 * @return array API result descriptor
 * @throws API_Exception
 */
function civicrm_api3_simple_mail_header_delete($params) {
 return _civicrm_api3_basic_delete(_civicrm_api3_get_BAO(__FUNCTION__), $params);
}

/**
 * SimpleMailHeader.get API
 *
 * @param array $params
 * @return array API result descriptor
 * @throws API_Exception
 */
function civicrm_api3_simple_mail_header_get($params) {
  try {
    $result = CRM_Simplemail_BAO_SimpleMailHeader::getHeaders($params);

    return civicrm_api3_create_success($result['values'], $params, NULL, 'get', $result['dao']);
  } catch (CRM_Extension_Exception $e) {
    $data = $e->getErrorData();

    return civicrm_api3_create_error($e->getMessage(), array(), $data['dao']);
  }
}

/**
 * SimpleMailHeader.UploadImage API
 *
 * @param array $params
 *
 * @return array API result descriptor
 * @see civicrm_api3_create_success
 * @see civicrm_api3_create_error
 * @throws API_Exception
 */
function civicrm_api3_simple_mail_header_uploadimage($params) {
  try {
    $result = CRM_Simplemail_BAO_SimpleMailHeader::uploadImage($params);
    return civicrm_api3_create_success($result['values'], $params, NULL, 'uploadimage');
  } catch (CRM_Extension_Exception $e) {
    return civicrm_api3_create_error($e->getMessage());
  }
}

/**
 * SimpleMailHeader.DeleteImage API
 *
 * @param array $params
 *
 * @return array API result descriptor
 * @see civicrm_api3_create_success
 * @see civicrm_api3_create_error
 * @throws API_Exception
 */
function civicrm_api3_simple_mail_header_deleteimage($params) {
  try {
    CRM_Simplemail_BAO_SimpleMailHeader::deleteImage($params);

    return civicrm_api3_create_success();
  } catch (CRM_Extension_Exception $e) {
    return civicrm_api3_create_error($e->getMessage());
  }
}