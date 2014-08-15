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
  return _civicrm_api3_basic_create(_civicrm_api3_get_BAO(__FUNCTION__), $params);
}

/**
 * SimpleMailHeader.delete API
 *
 * @param array $params
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
  return _civicrm_api3_basic_get(_civicrm_api3_get_BAO(__FUNCTION__), $params);
}

/**
 * SimpleMailHeader.UploadImage API
 *
 * @param array $params
 * @return array API result descriptor
 * @see civicrm_api3_create_success
 * @see civicrm_api3_create_error
 * @throws API_Exception
 */
function civicrm_api3_simple_mail_header_uploadimage($params) {
  $extDirName = 'simple-mail';

  $field = $params['field'];
  $filePrefix = $extDirName;

  switch ($field) {
    case 'image':
      $filePrefix .= DIRECTORY_SEPARATOR . 'image';
      break;

    case 'logo_image':
      $filePrefix .= DIRECTORY_SEPARATOR . 'logo_image';
      break;

    default:
      $filePrefix .= DIRECTORY_SEPARATOR . 'default';
      break;
  }

  $tempFile = $_FILES['file']['tmp_name'];

  $fileName = CRM_Utils_File::makeFileName($_FILES['file']['name']);

  $dirName = civicrm_api3('setting', 'getvalue', array('name' => 'imageUploadDir')) . $filePrefix;
  CRM_Utils_File::createDir($dirName); // Create the upload directory if it doesn't already exist

  $file = $dirName . DIRECTORY_SEPARATOR . $fileName;

  // Move the uploaded file to the upload directory
  if (move_uploaded_file($tempFile, $file)) {
    $imageDirUrl = civicrm_api3('setting', 'getvalue', array('name' => 'imageUploadURL')) . $filePrefix;
    $imageUrl = $imageDirUrl . '/' . $fileName;

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
 * @return array API result descriptor
 * @see civicrm_api3_create_success
 * @see civicrm_api3_create_error
 * @throws API_Exception
 */
function civicrm_api3_simple_mail_header_deleteimage($params) {
  $extDirName = 'simple-mail';

  $filePrefix = $extDirName;

  switch ($params['field']) {
    case 'image':
      $filePrefix .= DIRECTORY_SEPARATOR . 'image';
      break;

    case 'logo_image':
      $filePrefix .= DIRECTORY_SEPARATOR . 'logo_image';
      break;

    default:
      $filePrefix .= DIRECTORY_SEPARATOR . 'default';
      break;
  }

  $fileName = $params['fileName'];

  $dirName = civicrm_api3('setting', 'getvalue', array('name' => 'imageUploadDir')) . $filePrefix;

  $file = $dirName . DIRECTORY_SEPARATOR . $fileName;

  if (unlink($file)) {
    return array(
      'is_error' => 0,
      'status' => 200,
      'message' => 'File deleted successfully',
      'fileName' => $fileName
    );
  } else {
    $error = 'Unknown error';

    if (!file_exists($file)) {
      $error = 'File ' . $fileName . ' be deleted does not exist. This would generally happen when a new file was uploaded, thereby deleting the existing file, but the page was not subsequently saved to record the change to the file name. This error can be ignored safely for most cases.';
    } else if (!is_file($file)) {
      $error = 'File ' . $fileName . ' for deletion is not a regular file';
    } else if (!is_writable($file)) {
      $error = 'File ' . $fileName . ' to be deleted is not writable';
    }

    throw new API_Exception($error, 500);
  }
}

const SM_EXT_DIR_NAME = 'simple-mail';

/**
 * SimpleMailHeader.GetImageUrl API
 *
 * @param array $params Array consisting of field name (corresponding to DB name) and file name
 *
 * @return array API result descriptor
 * @see civicrm_api3_create_success
 * @see civicrm_api3_create_error
 * @throws API_Exception
 */
function civicrm_api3_simple_mail_header_getimageurl($params) {
  if (!isset($params['field'])) {
    throw new API_Exception('Image field param not provided');
  }
  if (!isset($params['fileName'])) {
    throw new API_Exception('Image file name not provided');
  }

  $api = _get_api_instance();

  $imageUrl = $api->cfg->imageUploadURL . SM_EXT_DIR_NAME;

  switch ($params['field']) {
    case 'image':
      $imageUrl = $imageUrl . '/image/';
      break;

    case 'logo_image':
      $imageUrl = $imageUrl . '/logo_image/';
      break;

    default:
      throw new API_Exception('Incorrect image field param provided');
  }

  return $imageUrl . $params['fileName'];
}

/**
 * SimpleMailHeader.GetHeadersWithFilters API
 *
 * @param array $params
 *
 * @return array API result descriptor
 * @see civicrm_api3_create_success
 * @see civicrm_api3_create_error
 * @throws API_Exception
 */
function civicrm_api3_simple_mail_header_getheaderswithfilters($params) {
  $query
    = 'SELECT h.id, h.label, h.image, h.show_logo, h.logo_image, f.id AS filter_id, f.entity_table, f.entity_table, f.entity_id
            FROM civicrm_simplemailheader h
            RIGHT JOIN civicrm_simplemailheaderfilter f
            on h.id = f.header_id
            ORDER BY h.id';

  try {
    /** @var CRM_Core_DAO $dao */
    $dao = CRM_Core_DAO::executeQuery($query);

    $headersWithFilters = array();

    while ($dao->fetch()) {
      $headersWithFilters[] = $dao->toArray();
    }
  } catch (Exception $e) {
    throw new API_Exception('Failed to retrieve headers with filters: ' . $e->getMessage(), 500);
  }

  return array('is_error' => 0, 'values' => $headersWithFilters);
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
