<?php

class CRM_Simplemail_BAO_SimpleMailHelper {
  // we should use this as the master CONST and remove it from other files
  const EXT_STORAGE_DIR_NAME = 'simple-mail';
    
  public static function getUploadDirUrl($field){
    $config = CRM_Core_Config::singleton();

    if (!$uploadUrl = $config->imageUploadURL) {
      throw new CRM_Extension_Exception(
        'Image upload URL not set. Please set it up in the administrative settings', 500
      );
    }
    
    return $uploadUrl . static::EXT_STORAGE_DIR_NAME . '/' . $field . '/';
  }

  public static function getUploadDirPath($field) {
    $config = CRM_Core_Config::singleton();

    if (!$uploadDir = $config->imageUploadDir) {
      throw new CRM_Extension_Exception(
        'Image upload directory not set. Please set it up in the administrative settings', 500
      );
    }

    return $uploadDir . static::EXT_STORAGE_DIR_NAME . DIRECTORY_SEPARATOR . $field . DIRECTORY_SEPARATOR;
  }


  public static function getUploadUrl($fileName, $field) {
    return static::getUploadDirUrl($field) . $fileName;
  }

  
}

?>