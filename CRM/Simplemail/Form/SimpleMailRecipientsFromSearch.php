<?php

require_once 'CRM/Core/Form.php';

/**
 * Form controller class
 *
 * @see http://wiki.civicrm.org/confluence/display/CRMDOC43/QuickForm+Reference
 */
class CRM_Simplemail_Form_SimpleMailRecipientsFromSearch extends CRM_Core_Form {
  const SESSION_SCOPE_PREFIX = 'SimpleMail_';

  /**
   * Whether the mailing being created is based on contact search results - in this case, this has been hard-coded to
   * true as this class has been specifically created for this purpose
   *
   * @var bool
   */
  protected $_searchBasedMailing = TRUE;

  /**
   * Type of search result passed on to the mailing, i.e. whether all the contacts of the search result were pass on to
   * the mailing (i.e. smart group would be created), or only certain contacts were selected in the search result (i.e.
   * hidden group would be created)
   *
   * @var null
   */
  protected $_resultSelectOption = NULL;

  /**
   * Contact IDs for the contacts returned by the search results
   *
   * @var array
   */
  protected $_contactIds = array();

  /**
   * The group ID of the smart or hidden group
   *
   * @var null|int
   */
  protected $_smartGroupId = NULL;

  /**
   * Note: A lot of the logic in this method (for creating hidden and smart groups) is taken from
   * CRM_Mailing_Form_Group::postProcess()
   *
   * @throws Exception
   */
  public function preProcess() {
    $this->initialise();

    $searchParams = $this->controller->exportValues();
    $this->_resultSelectOption = $searchParams['radio_ts'];

    if ($this->_searchBasedMailing && $this->_contactIds) {
      if ($this->_resultSelectOption == 'ts_sel') {
        // create a static grp if only a subset of result set was selected:
        $randID = md5(time());
        $grpTitle = "Hidden Group {$randID}";
        $grpID = CRM_Core_DAO::getFieldValue('CRM_Contact_DAO_Group', $grpTitle, 'id', 'title');

        if (!$grpID) {
          $groupParams = array(
            'title'      => $grpTitle,
            'is_active'  => 1,
            'is_hidden'  => 1,
            'group_type' => array('2' => 1),
          );

          $group = CRM_Contact_BAO_Group::create($groupParams);
          $grpID = $group->id;

          CRM_Contact_BAO_GroupContact::addContactsToGroup($this->_contactIds, $group->id);

          $newGroupTitle = "Hidden Group {$grpID}";
          $groupParams = array(
            'id'         => $grpID,
            'name'       => CRM_Utils_String::titleToVar($newGroupTitle),
            'title'      => $newGroupTitle,
            'group_type' => array('2' => 1),
          );
          $group = CRM_Contact_BAO_Group::create($groupParams);
        }

        // note at this point its a static group
        $this->_smartGroupId = $grpID;
      }
      else {
        // Get the hidden smart group ID
        $ssId = $this->get('ssID');
        $hiddenSmartParams = array(
          'group_type'       => array('2' => 1),
          'form_values'      => $this->get('formValues'),
          'saved_search_id'  => $ssId,
          'search_custom_id' => $this->get('customSearchID'),
          'search_context'   => $this->get('context'),
        );

        list($smartGroupId, $savedSearchId) = CRM_Contact_BAO_Group::createHiddenSmartGroup($hiddenSmartParams);
        $this->_smartGroupId = $smartGroupId;

        // Set the saved search ID
        if (!$ssId) {
          if ($savedSearchId) {
            $this->set('ssID', $savedSearchId);
          }
          else {
            CRM_Core_Error::fatal();
          }
        }
      }
    }

    $session = CRM_Core_Session::singleton();
    $session->set('smartGroupId', $this->_smartGroupId, static::getSessionScope());

    CRM_Utils_System::redirect('/civicrm/simple-mail#/mailings/new');
  }

  /**
   * Initialise various necessary components
   */
  protected function initialise() {
    $this->initContactIds();
  }

  /**
   * Initialise contact IDs depending upon whether some or all contacts from the search results were added for mass
   * mailing
   */
  protected function initContactIds() {
    $qfKey = CRM_Utils_Request::retrieve('qfKey', 'String', $form);
    $cacheKey = "civicrm search {$qfKey}";
    $selectedCids = CRM_Core_BAO_PrevNextCache::getSelection($cacheKey);

    // Set contact IDs to the IDs of contacts selected (ticked) on the search result
    foreach ($selectedCids[$cacheKey] as $selectedCid => $ignore) {
      $this->_contactIds[$selectedCid] = $selectedCid;
    }

    // If no contacts were selected (ticked), set contact IDs to the IDs of all contacts returned by the search result
    if (!$this->_contactIds) {
      foreach ($this->get('rows') as $contact) {
        $this->_contactIds[$contact['contact_id']] = $contact['contact_id'];
      }
    }
  }

  /**
   * @return string
   */
  public static function getSessionScope() {
    return static::SESSION_SCOPE_PREFIX . CRM_Core_Session::singleton()->get('userID');
  }
}
