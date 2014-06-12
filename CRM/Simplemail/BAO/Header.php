<?php

class CRM_Simplemail_BAO_Header extends CRM_Simplemail_DAO_Header {

  /**
   * Create a new Header based on array-data
   *
   * @param array $params key-value pairs
   * @return CRM_Simplemail_DAO_Header|NULL
   *
  public static function create($params) {
    $className = 'CRM_Simplemail_DAO_Header';
    $entityName = 'Header';
    $hook = empty($params['id']) ? 'create' : 'edit';

    CRM_Utils_Hook::pre($hook, $entityName, CRM_Utils_Array::value('id', $params), $params);
    $instance = new $className();
    $instance->copyValues($params);
    $instance->save();
    CRM_Utils_Hook::post($hook, $entityName, $instance->id, $instance);

    return $instance;
  } */
}
