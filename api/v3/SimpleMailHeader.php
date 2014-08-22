<?php

// TODO (robin): Delete this after migration when this won't be used any more
if (!defined('SM_EXT_DIR_NAME')) {
  /**
   * Directory name for the Simple Mail extension
   */
  define('SM_EXT_DIR_NAME', 'simple-mail');
}

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
  return _civicrm_api3_basic_create(_civicrm_api3_get_BAO(__FUNCTION__), $params);
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
  $tempFile = $_FILES['file']['tmp_name'];

  $fileName = CRM_Utils_File::makeFileName($_FILES['file']['name']);
  $dirName = _get_image_dir_path($params['field']);

  // Create the upload directory, if it doesn't already exist
  CRM_Utils_File::createDir($dirName);

  $file = $dirName . $fileName;

  // Move the uploaded file to the upload directory
  if (move_uploaded_file($tempFile, $file)) {
    $imageDirUrl = _get_image_dir_url($params['field']);
    $imageUrl = $imageDirUrl . $fileName;

    return array(
      'imageUrl' => $imageUrl,
      'imageFileName' => $fileName
    );
  } else {
    throw new API_Exception('Failed to move the uploaded file', 500);
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

/**
 * SimpleMailHeader.GetImageUrl API
 * TODO (robin): This might not be needed anymore due to baking image URLs into header array in Get action
 *
 * @param array $params Array consisting offield name (corresponding to DB name) and file name
 *
 * @return array API result descriptor
 * @see civicrm_api3_create_success
 * @see civicrm_api3_create_error
 * @throws API_Exception
 */
//function civicrm_api3_simple_mail_header_getimageurl($params) {
//  try {
//    $result = CRM_Simplemail_BAO_SimpleMailHeader::getImageUrl($params);
//
//    return civicrm_api3_create_success($result, $params, NULL, 'getimageurl');
//  } catch (CRM_Extension_Exception $e) {
//    return civicrm_api3_create_error($e->getMessage());
//  }
//}

/**
 * SimpleMailHeader.GetHeadersWithFilters API
 * TODO (robin): This is no longer needed as it can now be handled by an extra param to specify if filters are needed with headers
 *
 * @param array $params
 *
 * @return array API result descriptor
 * @see civicrm_api3_create_success
 * @see civicrm_api3_create_error
 * @throws API_Exception
 */
//function civicrm_api3_simple_mail_header_getheaderswithfilters($params) {
//  try {
//    $result = CRM_Simplemail_BAO_SimpleMailHeader::get($params);
//
//    return civicrm_api3_create_success($result['values'], $params, NULL, 'getheaderswithfilters', $result['dao']);
//  } catch (CRM_Extension_Exception $e) {
//    $data = $e->getErrorData();
//
//    return civicrm_api3_create_error($e->getMessage(), array(), $data['dao']);
//  }
//}

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

/**
 * Get the relative path for an image field
 *
 * @param string $field Name of the image field in the DB
 *
 * @return string
 * @throws API_Exception
 */
function _get_image_dir_relative_path($field) {
  if (!in_array($field, array('image', 'logo_image'))) {
    throw new API_Exception('Failed to resolve relative path for image directory as invalid field name provided', 400);
  }

  return SM_EXT_DIR_NAME . DIRECTORY_SEPARATOR . $field . DIRECTORY_SEPARATOR;
}

/**
 * Get the URL for the directory of an image field
 * TODO (robin): Remove this after migration to BAO is complete
 *
*@param string $field Name of the image field in the DB
 *
 * @throws API_Exception
 *
 * @return string
 */
function _get_image_dir_url($field) {
  $api = _get_api_instance();
  $entity = 'Setting';
  $apiParams = array('name' => 'imageUploadURL');

  if (!$api->$entity->GetValue($apiParams)) {
    throw new API_Exception('Failed to retrieve image upload URL setting');
  }

  $path = $api->result();

  $dirRelativePath = _get_image_dir_relative_path($field);

  $path .= $dirRelativePath;

  return $path . DIRECTORY_SEPARATOR;
}

//function _get_image_dir_path($field) {
//  $api = _get_api_instance();
//  $entity = 'Setting';
//  $apiParams = array('name' => 'imageUploadDir');
//
//  if (!$api->$entity->GetValue($apiParams)) {
//    throw new API_Exception('Failed to retrieve image upload dir setting');
//  }
//
//  $path = $api->result();
//
//  $dirRelativePath = _get_image_dir_relative_path($field);
//
//  $path .= $dirRelativePath;
//
//  return $path . DIRECTORY_SEPARATOR;
//}
