(function () {
  "use strict";

  /**
   * @type {ng.IModule}
   *
   * @description Controllers for the mailing wizard section of the app
   */
  var controllers = angular.module('simpleMail.app.controllers', []);

  controllers.config(['$httpProvider', function ($httpProvider) {
    // This is needed (Utils/Rest.php::ajax()) for CiviCRM to treat the request as genuine
    $httpProvider.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
  }]);

  /**
   * @ngdoc controller
   * @name MailingsController
   * @requires MailingsListingFactory
   * @type {*[]}
   */
  var MailingsController = ['$scope', '$http', '$q', 'CiviApiFactory', 'loggingServices', 'NotificationFactory', '$filter', 'MailingsListingFactory', '$log',

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
      }
    }
  ];

  /**
   * Step 1 of the wizard
   *
   * @ngdoc controller
   * @name CreateMailingCtrl
   * @type {*[]}
   */
  var CreateMailingCtrl = ['$q', 'MailingDetailFactory', 'NotificationFactory', 'MailingHelperFactory', 'WizardStepFactory',
    /**
     *
     * @param $q
     * @param {MailingDetailFactory} Mailing
     * @param {NotificationFactory} Notification
     * @param {MailingHelperFactory} Helper
     * @param {WizardStepFactory} Wizard
     */
      function ($q, Mailing, Notification, Helper, Wizard) {
      var self = this;

      this.mailing = Mailing.getCurrentMailing();
      this.groups = Helper.getMailingGroups();

      var promises = [];

      var mailingPromise = Mailing.init()
        .then(function () {
          self.mailing = Mailing.getCurrentMailing();
          self.fromSearch = Mailing.isCreatedFromSearch();
          if (angular.isUndefined(self.mailing.dedupe_email)) self.mailing.dedupe_email = '1';
        });

      var mailingGroupsPromise = Helper.initMailingGroups()
        .then(function () {
          self.groups = Helper.getMailingGroups();
        });

      promises.push(mailingPromise, mailingGroupsPromise);

      $q.all(promises)
        .catch(function () {
          Notification.genericError();
        })
        .finally(function () {
          self.initialised = true;
          Wizard.init();
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
  var ComposeMailingCtrl = ['$filter', '$q', '$scope', 'CampaignMessageFactory', 'HeaderFactory', 'MailingHelperFactory', 'MailingDetailFactory', 'NotificationFactory', 'WizardStepFactory',
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
      function ($filter, $q, $scope, CampaignMessage, Header, Helper, Mailing, Notification, Wizard) {
      var self = this;

      this.headersLoaded = false;
      this.editFromName = false;
      this.selectedMessage = '';
      this.selectedFilterId = null;

      this.mailing = Mailing.getCurrentMailing();
      this.filters = Helper.getHeaderFilters();
      this.headers = Header.getHeaders();
      this.fromEmails = Helper.getFromEmails();
      this.messages = CampaignMessage.getMessages();

      this.regionsTemplatePath = Wizard.getRegionsTemplatePath();

      var promises = [];

      var mailingPromise = Mailing.init()
        .then(function () {
          self.mailing = Mailing.getCurrentMailing();
        });

      var headerFiltersPromise = Helper.initHeaderFilters()
        .then(function () {
          self.filters = Helper.getHeaderFilters();
        });

      var headersPromise = Header.init()
        .then(function () {
          self.headers = Header.getHeaders();
          self.headersLoaded = true;
        });

      var fromEmailsPromise = Helper.initFromEmails()
        .then(function () {
          self.fromEmails = Helper.getFromEmails();
        });

      var campaignMessagesPromise = CampaignMessage.init()
        .then(function () {
          self.messages = CampaignMessage.getMessages();
        });

      promises.push(mailingPromise, headerFiltersPromise, headersPromise, fromEmailsPromise, campaignMessagesPromise);

      $q.all(promises)
        .then(function () {
          self.initHeaderFilter();
          self.initFromName();
          self.updateSelectedMessage();
        })
        .catch(function () {
          Notification.genericError();
        })
        .finally(function () {
          Wizard.init();
        });

      // TODO (robin): Could this be refactored so that the view interpolates the result of this method? This might mean invoking it is no longer needed in the above then() method
      this.updateSelectedMessage = function () {
        if (this.mailing.message_id) {
          this.selectedMessage = $filter('filter')(this.messages, {id: this.mailing.message_id})[0];
        }
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

      this.initFromName = function() {
        if (this.mailing.from_name) {
          this.fromEmails.unshift({label: this.mailing.from_address})
        }
      };

      this.cancelFromNameCustomisation = function () {
        this.mailing.from_name = Mailing.getCurrentMailing(true).from_name;
        this.editFromName = false;
      };
    }
  ];

  /**
   * Step 3 of the wizard
   *
   * @ngdoc controller
   * @name TestMailingCtrl
   */
  var TestMailingCtrl = ['$q', 'MailingHelperFactory', 'MailingDetailFactory', 'NotificationFactory', 'WizardStepFactory',
    function ($q, Helper, Mailing, Notification, Wizard) {
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
        .catch(function () {
          Notification.genericError();
        })
        .finally(function () {
          Wizard.init();
        });
    }
  ];

  var ScheduleAndSendCtrl = ['$q', 'MailingDetailFactory', 'NotificationFactory', 'WizardStepFactory',
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
        .catch(function () {
          Notification.genericError();
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
  var WizardStepsCtrl = ['$routeParams', 'WizardStepFactory',
    /**
     *
     * @param $routeParams
     * @param {WizardStepFactory} Wizard
     */
      function ($routeParams, Wizard) {
      var currentStep = +$routeParams.step;

      Wizard.setCurrentStep(currentStep);

      this.partial = Wizard.getPartialPath();

      this.isInitialised = function () {
        return Wizard.isInitialised();
      };
    }
  ];

  /**
   * Mailing buttons
   */
  var MailingButtonsCtrl = ['MailingDetailFactory', 'WizardStepFactory',
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
        if (Wizard.isInitialised()) Wizard.prevStep();
      };

      this.nextStep = function () {
        if (Wizard.isInitialised()) Wizard.nextStep();
      };

      this.saveAndContinueLater = function () {
        if (Wizard.isInitialised()) Wizard.saveAndContinueLater();
      };

      this.submitMassEmail = function () {
        if (Wizard.isInitialised()) Wizard.submitMassEmail();
      };

      this.cancel = function () {
        Wizard.cancel();
      };

      this.sendTestEmail = function() {
        Wizard.sendTestEmail();
      }
    }];


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
