<?php

class CRM_Simplemail_BAO_SimpleMailHeader extends CRM_Simplemail_DAO_SimpleMailHeader {

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
   * Get URL for an image corresponding to the provided image field and file name
   *
   * @param array $params Array consisting of field name (corresponding to DB name) and file name
   *
   * @throws CRM_Extension_Exception
   * @return array
   */
  public static function getImageUrl($params) {
    if (!isset($params['field'])) {
      throw new CRM_Extension_Exception('Image field param not provided');
    }
    if (!isset($params['fileName'])) {
      throw new CRM_Extension_Exception('Image file name not provided');
    }

    $imageDirUrl = static::getImageDirUrl($params['field']);

    return $imageDirUrl . $params['fileName'];
  }

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
      throw new CRM_Extension_Exception('Failed to retrieve headers with filters: ' . $e->getMessage(), 500);
    }

    return array('is_error' => 0, 'values' => $headersWithFilters);
  }

  /**
   * Get the URL for the directory of an image field
   *
   * @param string $field Name of the image field in the DB
   *
   * @throws CRM_Extension_Exception
   * @return string
   */
  protected static function getImageDirUrl($field) {
    $api = _get_api_instance();
    $entity = 'Setting';
    $apiParams = array('name' => 'imageUploadURL');

    if (!$api->$entity->GetValue($apiParams)) {
      throw new CRM_Extension_Exception('Failed to retrieve image upload URL setting');
    }

    $path = $api->result();

    $dirRelativePath = _get_image_dir_relative_path($field);

    $path .= $dirRelativePath;

    return $path . DIRECTORY_SEPARATOR;
  }
}
