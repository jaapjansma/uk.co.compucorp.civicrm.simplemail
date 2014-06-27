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
}
