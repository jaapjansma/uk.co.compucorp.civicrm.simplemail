<?php

/*
 * General todos:
 *
 * TODO (robin): Automate adding a new option value for Group Type for Mailing Category on installation
 * TODO (robin): Automate adding a new option group and values for header categories
 */

require_once 'simplemail.civix.php';

simplemail_civicrm_init();

///////////
// Hooks //
///////////

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
    'name'  => 'SimpleMailHeader',
    'class' => 'CRM_Simplemail_DAO_SimpleMailHeader',
    'table' => 'civicrm_simplemailheader'
  );
  $entityTypes[] = array(
    'name'  => 'SimpleMailMessage',
    'class' => 'CRM_Simplemail_DAO_SimpleMailMessage',
    'table' => 'civicrm_simplemailmessage'
  );
  $entityTypes[] = array(
    'name'  => 'SimpleMail',
    'class' => 'CRM_Simplemail_DAO_SimpleMail',
    'table' => 'civicrm_simplemail'
  );
  $entityTypes[] = array(
    'name'  => 'SimpleMailHeaderFilter',
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
    'title' => 'Send a MailJet email',
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

	/* Added by Scott 10-12-2014 
	 * Only provides this extension's menu if a customised one does not already exist */
	foreach ($params as $parameter) {
		if ($parameter['attributes']['name'] == 'MailJet') {
			return;
		}
	}

  //  Get the maximum key of $params
  $maxKey = _getMenuKeyMax($params);

  $parentId = $maxKey + 1;

  $children = array();

  $parent = array(
    'attributes' => array(
      'label' => SM_EXT_NAME,
      'name'  => SM_EXT_NAME,
      'url'        => NULL,
      'permission' => 'access CiviSimpleMail',
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

  $currentChildId++;
  $children[$currentChildId] = array(
    'attributes' => array(
      'label'      => 'Headers',
      'name'       => 'Headers',
      'url'        => 'civicrm/admin/simple-mail#/headers',
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
      'label'      => 'Campaign Messages',
      'name'       => 'Campaign Messages',
      'url'        => 'civicrm/admin/simple-mail#/messages',
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
 * @param $permissions
 */
function simplemail_civicrm_permission(&$permissions) {
  // Name of extension
  $prefix = ts('CiviSimpleMail') . ': ';

  $permissions['access CiviSimpleMail'] = $prefix . ts('access CiviSimpleMail');
  $permissions['delete CiviSimpleMail'] = $prefix . ts('delete CiviSimpleMail');
  $permissions['access admin CiviSimpleMail'] = $prefix . ts('access admin CiviSimpleMail');
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

/**
 * Implementation of hook_civicrm_alterAPIPermissions
 *
 * This has been used here to add permissions for various entities necessary for the correct working of SimpleMail
 *
 * @param $entity
 * @param $action
 * @param $params
 * @param $permissions
 */
function simplemail_civicrm_alterAPIPermissions($entity, $action, &$params, &$permissions) {
  if (CRM_Core_Permission::check('access CiviSimpleMail')) {
    $permissionKeys = array('access CiviSimpleMail');

    $standardActions = array(
      'create' => $permissionKeys,
      'delete' => $permissionKeys,
      'get'    => $permissionKeys,
      'update' => $permissionKeys,
    );

    $permissions['simple_mail'] = array(
        'submitmassemail'     => $permissionKeys,
        'cancelmassemail'     => $permissionKeys,
        'sendtestemail'       => $permissionKeys,
        'duplicatemassemail'  => $permissionKeys,
        'iscreatedfromsearch' => $permissionKeys
      ) + $standardActions;

    $permissions['simple_mail_header'] = array(
        'uploadimage' => $permissionKeys,
        'deleteimage' => $permissionKeys
      ) + $standardActions;

    $permissions['simple_mail_message'] = array(
      'create' => $permissionKeys,
      'delete' => $permissionKeys,
      'get'    => $permissionKeys,
      'update' => $permissionKeys
    );

    $permissions['option_group'] = $permissions['option_value'] = array('get' => $permissionKeys);
  }
}

/////////////
// Helpers //
/////////////

/**
 * Initialise the extension
 */
function simplemail_civicrm_init() {
  define('SM_SESSION_SCOPE_PREFIX', 'SimpleMail_');

  /**
   * The value of the option value for name 'mailing_category', part of the option group 'group_type'
   */
  define('SM_MAILING_CATEGORY_GROUP_TYPE_VALUE', '3');

  // Permission
  define('SM_PERMISSION_ACCESS', 'access CiviSimpleMail');
  define('SM_PERMISSION_EDIT', 'edit CiviSimpleMail');
  define('SM_PERMISSION_DELETE', 'delete CiviSimpleMail');

  /** @var SimpleXMLElement[] $infoXml */
  $infoXml = CRM_Utils_XML::parseFile(simplemail_civicrm_getExtensionDir() . 'info.xml');

  foreach ($infoXml as $element) {
    if ($element instanceof SimpleXMLElement && $element->getName() == 'extension') {
      $attributes = $element->attributes();

      /**
       * Name of the extension
       */
      define('SM_EXT_NAME', (string) $element->name);

      /**
       * Key of the extension (also the name of the extension's directory)
       */
      define('SM_EXT_KEY', (string) $attributes['key']);

      /**
       * Path to the assets directory
       */
      define('SM_ASSETS_URL', simplemail_civicrm_getExtensionUrl() . '/assets');
    }
  }
}

/**
 * Get the absolute path of the extension directory, with a trailing slash
 * TODO (robin): Probably add the extension directory and url as constants as well
 *
 * @return string
 */
function simplemail_civicrm_getExtensionDir() {
  return str_replace('simplemail.php', '', simplemail_civicrm_getExtensionFile());
}

/**
 * Get the absolute path of this file
 *
 * @return string
 */
function simplemail_civicrm_getExtensionFile() {
  $files = simplemail_civicrm_getActiveModuleFiles();

  $extFile = '';
  foreach ($files as $file) {
    if ($file['prefix'] === 'simplemail') {
      $extFile = $file['filePath'];
      break;
    }
  }

  return $extFile;
}

/**
 * Get the URL to the extension directory
 *
 * @return string
 */
function simplemail_civicrm_getExtensionUrl() {
  $url = '';

  $urls = simplemail_civicrm_getActiveModuleUrls();

  if (array_key_exists(SM_EXT_KEY, $urls)) {
    $url = $urls[SM_EXT_KEY];
  }

  return $url;
}

/**
 * Get an array of all active module URLs
 *
 * @return array
 */
function simplemail_civicrm_getActiveModuleUrls() {
  $mapper = CRM_Extension_System::singleton()->getMapper();

  $urls = array();
  $urls['civicrm'] = $mapper->keyToUrl('civicrm');

  foreach ($mapper->getModules() as $module) {
    /** @var $module CRM_Core_Module */
    if ($module->is_active) {
      $urls[$module->name] = $mapper->keyToUrl($module->name);
    }
  }

  return $urls;
}

/**
 * Get an array of all active module files
 *
 * @return array
 */
function simplemail_civicrm_getActiveModuleFiles() {
  return CRM_Extension_System::singleton()->getMapper()->getActiveModuleFiles();
}

/**
 * @param $key
 * @param $value
 *
 * @return $this
 */
function simplemail_civicrm_addToSessionScope($key, $value) {
  CRM_Core_Session::singleton()
    ->set($key, $value, simplemail_civicrm_getSessionScopeName());
}

/**
 * @param $key
 *
 * @return mixed
 */
function simplemail_civicrm_getFromSessionScope($key) {
  return CRM_Core_Session::singleton()
    ->get($key, simplemail_civicrm_getSessionScopeName());
}

/**
 * @return string
 */
function simplemail_civicrm_getSessionScopeName() {
  return SM_SESSION_SCOPE_PREFIX . CRM_Core_Session::singleton()->get('userID');
}

/**
 * Clear the session scope used by Simple Mail
 */
function simplemail_civicrm_clearSessionScope() {
  $session = CRM_Core_Session::singleton();
  $sessionScope = simplemail_civicrm_getSessionScopeName();
  $session->resetScope($sessionScope);
}
