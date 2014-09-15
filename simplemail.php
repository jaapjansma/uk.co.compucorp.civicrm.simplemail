<?php

require_once 'simplemail.civix.php';

/**
 * Implementation of hook_civicrm_config
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_config
 */
function simplemail_civicrm_config(&$config) {
  _simplemail_civix_civicrm_config($config);
}

/**
 * Implementation of hook_civicrm_xmlMenu
 *
 * @param $files array(string)
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_xmlMenu
 */
function simplemail_civicrm_xmlMenu(&$files) {
  _simplemail_civix_civicrm_xmlMenu($files);
}

/**
 * Implementation of hook_civicrm_install
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_install
 */
function simplemail_civicrm_install() {
  return _simplemail_civix_civicrm_install();
}

/**
 * Implementation of hook_civicrm_uninstall
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_uninstall
 */
function simplemail_civicrm_uninstall() {
  return _simplemail_civix_civicrm_uninstall();
}

/**
 * Implementation of hook_civicrm_enable
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_enable
 */
function simplemail_civicrm_enable() {
  return _simplemail_civix_civicrm_enable();
}

/**
 * Implementation of hook_civicrm_disable
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_disable
 */
function simplemail_civicrm_disable() {
  return _simplemail_civix_civicrm_disable();
}

/**
 * Implementation of hook_civicrm_upgrade
 *
 * @param $op string, the type of operation being performed; 'check' or 'enqueue'
 * @param $queue CRM_Queue_Queue, (for 'enqueue') the modifiable list of pending up upgrade tasks
 *
 * @return mixed  based on op. for 'check', returns array(boolean) (TRUE if upgrades are pending)
 *                for 'enqueue', returns void
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_upgrade
 */
function simplemail_civicrm_upgrade($op, CRM_Queue_Queue $queue = NULL) {
  return _simplemail_civix_civicrm_upgrade($op, $queue);
}

/**
 * Implementation of hook_civicrm_managed
 *
 * Generate a list of entities to create/deactivate/delete when this module
 * is installed, disabled, uninstalled.
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_managed
 */
function simplemail_civicrm_managed(&$entities) {
  return _simplemail_civix_civicrm_managed($entities);
}

/**
 * Implementation of hook_civicrm_caseTypes
 *
 * Generate a list of case-types
 *
 * Note: This hook only runs in CiviCRM 4.4+.
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_caseTypes
 */
function simplemail_civicrm_caseTypes(&$caseTypes) {
  _simplemail_civix_civicrm_caseTypes($caseTypes);
}

/**
 * Implementation of hook_civicrm_alterSettingsFolders
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_alterSettingsFolders
 */
function simplemail_civicrm_alterSettingsFolders(&$metaDataFolders = NULL) {
  _simplemail_civix_civicrm_alterSettingsFolders($metaDataFolders);
}

/**
 * Implementation of hook_civicrm_entityTypes
 *
 * This has been used here for registering entities
 *
 * @param $entityTypes
 */
function simplemail_civicrm_entityTypes(&$entityTypes) {
  $entityTypes[] = array(
    'name' => 'SimpleMailHeader',
    'class' => 'CRM_Simplemail_DAO_SimpleMailHeader',
    'table' => 'civicrm_simplemailheader'
  );
  $entityTypes[] = array(
    'name' => 'SimpleMailMessage',
    'class' => 'CRM_Simplemail_DAO_SimpleMailMessage',
    'table' => 'civicrm_simplemailmessage'
  );
  $entityTypes[] = array(
    'name' => 'SimpleMail',
    'class' => 'CRM_Simplemail_DAO_SimpleMail',
    'table' => 'civicrm_simplemail'
  );
  $entityTypes[] = array(
    'name' => 'SimpleMailHeaderFilter',
    'class' => 'CRM_Simplemail_DAO_SimpleMailHeaderFilter',
    'table' => 'civicrm_simplemailheaderfilter'
  );
}

/**
 * Implementation of hook_civicrm_searchTasks
 *
 * This has been used here for adding custom search actions on the contact search results page
 *
 * @param $objectType
 * @param $tasks
 */
function simplemail_civicrm_searchTasks($objectType, &$tasks) {
  $tasks[] = array(
    'title' => 'Schedule/Send a Simple Mail Mass Mailing',
    'class' => array(
      'CRM_Simplemail_Form_SimpleMailRecipientsFromSearch'
    )
  );
}

/**
 * Implementation of hook_civicrm_navigationMenu
 *
 * This has been used here for adding menu links for various Simple Mail pages
 *
 * @param $params
 */
function simplemail_civicrm_navigationMenu(&$params) {
  //  Get the maximum key of $params
  $maxKey = _getMenuKeyMax($params);

  $parentId = $maxKey + 1;

  $children = array();

  $parent = array(
    'attributes' => array(
      'label'      => 'Simple Mail',
      'name'       => 'Simple Mail',
      'url'        => NULL,
      'permission' => NULL,
      'operator'   => NULL,
      'separator'  => NULL,
      'parentID'   => NULL,
      'navID'      => $parentId,
      'active'     => 1
    )
  );

  $currentChildId = $parentId + 1;
  $children[$currentChildId] = array(
    'attributes' => array(
      'label'      => 'New Mailing',
      'name'       => 'New Mailings',
      'url'        => 'civicrm/simple-mail#/mailings/new',
      'permission' => NULL,
      'operator'   => NULL,
      'parentID'   => $parentId,
      'navID'      => $currentChildId,
      'active'     => 1
    )
  );

  $currentChildId++;
  $children[$currentChildId] = array(
    'attributes' => array(
      'label'      => 'Mailings',
      'name'       => 'Mailings',
      'url'        => 'civicrm/simple-mail#/mailings',
      'permission' => NULL,
      'operator'   => NULL,
      'parentID'   => $parentId,
      'navID'      => $currentChildId,
      'active'     => 1
    )
  );

  $parent['child'] = $children;

  $params[$parentId] = $parent;
}

/**
 * Return the maximum key from the menu items array
 *
 * @param $menuArray
 *
 * @return mixed
 */
function _getMenuKeyMax($menuArray) {
  $max = array(max(array_keys($menuArray)));
  foreach ($menuArray as $v) {
    if (!empty($v['child'])) {
      $max[] = _getMenuKeyMax($v['child']);
    }
  }

  return max($max);
}