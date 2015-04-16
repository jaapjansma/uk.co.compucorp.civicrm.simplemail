<?php

class CRM_Simplemail_BAO_SimpleMailHelper {
  // we should use this as the master CONST and remove it from other files
  const EXT_STORAGE_DIR_NAME = 'simple-mail';
  const SIGNATURE_DIR = 'signatures';
  const SIGNATURE_FILE_EXT = '.png';
    
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


  /**
   * Pass in a signature name, such as mary, or an empty signature name
   * and you'll be returned a URL to the relevant signature image
   * 
   * If you pass in an empty string, this method will try to find a signature
   * for the currently logged in user
   * 
   * @return String|Boolean   string filename on success, false on failure
   * 
   */
  public static function getSignatureFilename($signatureName){
    // apparently this is the Drupal way of getting the user!
    global $user;
    
    $username = '';
    if (empty($signatureName)){
      // try and find the currently logged in user's signature, if it exists
      $username = $user->name;
    } else {
      // trim the trailing underscore
      $username = $signatureName;
    }
    
    $filename = static::buildSignatureFilename($username);
    
    if (file_exists($filename)){
      return static::buildSignatureURL($username);
    }
    
    return false;
    
  }
  
  
  /**
   * Pass in a name and this builds the file path to that signature filename
   * It does NOT check the file actually exists
   * 
   * @return String
   */
  public static function buildSignatureFilename($name){
    $name = static::cleanFilename($name);
    return static::getUploadDirPath(static::SIGNATURE_DIR) . $name . static::SIGNATURE_FILE_EXT;
  }
  
  
  /**
   * As above, but generates a URL to the signature
   */
  public static function buildSignatureURL($name){
    $name = static::cleanFilename($name);
    return static::getUploadUrl($name . static::SIGNATURE_FILE_EXT, static::SIGNATURE_DIR);
  }


  /**
   * Pass in a filename that has typically come from the frontend through this method
   * It will remove any "illegal" characters
   */
  public static function cleanFilename($filename){
    $result = $filename;
    
    $result = filter_var($result, FILTER_SANITIZE_STRING, FILTER_FLAG_STRIP_LOW);
    $result = basename($result);
    $result = str_replace(array("|", ">", "<"), '', $result);
    
    return $result;
  }
  
  

  
}

?>