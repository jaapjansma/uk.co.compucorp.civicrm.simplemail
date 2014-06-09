<?php

require_once 'CRM/Core/Page.php';

class CRM_Simplemail_Page_Messages extends CRM_Core_Page_Basic {
  function run() {
    // Example: Set the page-title dynamically; alternatively, declare a static title in xml/Menu/*.xml
    CRM_Utils_System::setTitle(ts('Campaign messages'));

    // Example: Assign a variable for use in a template
    $this->assign('currentTime', date('Y-m-d H:i:s'));

    parent::run();
  }

  /**
   * Get BAO Name
   *
   * @return string Class name of BAO.
   */
  function getBAOName() {
    return 'CRM_Simplemail_BAO_Message';
  }

  /**
   * {@inheritdoc}
   */
  function editForm() {
    return 'CRM_Simplemail_Form_MessagesNew';
  }

  /**
   * {@inheritdoc}
   */
  function editName() {
    return 'Message';
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

  function browse()
  {
 $types =  CRM_Booking_BAO_Resource::buildOptions('type_id', 'create');
    $locations =  CRM_Booking_BAO_Resource::buildOptions('location_id', 'create');

    // get all custom groups sorted by weight
    $resources = array();
    $dao = new CRM_Booking_DAO_Resource();
    $dao->orderBy('weight');
    $dao->is_deleted = FALSE;
    $dao->find();

    while ($dao->fetch()) {

      $resources[$dao->id] = array();
      CRM_Core_DAO::storeValues($dao, $resources[$dao->id]);
      $resources[$dao->id]['type'] =  CRM_Utils_Array::value(CRM_Utils_Array::value('type_id', $resources[$dao->id]), $types);
      $resources[$dao->id]['location'] =  CRM_Utils_Array::value(CRM_Utils_Array::value('location_id', $resources[$dao->id]), $locations);


      // form all action links
      $action = array_sum(array_keys($this->links()));

      // update enable/disable links.
      if ($dao->is_active) {
        $action -= CRM_Core_Action::ENABLE;
      }
      else {
        $action -= CRM_Core_Action::DISABLE;
      }

      $resources[$dao->id]['action'] = CRM_Core_Action::formLink(self::links(), $action,
        array('id' => $dao->id)
      );

    }
    $this->assign('rows', $resources);
  }
}
