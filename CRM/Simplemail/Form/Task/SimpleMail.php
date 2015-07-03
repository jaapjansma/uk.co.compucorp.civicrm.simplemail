<?php

class CRM_Simplemail_Form_Task_SimpleMail extends CRM_Contact_Form_Task {
  public function preProcess() {
    parent::preProcess();

    // TODO: These would probably not be needed if the logic in \CRM_Simplemail_BAO_SimpleMail::createSmartContactGroupForSearchContacts() is moved into this class' postProcess() method
    simplemail_civicrm_addToSessionScope('createdFromSearch', TRUE);
    simplemail_civicrm_addToSessionScope('contactCountFromSearch', count($this->_contactIds));
    simplemail_civicrm_addToSessionScope('contactIds', $this->_contactIds);
    simplemail_civicrm_addToSessionScope('searchParams', $this->controller->exportValues());
    simplemail_civicrm_addToSessionScope('formValues', $this->get('formValues'));
    simplemail_civicrm_addToSessionScope('customSearchId', $this->get('customSearchID'));
    simplemail_civicrm_addToSessionScope('context', $this->get('context'));

    CRM_Utils_System::redirect('/civicrm/simple-mail#/mailings/new');
  }

  public function postProcess() {
    // todo
  }
}