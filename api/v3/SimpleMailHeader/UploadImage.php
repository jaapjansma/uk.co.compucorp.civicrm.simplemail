<?php

/**
 * SimpleMailHeader.UploadImage API specification (optional)
 * This is used for documentation and validation.
 *
 * @param array $spec description of fields supported by this API call
 * @return void
 * @see http://wiki.civicrm.org/confluence/display/CRM/API+Architecture+Standards
 */
function _civicrm_api3_simple_mail_header_uploadimage_spec(&$spec) {
//  $spec['magicword']['api.required'] = 1;
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
  $filePrefix = 'simple-mail/headers';

  $tempFile = $_FILES['file']['tmp_name'];

  $fileName = CRM_Utils_File::makeFileName($_FILES['file']['name']);

  $dirName = civicrm_api3('setting', 'getvalue', array('name' => 'imageUploadDir')) . $filePrefix;
  CRM_Utils_File::createDir($dirName); // Create the upload directory if it doesn't already exist

  $file = $dirName . '/' . $fileName;

  // Move the uploaded file to the upload directory
  if (move_uploaded_file($tempFile, $file)) {
    $dirUrl = civicrm_api3('setting', 'getvalue', array('name' => 'imageUploadURL')) . $filePrefix;
    $fileUrl = $dirUrl . '/' . $fileName;

    return array('file' => $fileUrl);
  } else {
    throw new API_Exception('Failed to move the uploaded file', 500);
  }
}

