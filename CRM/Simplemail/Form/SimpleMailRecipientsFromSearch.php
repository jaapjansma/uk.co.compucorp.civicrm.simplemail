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
    simplemail_civicrm_addToSessionScope('createdFromSearch', true);

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


    // So a bit of magic happens here
    // When you instantiate a CRM_Contract_Controller_Search object, it checks to see if a qfKey is passed in the $_REQUEST
    // in our case you should see it in the GET
    // If this is passed in, the controller tries to create itself using data from the SESSION
    // that means your controller is automatically populated with search data from a previous page
    
    $searchController = new CRM_Contact_Controller_Search();

    $totalContacts = count($contactIds);
    if ($totalContacts <= 0){
      $totalContacts = $searchController->get('rowCount');
    } 


    // CS: This needs to be commented out because the contact IDs are irrelevant at this point.
    // If the user hasn't ticked any users then this code would just give you back the first 50 contacts
    // Better to leave the contactIds empty which tells us that nothing is actually selected 
    if (!$contactIds) {
      foreach ($this->get('rows') as $contact) {
        $contactIds[$contact['contact_id']] = $contact['contact_id'];
      }
    }
    
    simplemail_civicrm_addToSessionScope('contactCountFromSearch', $totalContacts);
    
    simplemail_civicrm_addToSessionScope('contactIds', $contactIds);

    return $this;
  }

  /**
   * @return $this
   */
  private function addSearchParamsToSession() {
    simplemail_civicrm_addToSessionScope('searchParams', $this->controller->exportValues());

    return $this;
  }

  /**
   * @return $this
   */
  private function addFormValuesToSession() {
    simplemail_civicrm_addToSessionScope('formValues', $this->get('formValues'));

    return $this;
  }

  /**
   * @return $this
   */
  private function addCustomSearchIdToSession() {
    simplemail_civicrm_addToSessionScope('customSearchId', $this->get('customSearchID'));

    return $this;
  }

  /**
   * @return $this
   */
  private function addContextToSession() {
    simplemail_civicrm_addToSessionScope('context', $this->get('context'));

    return $this;
  }
}
