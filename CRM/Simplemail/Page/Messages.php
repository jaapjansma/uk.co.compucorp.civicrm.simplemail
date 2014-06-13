<?php

require_once 'CRM/Core/Page.php';

class CRM_Simplemail_Page_Messages extends CRM_Core_Page_Basic
{

  /**
   * The action links that we need to display for the browse screen
   *
   * @var array
   * @static
   */
  protected static $_links = null;

  public function run()
  {
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
  public function getBAOName()
  {
    return 'CRM_Simplemail_BAO_Message';
  }

  /**
   * {@inheritdoc}
   */
  public function editForm()
  {
    return 'CRM_Simplemail_Form_MessagesNew';
  }

  /**
   * {@inheritdoc}
   */
  public function editName()
  {
    return 'Message';
  }

  /**
   * An array of action links
   *
   * @return array (reference)
   * @access public
   */
  public function &links()
  {
    if (!static::$_links) {
      static::$_links = array(
        CRM_Core_Action::UPDATE => array(
          'name' => ts('Edit'),
          'url' => 'civicrm/admin/simple-mail/messages/%%id%%/edit',
          'qs' => 'reset=1',
          'title' => ts('Edit Resource'),
        ),
       CRM_Core_Action::DELETE => array(
          'name' => ts('Delete'),
          'url' => 'civicrm/admin/simple-mail/messages/%%id%%/delete',
          'qs' => 'reset=1',
          'title' => ts('Delete Resource'),
        )
      );
    }
    return self::$_links;
  }

  /**
   * userContext to pop back to
   *
   * @param int $mode mode that we are in
   *
   * @return string
   * @access public
   */
  public function userContext($mode = NULL)
  {
    // TODO: Implement userContext() method.
  }

  public function browse()
  {
    $bao = new CRM_Simplemail_BAO_Message();
    $bao->find();

    $messages = array();
    $action = array_sum(array_keys($this->links()));

    while ($bao->fetch()) {
      $messages[$bao->id] = $bao->toArray();
      $messages[$bao->id]['action'] = CRM_Core_Action::formLink(static::links(), $action,
        array('id' => $bao->id)
      );
    }


    $this->assign('messages', $messages);
  }
}
