<?php

require_once 'CRM/Core/Page.php';

class CRM_Simplemail_Page_SimpleMailAdmin extends CRM_Core_Page {
  function run() {
    // Example: Set the page-title dynamically; alternatively, declare a static title in xml/Menu/*.xml
    CRM_Utils_System::setTitle(ts('Simple Mail Admin'));

    // Example: Assign a variable for use in a template
    $this->assign('currentTime', date('Y-m-d H:i:s'));

    CRM_Core_Resources::singleton()
      ->addScriptFile(
        'uk.co.compucorp.civicrm.simplemail', 'js/vendors/es5-shim.min.js', 50, 'page-footer'
      )// needed by angular-file-upload
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/jquery.min.js', 60, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/angular.min.js', 80, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/angular-route.min.js', 90, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/angular-animate.min.js', 90, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/select.min.js', 100, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/angular-file-upload.min.js', 110, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/dist/script.js', 120, 'page-footer')
      ->addStyleFile('uk.co.compucorp.civicrm.simplemail', 'css/vendors/select.min.css')
      ->addStyleFile('uk.co.compucorp.civicrm.simplemail', 'css/vendors/select2.css')
      ->addStyleFile('uk.co.compucorp.civicrm.simplemail', 'css/dist/style.css')
      ->addSetting(array('resourceUrls' => CRM_Simplemail_Page_SimpleMail::getActiveModuleUrls()));

    parent::run();
  }
}
