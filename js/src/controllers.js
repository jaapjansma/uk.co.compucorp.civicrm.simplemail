(function () {
  "use strict";

  /**
   * @type {ng.IModule}
   *
   * @description Controllers for the mailing wizard section of the app
   */
  var controllers = angular.module('simpleMail.app.controllers', []);

  controllers.config([
    '$httpProvider', function ($httpProvider) {
      // This is needed (Utils/Rest.php::ajax()) for CiviCRM to treat the request as genuine
      $httpProvider.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
    }
  ]);

  /**
   * @ngdoc controller
   * @name MailingsController
   * @requires MailingsListingFactory
   * @type {*[]}
   */
  var MailingsController = [
    '$scope',
    '$http',
    '$q',
    'CiviApiFactory',
    'loggingServices',
    'NotificationFactory',
    '$filter',
    'MailingsListingFactory',
    '$log',

    /**
     *
     * @param $scope
     * @param $http
     * @param $q
     * @param civiApi
     * @param log
     * @param notification
     * @param $filter
     * @param {MailingsListingFactory} MailingsListing
     */
      function ($scope, $http, $q, civiApi, log, notification, $filter, MailingsListing, $log) {
      $scope.constants = {
        ENTITY_NAME: 'SimpleMail',
        DRAFT: 'Not Scheduled',
        SCHEDULED: 'Scheduled',
        RUNNING: 'Running',
        PAUSED: 'Paused',
        SENT: 'Complete',
        CANCELLED: 'Canceled'
      };

      $scope.showFilters = true;

      $scope.models = {};
      $scope.models.mailingsLoaded = false;

      $scope.mailingFilters = {
        status: {},
        creator: 'all'
      };

      $scope.filteredMailings = [];

      $scope.mailingFilters.status[$scope.constants.DRAFT] = true;
      $scope.mailingFilters.status[$scope.constants.SCHEDULED] = true;
      $scope.mailingFilters.status[$scope.constants.SENT] = true;
      $scope.mailingFilters.status[$scope.constants.RUNNING] = true;
      $scope.mailingFilters.status[$scope.constants.PAUSED] = true;
      $scope.mailingFilters.status[$scope.constants.CANCELLED] = true;

      MailingsListing.init()
        .then(function () {
          $scope.mailings = MailingsListing.getMailings();
          $scope.userId = MailingsListing.getUserId();

          $scope.models.creators = MailingsListing.getCreators();
          $scope.models.creators.unshift({id: 'all', 'name': 'All'});

          // The below will cause to show mailings for all users if the current user never created any mailing;
          // otherwise nothing would be shown, potentially confusing the user that mailings are missing/lost
          var currentUserInCreators = $filter('filter')($scope.models.creators, {id: $scope.userId});
          $scope.mailingFilters.creator = currentUserInCreators.length ? $scope.userId : 'all';
        })
        .finally(function () {
          $scope.models.mailingsLoaded = true;
        });

      /**
       * @name confirmDeleteMailing
       * @description    Confirms that the user wishes to delete an email, and if they agree it proceeds to
       *                            perform said deletion
       */
      $scope.confirmDeleteMailing = function (mailing) {
        if (confirm("Are you sure you wish to delete the mailing:\n" + mailing.name)) {
          $scope.deleteMailing(mailing);
        }
      };

      /**
       * @name deleteMailing
       * @description Delete a mailing given by its index in the mailings array
       *
       * @param mailing
       */
      $scope.deleteMailing = function (mailing) {
        return MailingsListing.deleteMailing(mailing);
      };

      /**
       * Cancel scheduled mass mailing
       *
       * @param mailing
       */
      $scope.cancelMailing = function (mailing) {
        return MailingsListing.cancelMailing(mailing);
      };

      /**
       * Create a duplicate of a mailing
       *
       * @param mailing
       */
      $scope.duplicateMailing = function (mailing) {
        return MailingsListing.duplicateMailing(mailing);
      };
    }
  ];


  /**
   * Step 1 of the wizard
   *
   * @ngdoc controller
   * @name CreateMailingCtrl
   * @type {*[]}
   */
  var CreateMailingCtrl = [
    '$scope',
    '$q',
    'MailingDetailFactory',
    'NotificationFactory',
    'MailingHelperFactory',
    'WizardStepFactory',
    'FormValidationFactory',
    /**
     *
     * @param $q
     * @param {MailingDetailFactory} Mailing
     * @param {NotificationFactory} Notification
     * @param {MailingHelperFactory} Helper
     * @param {WizardStepFactory} Wizard
     */
      function ($scope, $q, Mailing, Notification, Helper, Wizard, FormValidation) {

      var self = this;

      this.mailing = Mailing.getCurrentMailing();
      this.groups = Helper.getMailingGroups();
      this.categories = Helper.getMailingCategories();
      this.canaddgroups = Mailing.getCanAddGroups();

      var promises = [];

      Wizard.deinit();

      var mailingPromise = Mailing.init()
        .then(function () {
          self.mailing = Mailing.getCurrentMailing();
          self.fromSearch = Mailing.isCreatedFromSearch();
          self.contactsCount = Mailing.getContactsCount();
          self.canaddgroups = Mailing.getCanAddGroups();

          if (angular.isUndefined(self.mailing.dedupe_email)) {
            self.mailing.dedupe_email = '1';
          }
        });

      var mailingGroupsPromise = Helper.initMailingGroups()
        .then(function () {
          self.groups = Helper.getMailingGroups();
          self.categories = Helper.getMailingCategories();
        });

      promises.push(mailingPromise, mailingGroupsPromise);

      $q.all(promises)
        .catch(function (response) {
          Notification.genericError(response);
        })
        .finally(function () {
          self.initialised = true;

          // assign the form to the scope so we can watch it
          $scope.step1form = self.step1form;
          FormValidation.setForm(self.step1form);

          Wizard.init();
        });

      this.isMailingNotScheduled = function () {
        return Mailing.isCurrentMailingNotScheduled();
      };

      $scope.$watch('step1form.$valid', function (isValid) {
        FormValidation.setState(isValid);
      });

    }
  ];


  /**
   * Step 2 of the wizard
   *
   * @ngdoc controller
   * @name ComposeMailingCtrl
   * @type {*[]}
   */
  var ComposeMailingCtrl = [
    '$filter', '$q', '$scope', '$timeout', 'CampaignMessageFactory',
    'HeaderFactory', 'MailingHelperFactory', 'MailingDetailFactory',
    'NotificationFactory', 'WizardStepFactory', 'FormValidationFactory',
    'FileUploader', 'InlineAttachmentFactory',
    /**
     * @param $filter
     * @param $q
     * @param $scope
     * @param {CampaignMessageFactory} CampaignMessage
     * @param {HeaderFactory} Header
     * @param {MailingHelperFactory} Helper
     * @param {MailingDetailFactory} Mailing
     * @param {NotificationFactory} Notification
     * @param {WizardStepFactory} Wizard
     */
      function (
      $filter,
      $q,
      $scope,
      $timeout,
      CampaignMessage,
      Header,
      Helper,
      Mailing,
      Notification,
      Wizard,
      FormValidation,
      FileUploader,
      InlineAttachments
    ) {
      var self = this;

      this.headersLoaded = false;
      this.editFromName = false;
      this.selectedMessage = '';
      this.selectedFilterId = null;
      this.selectedSocialLink = null;

      this.mailing = Mailing.getCurrentMailing();
      this.filters = Helper.getHeaderFilters();
      this.headers = Header.getHeaders();
      this.fromEmails = Helper.getFromEmails();
      this.messages = CampaignMessage.getMessages();
      this.socialLinkLocations = [];
      this.inlineAttachments = {};

      this.regionsTemplatePath = Wizard.getRegionsTemplatePath();

      this.editorInstance = {};

      var promises = [];
      var inlineAttachmentsPromise;

      var mailingPromise = Mailing.init()
        .then(function () {
          self.mailing = Mailing.getCurrentMailing();

          /* Another way of setting the default value in the CKEditor / email body
           if (self.mailing.body.length <= 0){
           self.mailing.body = 'Dear {contact.display_name},<br/><br/><br/><br/><br/><br/>{signature}';
           }
           */

          inlineAttachmentsPromise = InlineAttachments.get(Mailing.getCurrentMailing().id)
            .then(function (result) {
              if (!result) {
                Notification.alert("There was a problem retrieving your inline attachments");
                return;
              }
              self.inlineAttachments = {};

              for (var index in result) {
                var row = result[index];
                row.uploaded = true;      // tells the front end that this is a valid upload

                self.inlineAttachments[row.id] = row;
              }

            })
            .catch(function (error) {
              console.log('Inline Attachments error: ', error);
            });


        });

      var headerFiltersPromise = Helper.initHeaderFilters()
        .then(function () {
          self.filters = Helper.getHeaderFilters();
        })
        .catch(function () {
          return true; // because we don't want to show error notification for this, so as to not scare the end-user
        });

      var headersPromise = Header.init()
        .then(function () {
          self.headers = Header.getHeaders();
          self.headersLoaded = true;

          setDefaultHeader();

        });

      var fromEmailsPromise = Helper.initFromEmails()
        .then(function () {
          self.fromEmails = Helper.getFromEmails();

          if (self.fromEmails.length) {

            // cycle through the email addresses
            for (var fromEmailIndex in self.fromEmails) {
              var item = self.fromEmails[fromEmailIndex];

              // if this email address item has an id, which indicates a valid record from the DB, then set this
              // as the default selected option
              if (item.id) {
                self.mailing.from_address = item.label;
                break;
              }
            }
          }

        });

      var campaignMessagesPromise = CampaignMessage.init()
        .then(function () {
          self.messages = CampaignMessage.getMessages();
        });


      var socialLinksPromise = Helper.initSocialLinks()
        .then(function () {

          var locations = Helper.getSocialLinkLocations();
          for (var index in locations) {
            self.socialLinkLocations.push({
              label: locations[index],
              value: locations[index]
            });
          }

        });

      promises.push(mailingPromise, headerFiltersPromise, headersPromise, fromEmailsPromise, campaignMessagesPromise,
        inlineAttachmentsPromise, socialLinksPromise);

      $q.all(promises)
        .then(function () {
          self.initHeaderFilter();
          self.initFromName();
          self.updateSelectedMessage();
          self.updateSelectedSocialLink();
        })
        .catch(function (response) {
          Notification.genericError(response);
        })
        .finally(function () {

          // assign the form to the scope so we can watch it
          $scope.step2form = self.step2form;
          FormValidation.setForm(self.step2form);

          Wizard.init();
        });

      // TODO (robin): Could this be refactored so that the view interpolates the result of this method? This might mean invoking it is no longer needed in the above then() method
      this.updateSelectedMessage = function () {

        // Not an ideal thing to do, but we set the default value of the "campaign message" drop down to ID 5
        if (!this.mailing.message_id) {
          this.mailing.message_id = 5;
        }

        this.selectedMessage = $filter('filter')(this.messages, {id: this.mailing.message_id})[0];
      };

      /**
       * Initialise the header filter
       */
      this.initHeaderFilter = function () {
        if (!$filter('filter')(this.filters, {id: 'all'})[0]) {
          this.filters.unshift({id: 'all', label: 'All'});
        }

        if (!this.mailing.header_id) {
          // Pre-select the filter named 'ATL' (if exists)
          var selectedFilter = $filter('filter')(this.filters, {label: 'ATL'})[0];

          if (angular.isObject(selectedFilter) && selectedFilter.hasOwnProperty('id')) {
            this.selectedFilterId = selectedFilter.id;
          }
        }
      };

      this.initFromName = function () {
        if (this.mailing.from_name && this.fromEmails.indexOf(this.mailing.from_address) === -1) {
          var selectedEmail = $filter('filter')(this.fromEmails, {label: this.mailing.from_address});

          if (selectedEmail.length === 0) {
            this.fromEmails.unshift({label: this.mailing.from_address});
          }
        }
      };

      this.cancelFromNameCustomisation = function () {
        this.mailing.from_name = Mailing.getCurrentMailing(true).from_name;
        this.editFromName = false;
      };

      this.updateSelectedSocialLink = function () {
        if (!self.mailing.social_link) {
          self.mailing.social_link = self.socialLinkLocations[0].value;
        }
      };

      /**
       * This method is called when the inlineAttachment directive is about to upload something
       * but hasn't started yet
       */
      $scope.inlineAttachmentBeforeUpload = function (uploadItem) {
        Notification.clearAll();

        var id = getUniqueId(uploadItem.file.name);

        self.inlineAttachments[id] = {
          id: id,
          uploaded: false,
          filename: uploadItem.file.name
        };

        uploadItem.id = id;

        uploadItem.formData.push({
          simplemail_id: self.mailing.id,
        });

      };


      /**
       * This is called when the inlineAttachment directive has an error during uplaod
       */
      $scope.inlineAttachmentError = function (uploadItem, response, status, headers) {
        delete( self.inlineAttachments[uploadItem.id] );
      };


      /**
       * This method is called when the inlineAttachment has completed an upload
       */
      $scope.inlineAttachmentComplete = function (uploadItem, response, status, headers) {

        // check the upload actually was a success by checking the backend's response
        if (!response) {
          Notification.genericError("There was no response from the server. Please try again");
          $scope.inlineAttachmentError(uploadItem);
          return false;
        }

        if (response.is_error) {
          Notification.genericError("There was a problem uploading your attachment.<br/>" + response.error_message);
          $scope.inlineAttachmentError(uploadItem);
          return false;
        }

        var id = uploadItem.id;
        var responseData = response.values[0];

        self.inlineAttachments[responseData.databaseId] = self.inlineAttachments[id];
        self.inlineAttachments[responseData.databaseId].id = responseData.databaseId;
        self.inlineAttachments[responseData.databaseId].uploaded = true;
        self.inlineAttachments[responseData.databaseId].url = responseData.url;
        ;

        delete(self.inlineAttachments[id]);

        Notification.success("Inline attachment uploaded");

        return true;
      };


      /**
       * A method for the inlineAttachment directive to call when it wants to make a notification
       */
      $scope.inlineAttachmentNotification = function (message) {
        if (message.type == 'success') {
          Notification.success(message.text);
        }
        else {
          if (message.type == 'alert') {
            Notification.alert(message.text);
          }
          else {
            Notification.error(message.text);
          }
        }
      };


      /**
       * This fires when a user presses the "insert" button in the inlineAttachment directive
       * It should insert a link to the attachment into CK Editor
       */
      $scope.inlineAttachmentInsert = function (attachment) {
        var result;

        if (!self.editorInstance) {
          Notification.alert("There does not appear to be an instance of CKEditor available");
          return;
        }

        var selection = self.editorInstance.getSelection();
        var selectedText = selection.getSelectedText();

        if (!selectedText || selectedText.length <= 0) {

          if (result =
              prompt("Inserting inline attachment\n\nPlease enter the text you want as a link:", attachment.filename)) {

            // we use a timeout to break out of the digest/apply cycle
            // if you try to make the editorInstance call outside the timeout, you'll experience
            // an Angular error. Go on. Try it.
            $timeout(function () {
              self.editorInstance.insertHtml('<a href="' + attachment.url + '">' + result + '</a>');
            }, 0);

            moveEditorCursor(1);

          }

        }
        else {
          // someone HAS selected text
          $timeout(function () {
            self.editorInstance.insertHtml('<a href="' + attachment.url + '">' + selectedText + '</a>');
          }, 0);

          moveEditorCursor(1);
        }
      };


      $scope.inlineAttachmentRemove = function (attachment, response) {
        if (response.is_error) {
          Notification.alert("Failed to remove attachment. " + response.error_message);
        }
        else {
          Notification.success("Attachment removed");
          delete( self.inlineAttachments[attachment.id] );
        }
      };


      /**
       * Moves the cursor x amount characters to the right in CKEditor
       */
      function moveEditorCursor(amountRight) {
        var selection = self.editorInstance.getSelection();
        var ranges = selection.getRanges();
        var range = ranges[0];

        range.setEnd(range.endContainer, range.endOffset + amountRight);
      }


      /**
       * Checks if the user has selected a header already
       * If not, pick the first one
       */
      function setDefaultHeader() {
        if (!self.mailing.header_id) {
          if (self.headers && (self.headers.length > 0)) {
            self.mailing.header_id = self.headers[0].id;
          }
        }
      }


      /**
       * A very unsophisticated way of generating a unique id
       * By using the timestamp first and then appending the filename, we can maintain
       * the order of elements if they are sorted by time added/uploaded
       */
      function getUniqueId(suffix) {
        var ms = new Date().getTime();
        return ms + '_' + suffix;
      }

      $scope.$watch('step2form.$valid', function (isValid) {
        FormValidation.setState(isValid);
      });


    }
  ];


  /**
   * Step 3 of the wizard
   *
   * @ngdoc controller
   * @name TestMailingCtrl
   */
  var TestMailingCtrl = [
    '$scope', '$q', 'MailingHelperFactory', 'MailingDetailFactory', 'NotificationFactory', 'WizardStepFactory',
    function ($scope, $q, Helper, Mailing, Notification, Wizard) {
      var self = this;

      this.mailing = Mailing.getCurrentMailing();
      this.groups = Helper.getMailingGroups();

      var promises = [];

      var mailingPromise = Mailing.init()
        .then(function () {
          self.mailing = Mailing.getCurrentMailing();
        });

      var mailingGroupsPromise = Helper.initMailingGroups()
        .then(function () {
          self.groups = Helper.getMailingGroups();
        });

      promises.push(mailingPromise, mailingGroupsPromise);

      $q.all(promises)
        .catch(function (response) {
          Notification.genericError(response);
        })
        .finally(function () {
          Wizard.init();
        });
    }
  ];


  /**
   * Step 4 of the wizard
   *
   * @ngdoc controller
   * @name ScheduleAndSendCtrl
   */
  var ScheduleAndSendCtrl = [
    '$q', 'MailingDetailFactory', 'NotificationFactory', 'WizardStepFactory',
    function ($q, Mailing, Notification, Wizard) {
      var self = this;

      this.mailing = Mailing.getCurrentMailing();

      var promises = [];

      var mailingPromise = Mailing.init()
        .then(function () {
          self.mailing = Mailing.getCurrentMailing();
        });

      promises.push(mailingPromise);

      $q.all(promises)
        .catch(function (response) {
          Notification.genericError(response);
        })
        .finally(function () {
          Wizard.init();
        });
    }
  ];

  /**
   * @ngdoc controller
   * @name WizardStepsCtrl
   */
  var WizardStepsCtrl = [
    '$routeParams', 'WizardStepFactory',
    /**
     *
     * @param $routeParams
     * @param {WizardStepFactory} Wizard
     */
      function ($routeParams, Wizard) {
      this.currentStep = +$routeParams.step;

      Wizard.setCurrentStep(this.currentStep);

      this.partial = Wizard.getPartialPath();
      this.title = Wizard.getStepTitle();

      this.isInitialised = function () {
        return Wizard.isInitialised();
      };

      this.getMailingStatus = function () {
        return Wizard.getMailingStatus();
      };
    }
  ];

  /**
   * Mailing buttons
   */
  var MailingButtonsCtrl = [
    'MailingDetailFactory', 'WizardStepFactory', 'NotificationFactory',
    /**
     *
     * @param {MailingDetailFactory} Mailing
     * @param {WizardStepFactory} Wizard
     */
      function (Mailing, Wizard) {
      this.showPrevStepLink = Wizard.prevStepAllowed();
      this.showNextStepLink = Wizard.nextStepAllowed();
      this.showSubmitMassEmailLink = !this.showNextStepLink;
      this.canUpdate = Mailing.canUpdate();

      this.isInitialised = function () {
        return Wizard.isInitialised();
      };

      this.prevStep = function () {
        if (Wizard.isInitialised()) {
          return Wizard.prevStep();
        }
      };

      this.nextStep = function () {
        if (Wizard.isInitialised()) {
          return Wizard.nextStep();
        }
      };

      this.saveAndContinueLater = function () {
        if (Wizard.isInitialised()) {
          return Wizard.saveAndContinueLater();
        }
      };

      this.submitMassEmail = function () {
        if (Wizard.isInitialised()) {
          Wizard.deinit();
          return Wizard.submitMassEmail()
            .finally(function () {
              Wizard.init();
            });
        }
      };

      this.cancel = function () {
        Wizard.cancel();
      };

      this.sendTestEmail = function () {
        return Wizard.sendTestEmail();
      };

    }
  ];


  angular.module('simpleMail.app.controllers')
    .controller('MailingsController', MailingsController)
    .controller('WizardStepsCtrl', WizardStepsCtrl)
    .controller('CreateMailingCtrl', CreateMailingCtrl)
    .controller('ComposeMailingCtrl', ComposeMailingCtrl)
    .controller('TestMailingCtrl', TestMailingCtrl)
    .controller('ScheduleAndSendCtrl', ScheduleAndSendCtrl)
    .controller('MailingButtonsCtrl', MailingButtonsCtrl)
  ;

})();
