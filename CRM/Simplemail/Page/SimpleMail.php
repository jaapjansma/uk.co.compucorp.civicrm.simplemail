<?php

require_once 'CRM/Core/Page.php';

class CRM_Simplemail_Page_SimpleMail extends CRM_Core_Page {
  function run() {
    // Example: Set the page-title dynamically; alternatively, declare a static title in xml/Menu/*.xml
    CRM_Utils_System::setTitle(ts(SM_EXT_NAME));

    $ckeditorUrl = simplemail_civicrm_getExtensionUrl() . '/js/vendors/ckeditor/';

    CRM_Core_Resources::singleton()
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/jquery.min.js', 20, 'page-footer')
      ->addScript("CKEDITOR_BASEPATH='$ckeditorUrl'", 30, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/ckeditor/ckeditor.js', 40, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/angular.min.js', 60, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/angular-route.min.js', 70, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/angular-file-upload.min.js', 75, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/angular-animate.min.js', 80, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/select.min.js', 90, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/date.sugar.min.js', 91, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/ng-quick-date.min.js', 92, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/dist/script.js', 100, 'page-footer')
      ->addStyleFile('uk.co.compucorp.civicrm.simplemail', 'css/vendors/select.min.css')
      ->addStyleFile('uk.co.compucorp.civicrm.simplemail', 'css/vendors/select2.css')
      ->addStyleFile('uk.co.compucorp.civicrm.simplemail', 'css/dist/style.css')
      ->addStyleFile('uk.co.compucorp.civicrm.simplemail', 'css/vendors/ng-quick-date-plus-default-theme.css')
      ->addStyleFile('uk.co.compucorp.civicrm.simplemail', 'css/vendors/font-awesome-4.2.0/css/font-awesome.min.css')
      ->addSetting(array('resourceUrls' => simplemail_civicrm_getActiveModuleUrls()))
			->addSetting(array('API_URL' => CIVICRM_UF_BASEURL))	// this will break when/if we upgrade to 4.5
		;

    parent::run();
  }

}
