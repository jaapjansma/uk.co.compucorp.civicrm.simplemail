<?php

/**
 * SimpleMailHeader.DeleteImage API specification (optional)
 * This is used for documentation and validation.
 *
 * @param array $spec description of fields supported by this API call
 * @return void
 * @see http://wiki.civicrm.org/confluence/display/CRM/API+Architecture+Standards
 */
function _civicrm_api3_simple_mail_header_deleteimage_spec(&$spec) {
//  $spec['magicword']['api.required'] = 1;
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

