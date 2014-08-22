<?php

class CRM_Simplemail_BAO_SimpleMailHeader extends CRM_Simplemail_DAO_SimpleMailHeader {
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
   * Delete the header as well as the corresponding image files, if any
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
   * TODO (robin): This might not be needed anymore due to baking image URLs into the header array in Get API action
   *
   * @param array $params Array consisting of field name (corresponding to DB name) and file name
   *
   * @throws CRM_Extension_Exception
   * @return array
   */
//  public static function getImageUrl($params) {
//    if (!isset($params['field'])) {
//      throw new CRM_Extension_Exception('Image field param not provided');
//    }
//    if (!isset($params['fileName'])) {
//      throw new CRM_Extension_Exception('Image file name not provided');
//    }
//
//    $imageDirUrl = static::getImageDirUrl($params['field']);
//
//    return $imageDirUrl . $params['fileName'];
//  }

  /**
   * Get an array of headers joined together with their corresponding filters
   *
   * @return array
   * @throws CRM_Extension_Exception
   */
  public static function getHeadersWithFilters() {
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
      $dao = isset($dao) ? $dao : NULL;

      throw new CRM_Extension_Exception(
        'Failed to retrieve headers with filters: ' . $e->getMessage(), 500, array('dao' => $dao)
      );
    }

    return array('values' => $headersWithFilters, 'dao' => $dao);
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

  /**
   * Get the URL for the directory of an image field
   * TODO (robin): This appears to be not being used any more
   *
   * @param string $field Name of the image field in the DB
   *
   * @throws CRM_Extension_Exception
   * @return string
   */
//  protected static function getImageDirUrl($field) {
//    $api = _get_api_instance();
//    $entity = 'Setting';
//    $apiParams = array('name' => 'imageUploadURL');
//
//    if (!$api->$entity->GetValue($apiParams)) {
//      throw new CRM_Extension_Exception('Failed to retrieve image upload URL setting');
//    }
//
//    $path = $api->result();
//
//    $dirRelativePath = _get_image_dir_relative_path($field);
//
//    $path .= $dirRelativePath;
//
//    return $path . DIRECTORY_SEPARATOR;
//  }

  /**
   * Get the physical path to the directory where images for a particular field are stored on the file system
   *
   * @param string $field
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
