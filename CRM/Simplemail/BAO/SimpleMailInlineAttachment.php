<?php
class CRM_Simplemail_BAO_SimpleMailInlineAttachment extends CRM_Simplemail_DAO_SimpleMailInlineAttachment {
  const DIRECTORY = 'attachments';
  
  public static function upload($params) {

    if (!$_FILES){
      throw new CRM_Extension_Exception('Sorry, the file you uploaded was too large or invalid. Code 1', 500);
    }
    
    if (empty($_FILES['file']['size'])){
      throw new CRM_Extension_Exception('Sorry, the file you uploaded was too large or invalid. Code 2', 500);
    }

    $tempFile = $_FILES['file']['tmp_name'];

    

    $originalFilename = static::cleanFilename($_FILES['file']['name']);
    
    $fileName = CRM_Utils_File::makeFileName(
      static::cleanFilename($_FILES['file']['name'])
    );
    
    $dirName = CRM_Simplemail_BAO_SimpleMailHelper::getUploadDirPath(static::DIRECTORY);

    // Create the upload directory, if it doesn't already exist
    CRM_Utils_File::createDir($dirName);

    $file = $dirName . $fileName;

    // Move the uploaded file to the upload directory
    if (move_uploaded_file($tempFile, $file)) {
      $url = CRM_Simplemail_BAO_SimpleMailHelper::getUploadUrl($fileName, static::DIRECTORY);
      
      $databaseId = static::saveToDatabase($params['simplemail_id'], $originalFilename, $url);
      
      $result['values'] = array(
        array('url' => $url, 'filename' => $originalFilename, 'databaseId' => $databaseId)
      );

      return $result;
    } else {
      throw new CRM_Extension_Exception('Failed to move the uploaded file', 500);
    }
  }
  
  /**
   * This method adds the upload to the database
   * 
   * @return int  the id of the row inserted
   */
  public static function saveToDatabase($simpleMailId, $filename, $url){
    $attachment = new CRM_Simplemail_DAO_SimpleMailInlineAttachment();
    $attachment->reset();
    $attachment->simplemail_id = $simpleMailId;
    $attachment->filename = $filename;
    $attachment->url = $url;
    $attachment->save();
    
    return $attachment->id;
  }
  
  /**
   * Retrieve all the inline attachment rows from the database that belong to this mailing
   * 
   * @param Array $params   should contain one key 'id' which is the Simple Mail ID that all the attachments belong to
   */
  public static function getAll($params){
    $attachment = new CRM_Simplemail_DAO_SimpleMailInlineAttachment();
    $attachment->simplemail_id = $params['id'];
    $matches = $attachment->find();
    
    if (!$matches){
      return array();
    }
    
    $results = array();
    while ($attachment->fetch()){
        
      // We extract only the information we really need
      // returning an array of attachment objects would send back lots of private properties
      // which aren't required / shouldn't be seen by the front end
      $results[] = array(
        'id' =>             $attachment->id,
        'filename' =>       $attachment->filename,
        'simplemail_id' =>  $attachment->simplemail_id,
        'url' =>            $attachment->url
      );
      
    };
    
    return $results;
    
  }
  
  
  /**
   * Pass in a filename that has typically come from the frontend through this method
   * It will remove any "illegal" characters
   * May need to consider stripping things like ><| too
   */
  public static function cleanFilename($filename){
    $result = $filename;
    
    $result = filter_var($result, FILTER_SANITIZE_STRING, FILTER_FLAG_STRIP_LOW);
    $result = basename($result);
    
    return $result;
  }
  
  
  /**
   * Deletes a single attachment from the database AND disk
   * 
   * @param Array $params   should contain one key called 'id' and a value which matches the id of the attachment you wish to delete
   */
  public static function remove($params){
    if (!static::authorised(SM_PERMISSION_DELETE)) {
      throw new CRM_Extension_Exception('Sorry! You do not have permission to delete attachments', 500);
    }
    
    $attachment = new CRM_Simplemail_DAO_SimpleMailInlineAttachment();
    $attachment->get('id', $params['id']);
    
    // try to delete the file first as this is most likely to fail
    $filename = CRM_Simplemail_BAO_SimpleMailHelper::getUploadDirPath(static::DIRECTORY);
    $filename .= basename($attachment->url);
    
    $unlinkResult = unlink($filename);
    if (!$unlinkResult){
      throw new CRM_Extension_Exception("Unable to delete the attachment", 500);
      return;
    }
    
    $result = $attachment->delete();
    
    if ($result){
      return true;
    } else {
      throw new CRM_Extension_Exception("Could not delete upload", 500);
      return;
    }
    
  }
  
  /**
   * Deletes all the attachments in the table that match the simple mail ID provided
   */
  public static function removeAll($simpleMailId){
    if (!CRM_Core_Permission::check(SM_PERMISSION_DELETE)) {
      throw new CRM_Extension_Exception('Sorry! You do not have permission to delete attachments', 500);
    }
    
    
    // not the most efficient way but then I doubt we'll be deleting 100's of attachments
    // so this feels the most consistent way to do deletions
    
    $attachment = new CRM_Simplemail_DAO_SimpleMailInlineAttachment();
    $attachment->simplemail_id = $simpleMailId;
    $total = $attachment->find();
    
    while ($attachment->fetch()){
      $filename = CRM_Simplemail_BAO_SimpleMailHelper::getUploadDirPath(static::DIRECTORY);
      $filename .= basename($attachment->url);

      $unlinkResult = unlink($filename);

      $attachment->delete();
    }
    
    return true;
    
  }
  
}

?>
  