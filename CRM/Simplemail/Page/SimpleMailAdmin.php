<?php

require_once 'CRM/Core/Page.php';

class CRM_Simplemail_Page_SimpleMailAdmin extends CRM_Core_Page
{
  function run()
  {
    // Example: Set the page-title dynamically; alternatively, declare a static title in xml/Menu/*.xml
    CRM_Utils_System::setTitle(ts('Simple Mail Admin'));

    // Example: Assign a variable for use in a template
    $this->assign('currentTime', date('Y-m-d H:i:s'));

    CRM_Core_Resources::singleton()
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/angular.min.js', 80, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/angular-route.min.js', 90, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/angular-animate.min.js', 90, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/dist/admin-app.js', 100, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/dist/services.js', 110, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/dist/admin-controllers.js', 120, 'page-footer')
      ->addStyleFile('uk.co.compucorp.civicrm.simplemail', 'css/dist/style.css')
    ;

    parent::run();
  }
}
