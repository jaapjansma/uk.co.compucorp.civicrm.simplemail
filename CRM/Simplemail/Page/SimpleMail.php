<?php

require_once 'CRM/Core/Page.php';

class CRM_Simplemail_Page_SimpleMail extends CRM_Core_Page {
  function run() {
    // Example: Set the page-title dynamically; alternatively, declare a static title in xml/Menu/*.xml
    CRM_Utils_System::setTitle(ts('Simple Mail'));

    // Example: Assign a variable for use in a template
    $this->assign('currentTime', date('Y-m-d H:i:s'));

    CRM_Core_Resources::singleton()
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/jquery.min.js', 30, 'page-footer')
      ->addScriptUrl('/sites/all/modules/civicrm/packages/ckeditor/ckeditor.js', 40, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/select2.min.js', 50, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/angular.min.js', 60, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/angular-route.min.js', 70, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/angular-animate.min.js', 80, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/angular-select2.js', 90, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/date.sugar.min.js', 91, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/ng-quick-date.min.js', 92, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/dist/app.js', 100, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/dist/services.js', 110, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/dist/directives.js', 120, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/dist/constants.js', 130, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/dist/filters.js', 140, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/dist/controllers.js', 150, 'page-footer')
      ->addStyleFile('uk.co.compucorp.civicrm.simplemail', 'css/vendors/select2.css')
      ->addStyleFile('uk.co.compucorp.civicrm.simplemail', 'css/dist/style.css')
      ->addStyleFile('uk.co.compucorp.civicrm.simplemail', 'css/vendors/ng-quick-date-plus-default-theme.css')
      ->addStyleUrl('//maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css')
    ;

    parent::run();
  }
}