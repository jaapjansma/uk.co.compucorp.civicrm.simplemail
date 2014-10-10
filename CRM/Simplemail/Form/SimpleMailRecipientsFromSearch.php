<?php

require_once 'CRM/Core/Form.php';

/**
 * Form controller class
 *
 * @see http://wiki.civicrm.org/confluence/display/CRMDOC43/QuickForm+Reference
 */
class CRM_Simplemail_Form_SimpleMailRecipientsFromSearch extends CRM_Core_Form {
  /**
   * Set various values to the session and redirect to the SimpleMail page for creating a new mailing
   */
  public function preProcess() {
    $this->initSession();

    CRM_Utils_System::redirect('/civicrm/simple-mail#/mailings/new');
  }

  /**
   * @return $this
   */
  protected function initSession() {
    CRM_Simplemail_BAO_SimpleMail::addToSessionScope('createdFromSearch', true);

    return $this
      ->addSearchContactIdsToSession()
      ->addSearchParamsToSession()
      ->addFormValuesToSession()
      ->addCustomSearchIdToSession()
      ->addContextToSession();
  }

  /**
   * @return $this
   */
  private function addSearchContactIdsToSession() {
    $qfKey = CRM_Utils_Request::retrieve('qfKey', 'String', $form);
    $cacheKey = "civicrm search {$qfKey}";
    $selectedCids = CRM_Core_BAO_PrevNextCache::getSelection($cacheKey);

    $contactIds = array();

    // Set contact IDs to the IDs of contacts selected (ticked) on the search result
    foreach ($selectedCids[$cacheKey] as $selectedCid => $ignore) {
      $contactIds[$selectedCid] = $selectedCid;
    }

    // If no contacts were selected (ticked), set contact IDs to the IDs of all contacts returned by the search result
    if (!$contactIds) {
      foreach ($this->get('rows') as $contact) {
        $contactIds[$contact['contact_id']] = $contact['contact_id'];
      }
    }

    CRM_Simplemail_BAO_SimpleMail::addToSessionScope('contactIds', $contactIds);

    return $this;
  }

  /**
   * @return $this
   */
  private function addSearchParamsToSession() {
    CRM_Simplemail_BAO_SimpleMail::addToSessionScope('searchParams', $this->controller->exportValues());

    return $this;
  }

  /**
   * @return $this
   */
  private function addFormValuesToSession() {
    CRM_Simplemail_BAO_SimpleMail::addToSessionScope('formValues', $this->get('formValues'));

    return $this;
  }

  /**
   * @return $this
   */
  private function addCustomSearchIdToSession() {
    CRM_Simplemail_BAO_SimpleMail::addToSessionScope('customSearchId', $this->get('customSearchID'));

    return $this;
  }

  /**
   * @return $this
   */
  private function addContextToSession() {
    CRM_Simplemail_BAO_SimpleMail::addToSessionScope('context', $this->get('context'));

    return $this;
  }
}
