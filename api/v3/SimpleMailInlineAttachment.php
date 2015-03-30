<?php

function civicrm_api3_simple_mail_inline_attachment_remove($params) {
  try {
    $result = CRM_Simplemail_BAO_SimpleMailInlineAttachment::remove($params);
    
    return $result;
  } catch (CRM_Extension_Exception $e) {
    $errorData = $e->getErrorData();
    return civicrm_api3_create_error($e->getMessage(), array(), $errorData['dao']);
  }
}

function civicrm_api3_simple_mail_inline_attachment_getall($params) {
  try {
    $result = CRM_Simplemail_BAO_SimpleMailInlineAttachment::getAll($params);
    return array('values' => $result);
  } catch (CRM_Extension_Exception $e) {
    $errorData = $e->getErrorData();
    return civicrm_api3_create_error($e->getMessage(), array(), $errorData['dao']);
  }
}

?>