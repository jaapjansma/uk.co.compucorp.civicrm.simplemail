<?php

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
  // Delete the header image
  if ($params['image']) {
    civicrm_api3_simple_mail_header_deleteimage(
      array('field' => 'image', 'fileName' => $params['image'])
    );
  }

  // Delete the logo image
  if ($params['logo_image']) {
    civicrm_api3_simple_mail_header_deleteimage(
      array('field' => 'logo_image', 'fileName' => $params['logo_image'])
    );
  }

  // Delete the header
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
  $headers = _civicrm_api3_basic_get(_civicrm_api3_get_BAO(__FUNCTION__), $params);
  $values = $headers['values'];

  $imageUploadUrl = _get_image_dir_url('image');

  // Add image URL as array key of the result
  $valuesWithImageUrls = array_map(
    function ($value) use ($imageUploadUrl) {
      $value['imageUrl'] = $imageUploadUrl . $value['image'];

      return $value;
    }, $values
  );

  $headers['values'] = $valuesWithImageUrls;

  return $headers;
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
  $fileName = $params['fileName'];

  $dirName = _get_image_dir_path($params['field']);

  $file = $dirName . $fileName;

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

/**
 * SimpleMailHeader.GetImageUrl API
 *
 * @param array $params Array consisting offield name (corresponding to DB name) and file name
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

  $imageDirUrl = _get_image_dir_url($params['field']);

  return $imageDirUrl . $params['fileName'];
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
 *
 * @param string $field Name of the image field in the DB
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

function _get_image_dir_path($field) {
  $api = _get_api_instance();
  $entity = 'Setting';
  $apiParams = array('name' => 'imageUploadDir');

  if (!$api->$entity->GetValue($apiParams)) {
    throw new API_Exception('Failed to retrieve image upload dir setting');
  }

  $path = $api->result();

  $dirRelativePath = _get_image_dir_relative_path($field);

  $path .= $dirRelativePath;

  return $path . DIRECTORY_SEPARATOR;
}
