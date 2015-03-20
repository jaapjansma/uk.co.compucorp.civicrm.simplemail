<?php

class CRM_Simplemail_BAO_SimpleMailHeader extends CRM_Simplemail_DAO_SimpleMailHeader {
  /** The name of the base directory inside which files and folders specific to the extension are stored */
  const EXT_STORAGE_DIR_NAME = 'simple-mail';

  /**
   * Create a new SimpleMailHeader based on array-data
   *
   * @param array $params key-value pairs
   * @return CRM_Simplemail_DAO_SimpleMailHeader|NULL
   *
  public static function create($params) {
    $className = 'CRM_Simplemail_DAO_SimpleMailHeader';
    $entityName = 'SimpleMailHeader';
    $hook = empty($params['id']) ? 'create' : 'edit';

    CRM_Utils_Hook::pre($hook, $entityName, CRM_Utils_Array::value('id', $params), $params);
    $instance = new $className();
    $instance->copyValues($params);
    $instance->save();
    CRM_Utils_Hook::post($hook, $entityName, $instance->id, $instance);

    return $instance;
  } */

  /**
   * Get headers, optionally with filters
   *
   * @param array $params Array of optional params. Providing 'id' as a param would return a particular header with the
   *                      corresponding ID. Providing 'withFilters' as true would join the results with corresponding
   *                      filters.
   *
   * @return array
   * @throws CRM_Extension_Exception
   */
  public static function getHeaders($params) {
    $whereClause = isset($params['id']) ? 'h.id = ' . (int) $params['id'] : 'true';

    $withFilters = isset($params['withFilters']) && $params['withFilters'];

    $query = "SELECT h.id, h.label, h.image, h.show_logo, h.logo_image";
    $query .= $withFilters ? ", f.id AS filter_id, f.entity_table, f.entity_table, f.entity_id" : "";
    $query .= " FROM civicrm_simplemailheader h";
    $query .= $withFilters ? " RIGHT JOIN civicrm_simplemailheaderfilter f ON h.id = f.header_id" : "";
    $query .= " WHERE $whereClause";

    // Using UNION to simulate OUTER JOIN as MySQL does not support OUTER (or FULL) JOIN
    $query .= $withFilters ? " UNION " . str_replace('RIGHT JOIN', 'LEFT JOIN', $query) : "";

//    $query .= " ORDER BY h.id";


    try {
      /** @var CRM_Simplemail_DAO_SimpleMailHeader|CRM_Simplemail_DAO_SimpleMailHeaderFilter|CRM_Core_DAO $dao */
      $dao = CRM_Core_DAO::executeQuery($query);

      $headersWithFilters = array();

      while ($dao->fetch()) {
        $header = $dao->toArray();

        $header['image_url'] = $dao->image ? static::getImageUrl($dao->image, 'image') : NULL;
        $header['logo_image_url'] = $dao->logo_image ? static::getImageUrl($dao->logo_image, 'logo_image') : NULL;

        $headersWithFilters[] = $header;
      }
    } catch (Exception $e) {
      $dao = isset($dao) ? $dao : NULL;

      throw new CRM_Extension_Exception('Failed to retrieve headers: ' . $e->getMessage(), 500, array('dao' => $dao));
    }

    return array('values' => $headersWithFilters, 'dao' => $dao);
  }

  /**
   * Delete the header as well as the corresponding image files, if any.
   *
   * @param bool $params
   *
   * @return mixed|void
   * @throws API_Exception
   */
  public function delete($params = FALSE) {
    // Delete the header image
    if ($params['image']) {
      static::deleteImage(array('field' => 'image', 'fileName' => $params['image']));
    }

    // Delete the logo image
    if ($params['logo_image']) {
      static::deleteImage(array('logo_field' => 'logo_image', 'fileName' => $params['logo_image']));
    }

    parent::delete($params);
  }

