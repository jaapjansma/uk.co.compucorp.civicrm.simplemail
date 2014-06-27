<?php

require_once 'CRM/Core/Page.php';

/**
 * Class CRM_Simplemail_Page_Headers
 */
class CRM_Simplemail_Page_Headers extends CRM_Core_Page_Basic
{

  /**
   * @var
   */
  protected static $_links;

  /**
   *
   */
  function run()
  {
    // Example: Set the page-title dynamically; alternatively, declare a static title in xml/Menu/*.xml
    CRM_Utils_System::setTitle(ts('Headers'));

    // Example: Assign a variable for use in a template
    $this->assign('currentTime', date('Y-m-d H:i:s'));
    CRM_Core_Resources::singleton()
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/vendors/angular.min.js', 90, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/dist/app.js', 100, 'page-footer')
      ->addScriptFile('uk.co.compucorp.civicrm.simplemail', 'js/dist/controllers.js', 110, 'page-footer');

    parent::run();
  }

  /**
   * name of the BAO to perform various DB manipulations
   *
   * @return string
   * @access public
   a/
  function getBAOName()
  {
    return 'CRM_Simplemail_BAO_SimpleMailHeader';
  }

  /**
   * an array of action links
   *
   * @return array (reference)
   * @access public
   */
  function &links()
  {
    if (!static::$_links) {
      static::$_links = array(
        CRM_Core_Action::UPDATE => array(
          'name' => ts('Edit'),
          'url' => 'civicrm/admin/simple-mail/headers/%%id%%/edit',
          'qs' => 'reset=1',
          'title' => ts('Edit Resource'),
        ),
        CRM_Core_Action::DELETE => array(
          'name' => ts('Delete'),
          'url' => 'civicrm/admin/simple-mail/headers/%%id%%/delete',
          'qs' => 'reset=1',
          'title' => ts('Delete Resource'),
        )
      );
    }
    return self::$_links;
  }

  /**
   * name of the edit form class
   *
   * @return string
   * @access public
   */
  function editForm()
  {
    // TODO: Implement editForm() method.
  }

  /**
   * name of the form
   *
   * @return string
   * @access public
   */
  function editName()
  {
    // TODO: Implement editName() method.
  }

  /**
   * userContext to pop back to
   *
   * @param int $mode mode that we are in
   *
   * @return string
   * @access public
   */
  function userContext($mode = NULL)
  {
    // TODO: Implement userContext() method.
  }

  /**
   *
   */
  function browse()
  {
    $bao = new CRM_Simplemail_BAO_SimpleMailHeader();
    $bao->find();

    $headers = array();
    $action = array_sum(array_keys($this->links()));

    while ($bao->fetch()) {
      $headers[$bao->id] = $bao->toArray();
      $headers[$bao->id]['action'] = CRM_Core_Action::formLink(static::links(), $action,
        array('id' => $bao->id)
      );
    }


    $this->assign('headers', $headers);
  }

  public function registerScripts()
  {
    CRM_Core_Resources::singleton()
      ->addScriptFile('', 'js/vendors/angular.min.js', 100, 'html-header', false);
  }

}
