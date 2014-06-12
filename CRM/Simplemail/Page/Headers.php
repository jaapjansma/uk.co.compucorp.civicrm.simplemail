<?php

require_once 'CRM/Core/Page.php';

class CRM_Simplemail_Page_Headers extends CRM_Core_Page_Basic {
  function run() {
    // Example: Set the page-title dynamically; alternatively, declare a static title in xml/Menu/*.xml
    CRM_Utils_System::setTitle(ts('Headers'));

    // Example: Assign a variable for use in a template
    $this->assign('currentTime', date('Y-m-d H:i:s'));

    parent::run();
  }

  /**
   * name of the BAO to perform various DB manipulations
   *
   * @return string
   * @access public
   */
  function getBAOName()
  {
    // TODO: Implement getBAOName() method.
  }

  /**
   * an array of action links
   *
   * @return array (reference)
   * @access public
   */
  function &links()
  {
    // TODO: Implement links() method.
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
}
