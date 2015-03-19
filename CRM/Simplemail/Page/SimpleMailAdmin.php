<?php

require_once 'CRM/Core/Page.php';

class CRM_Simplemail_Page_SimpleMailAdmin extends CRM_Core_Page {
  function run() {
    // Example: Set the page-title dynamically; alternatively, declare a static title in xml/Menu/*.xml
    CRM_Utils_System::setTitle(ts(SM_EXT_NAME . ' Admin'));

    $ckeditorUrl = simplemail_civicrm_getExtensionUrl() . '/js/vendors/ckeditor/';

    CRM_Core_Resources::singleton()
      // es5-shim needed by angular-file-upload
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/es5-shim.min.js', 40, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/jquery.min.js', 50, 'page-footer')
      ->addScript("CKEDITOR_BASEPATH='$ckeditorUrl'", 60, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/ckeditor/ckeditor.js', 70, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/angular.min.js', 80, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/angular-route.min.js', 90, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/angular-animate.min.js', 90, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/select.min.js', 100, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/angular-file-upload.min.js', 110, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/dist/script.js', 120, 'page-footer')
      ->addStyleFile('uk.co.compucorp.civicrm.simplemail', 'css/vendors/select.min.css')
      ->addStyleFile('uk.co.compucorp.civicrm.simplemail', 'css/vendors/select2.css')
      ->addStyleFile('uk.co.compucorp.civicrm.simplemail', 'css/dist/style.css')
      ->addSetting(array('resourceUrls' => simplemail_civicrm_getActiveModuleUrls()))
			->addSetting(array('API_URL' => CIVICRM_UF_BASEURL))	// this will break when/if we upgrade to 4.5
		;
	
    parent::run();
  }
}
