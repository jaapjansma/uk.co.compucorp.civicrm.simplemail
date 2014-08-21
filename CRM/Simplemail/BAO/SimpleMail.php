<?php

class CRM_Simplemail_BAO_SimpleMail extends CRM_Simplemail_DAO_SimpleMail {

  /**
   * Create a new SimpleMail based on array-data
   *
   * @param array $params key-value pairs
   * @return CRM_Simplemail_DAO_SimpleMail|NULL
   *
  public static function create($params) {
    $className = 'CRM_Simplemail_DAO_SimpleMail';
    $entityName = 'SimpleMail';
    $hook = empty($params['id']) ? 'create' : 'edit';

    CRM_Utils_Hook::pre($hook, $entityName, CRM_Utils_Array::value('id', $params), $params);
    $instance = new $className();
    $instance->copyValues($params);
    $instance->save();
    CRM_Utils_Hook::post($hook, $entityName, $instance->id, $instance);

    return $instance;
  } */

  public static function getMailing($params) {
    $whereClause = isset($params['id']) ? 'sm.id = ' . (int) $params['id'] : 'true';

    $query
      = "
    SELECT
      sm.id, sm.crm_mailing_id, sm.from_address, sm.header_id, sm.title, sm.body, sm.contact_details, sm.message_id,
      cm.name, cm.subject, cm.body_html, cm.created_id, cm.created_date, cm.scheduled_date,
      MIN(j.start_date) start_date, MAX(j.end_date) end_date, j.status,
      c.sort_name

    FROM civicrm_simplemail sm

    LEFT JOIN civicrm_mailing cm
    ON sm.crm_mailing_id = cm.id

    LEFT JOIN civicrm_mailing_job j
    ON (sm.crm_mailing_id = j.mailing_id AND j.is_test = 0 AND j.parent_id IS NULL)

    LEFT JOIN civicrm_contact c
    ON cm.created_id = c.id

    WHERE $whereClause

    GROUP BY sm.id
  ";

    try {
      /** @var CRM_Core_DAO $dao */
      $dao = CRM_Core_DAO::executeQuery($query);

      $mailings = array();

      while ($dao->fetch()) {
        $mailings[] = $dao->toArray();
      }
    } catch (Exception $e) {
      throw new API_Exception('Failed to retrieve mailings: ' . $e->getMessage(), 500);
    }

    return array('is_error' => 0, 'values' => $mailings);
  }
}