  /**
   * @param $params
   *
   * @return array
   * @throws CRM_Extension_Exception
   */
  public static function uploadImage($params) {
    $tempFile = $_FILES['file']['tmp_name'];

    $fileName = CRM_Utils_File::makeFileName($_FILES['file']['name']);
    $dirName = static::getImageDirPath($params['field']);

    // Create the upload directory, if it doesn't already exist
    CRM_Utils_File::createDir($dirName);

    $file = $dirName . $fileName;

    // Move the uploaded file to the upload directory
    if (move_uploaded_file($tempFile, $file)) {
      $imageUrl = static::getImageUrl($fileName, $params['field']);

      $result['values'] = array(
        array('imageUrl' => $imageUrl, 'imageFileName' => $fileName)
      );

      return $result;
    }
    else {
      throw new CRM_Extension_Exception('Failed to move the uploaded file', 500);
    }
  }

  /**
   * Delete the image file as specified by the file name and field
   *
   * @param $params
   *
   * @throws CRM_Extension_Exception
   */
  public static function deleteImage($params) {
    if (!isset($params['fileName']) || !isset($params['field'])) {
      throw new CRM_Extension_Exception('Failed to delete image as image file name or field not supplied', 400);
    }

    $file = static::getImagePath($params['fileName'], $params['field']);

    if (unlink($file)) {
      return TRUE;
    }
    else {
      $error = 'Unknown error';

      if (!file_exists($file)) {
        $error = 'File ' . $params['fileName']
          . ' be deleted does not exist. This would generally happen when a new file was uploaded, thereby deleting the existing file, but the page was not subsequently saved to record the change to the file name. This error can be ignored safely for most cases.';
      }
      else {
        if (!is_file($file)) {
          $error = 'File ' . $params['fileName'] . ' for deletion is not a regular file';
        }
        else {
          if (!is_writable($file)) {
            $error = 'File ' . $params['fileName'] . ' to be deleted is not writable';
          }
        }
      }

      throw new CRM_Extension_Exception($error, 500);
    }
  }

  /**
   * Get URL for an image corresponding to the provided image field and file name
   *
   * @param string $fileName The file name of the image
   * @param string $field    The name of the image field in the DB
   *
   * @throws CRM_Extension_Exception
   *
   * @return string Absolute URL of the image file
   */
  public static function getImageUrl($fileName, $field) {
    return static::getImageDirUrl($field) . $fileName;
  }

  /**
   * Get physical path to the image from the file name and field provided
   *
   * @param string $fileName The file name of the image
   * @param string $field    The name of the image field in the DB
   *
   * @throws CRM_Extension_Exception
   * @return string Absolute physical path to the image file
   */
  public static function getImagePath($fileName, $field) {
    $imagePath = static::getImageDirPath($field) . $fileName;

    if (!file_exists($imagePath)) {
      throw new CRM_Extension_Exception('The file does not exist on the file system');
    }

    return $imagePath;
  }

  ///////////////////////
  // Protected Methods //
  ///////////////////////

  /**
   * Get the URL for the directory of an image field
   *
   * @param string $field Name of the image field in the DB
   *
   * @throws CRM_Extension_Exception
   * @return string
   */
  protected static function getImageDirUrl($field) {
    $config = CRM_Core_Config::singleton();

    if (!$imageUploadUrl = $config->imageUploadURL) {
      throw new CRM_Extension_Exception(
        'Image upload URL not set. Please set it up in the administrative settings', 500
      );
    }
		
    return $imageUploadUrl . static::EXT_STORAGE_DIR_NAME . '/' . $field . '/';
  }

  /**
   * Get the physical path to the directory where images for a particular field are stored on the file system
   *
   * @param string $field Image field name
   *
   * @throws CRM_Extension_Exception
   * @return string Absolute physical path to the directory
   */
  protected static function getImageDirPath($field) {
    $config = CRM_Core_Config::singleton();

    if (!$imageUploadDir = $config->imageUploadDir) {
      throw new CRM_Extension_Exception(
        'Image upload directory not set. Please set it up in the administrative settings', 500
      );
    }

    return $imageUploadDir . static::EXT_STORAGE_DIR_NAME . DIRECTORY_SEPARATOR . $field . DIRECTORY_SEPARATOR;
  }
}
