// TODO (robin): Check code documentation towards the end to fix any inconsistencies due to code updates
// TODO (robin): Update select2 to 3.5.0 in order to fix: Cannot read property 'hasClass' of null

(function () {
  "use strict";

  /**
   * Generic services
   *
   * @type {ng.IModule}
   */
  var services = angular.module('simpleMail.services', []);

  /**
   * @ngdoc service
   * @name MailingsListingFactory
   * @return {object}
   */
  var MailingsListingProvider = ['$q', '$filter', 'CiviApiFactory', 'NotificationFactory',

    /**
     *
     * @param {$q} $q
     * @param $filter
     * @param {CiviApiFactory} CiviApi
     * @param {NotificationFactory} Notification
     * @returns {object}
     */
      function ($q, $filter, CiviApi, Notification) {
      var constants = {
        entities: {
          MAILING: 'SimpleMail'
        }
      };

      /**
       * An array containing mailings
       *
       * @ngdoc property
       * @name MailingsListingFactory#mailings
       * @type {Array}
       */
      var mailings = [];

      /**
       * The user ID of the current user
       *
       * @ngdoc property
       * @name MailingsListingFactory#userId
       * @type {null}
       */
      var userId = null;

      /**
       * @ngdoc property
       * @name MailingsListingFactory#creators
       * @type {Array}
       */
      var creators = [];

      ////////////////////
      // Public Methods //
      ////////////////////

      /**
       * Initialise the factory
       *
       * @ngdoc method
       * @name MailingsListingFactory#init
       */
      var init = function () {
        var deferred = $q.defer();

        initMailings()
          .then(initCreators)
          .then(function () {
            deferred.resolve();
          })
          .catch(function (response) {
            deferred.reject();
            $log.error('Failed to initialise mailings', response);
          });

        return deferred.promise;
      };

      /**
       * @ngdoc method
       * @name MailingsListingFactory#deleteMailing
       * @param mailing
       */
      var deleteMailing = function (mailing) {
        var deferred = $q.defer();

        var index = mailings.indexOf(mailing);

        var notificationInstance = Notification.loading('Deleting mailing...');

        if (index !== -1) {
          CiviApi.remove(constants.entities.MAILING, mailing)
            .then(function () {
              mailings.splice(index, 1);
              deferred.resolve();
            })
            .catch(function (response) {
              deferred.reject(response);
            });
        } else {
          deferred.reject('Mailing to be deleted was not found in the list of all mailings');
        }

        return deferred.promise
          .then(function () {
            Notification.success('Mailing deleted');
          })
          .catch(function (response) {
            Notification.error('Failed to delete the mailing');
            $log.error('Failed to delete the mailing:', response);

            return $q.reject();
          })
          .finally(function() {
            Notification.clear(notificationInstance);
          });
      };

      /**
       * @ngdoc method
       * @name MailingsListingFactory#cancelMailing
       * @param mailing
       */
      var cancelMailing = function (mailing) {
        var deferred = $q.defer();

        var index = mailings.indexOf(mailing);

        var notificationInstance = Notification.loading('Cancelling mailing...');

        if (index !== -1) {
          CiviApi.post(constants.entities.MAILING, mailing, 'cancelmassemail')
            .then(function () {
              mailing.status = 'Canceled';
              deferred.resolve();
            })
            .catch(function (response) {
              deferred.reject(response);
            });
        } else {
          deferred.reject('Mailing to be cancelled was not found in the list of all mailings');
        }

        return deferred.promise
          .then(function () {
            Notification.success('Mailing cancelled');
          })
          .catch(function (response) {
            Notification.error('Failed to cancel the mailing');
            $log.error('Failed to cancel the mailing:', response);

            return $q.reject();
          })
          .finally(function() {
            Notification.clear(notificationInstance);
          });
      };

      /**
       * @ngdoc method
       * @name MailingsListingFactory#duplicateMailing
       * @param mailing
       */
      var duplicateMailing = function (mailing) {
        var deferred = $q.defer();

        var index = mailings.indexOf(mailing);

        var notificationInstance = Notification.loading('Duplicating mailing...');

        if (index !== -1) {
          CiviApi.post(constants.entities.MAILING, mailing, 'duplicatemassemail')
            .then(function (response) {
              return CiviApi.get(constants.entities.MAILING, {id: response.data.values[0].id});
            })
            .then(function (response) {
              mailings.push(response.data.values[0]);
              deferred.resolve();
            })
            .catch(function (response) {
              deferred.reject(response);
            });
        } else {
          deferred.reject('Mailing to be duplicated was not found in the list of all mailings');
        }

        return deferred.promise
          .then(function () {
            Notification.success('Mailing duplicated');
          })
          .catch(function (response) {
            Notification.error('Failed to duplicate the mailing', response.data.error_message);
            $log.error('Failed to duplicate the mailing:', response);

            return $q.reject();
          })
          .finally(function() {
            Notification.clear(notificationInstance);
          });
      };

      // Getters //

      /**
       * @ngdoc method
       * @name MailingsListingFactory#getMailings
       * @returns {Array}
       */
      var getMailings = function () {
        return mailings;
      };

      /**
       * @ngdoc method
       * @name MailingsListingFactory#getUserId
       * @returns {Array}
       */
      var getUserId = function () {
        return userId;
      };

      /**
       * @ngdoc method
       * @name MailingsListingFactory#getCreators
       * @returns {Array}
       */
      var getCreators = function () {
        return creators;
      };

      /////////////////////
      // Private Methods //
      /////////////////////

      /**
       * @name initMailings
       * @private
       * @returns {ng.IPromise<TResult>}
       */
      var initMailings = function () {
        return CiviApi.get(constants.entities.MAILING, {}, {error: 'Failed to retrieve mailings'})
          .then(function (response) {
            mailings = response.data.values;
            userId = response.data.userId;
          })
          .then(clearSearchResultsFromSession)
          .catch(function (response) {
            if (response.data && response.data.error_message) {
              Notification.error(response.data.error_message);
            } else {
              Notification.error(response);
            }
          });
      };

      /**
       * @name initCreators
       * @private
       */
      var initCreators = function () {
        creators = $filter('extractColumn')(mailings, {id: 'created_id', name: 'sort_name'});
        creators = $filter('unique')(creators, 'id');
      };

      /**
       * @name clearSearchResultsFromSession
       * @private
       * @returns {IPromise}
       */
      var clearSearchResultsFromSession = function () {
        return CiviApi.post(constants.entities.MAILING, {}, 'clearsearchcontacts')
          .catch(function () {
            return true; // because don't want to show an error notification for this - would simply confuse end-users
          });
      };

      return {
        init: init,
        deleteMailing: deleteMailing,
        cancelMailing: cancelMailing,
        duplicateMailing: duplicateMailing,
        getMailings: getMailings,
        getUserId: getUserId,
        getCreators: getCreators
      };
    }
  ];

  /**
   * @ngdoc service
   * @name WizardStepFactory
   * @alias WizardStepFactory
   * @type {*[]}
   */
  var WizardStepProvider = ['$location', '$log', '$q', 'CiviApiFactory', 'MailingDetailFactory', 'NotificationFactory', 'paths',
    /**
     *
     * @param $location
     * @param $log
     * @param $q
     * @param {CiviApiFactory} CiviApi
     * @param {MailingDetailFactory} Mailing
     * @param {NotificationFactory} Notification
     * @param paths
     */
      function ($location, $log, $q, CiviApi, Mailing, Notification, paths) {
      var constants = {
        steps: {
          FIRST: 1,
          LAST: 4
        },
        paths: {
          WIZARD_ROOT: '/mailings'
        }
      };

      var currentStep = constants.steps.FIRST;

      var showPrevStepLink = false;
      var showNextStepLink = false;

      ////////////////////
      // Public Methods //
      ////////////////////

      ///**
      //* @ngdoc method
      //* @name WizardStepFactory#init
      //* @returns {IPromise}
      //*/
      //var init = function () {
      //  var deferred = $q.defer();
      //};

      /**
       * @type {boolean}
       */
      var initialised = false;

      /**
       * @ngdoc method
       * @name WizardStepFactory#isInitialised
       * @returns {boolean}
       */
      var isInitialised = function () {
        return initialised;
      };

      /**
       * @ngdoc method
       * @name WizardStepFactory#init
       */
      var init = function () {
        initialised = true;
      };

      /**
       * @ngdoc method
       * @name WizardStepFactory#nextStepAllowed
       * @returns {boolean}
       */
      var nextStepAllowed = function () {
        return getCurrentStep() < constants.steps.LAST;
      };

      /**
       * @ngdoc method
       * @name WizardStepFactory#prevStepAllowed
       * @returns {boolean}
       */
      var prevStepAllowed = function () {
        return getCurrentStep() > constants.steps.FIRST;
      };

      /**
       * @ngdoc method
       * @name WizardStepFactory#nextStep
       * @returns {IPromise}
       */
      var nextStep = function () {
        if (!nextStepAllowed()) return $q.reject('Next step now allowed!');

        return proceedToStep(currentStep + 1);
      };

      /**
       * @ngdoc method
       * @name WizardStepFactory#prevStep
       * @returns {IPromise}
       */
      var prevStep = function () {
        if (!prevStepAllowed()) return $q.reject('Prev step not allowed!');

        return proceedToStep(currentStep - 1);
      };

      /**
       * @ngdoc method
       * @name WizardStepFactory#saveAndContinueLater
       * @returns {ng.IPromise<TResult>|*}
       */
      var saveAndContinueLater = function () {
        return Mailing.saveProgress()
          .then(function () {
            Mailing.clearCurrentMailing();
            redirectToListing();
          });
      };

      /**
       * @ngdoc method
       * @name WizardStepFactory#submitMassEmail
       * @returns {IPromise}
       */
      var submitMassEmail = function () {
        return Mailing.submitMassEmail()
          .then(function () {
            redirectToListing();
          });
      };

      /**
       * @ngdoc method
       * @name WizardStepFactory#sendTestEmail
       * @returns {IPromise}
       */
      var sendTestEmail = function () {
        return Mailing.sendTestEmail();
      };

      /**
       * @ngdoc method
       * @name WizardStepFactory#cancel
       */
      var cancel = function () {
        Mailing.clearCurrentMailing();
        redirectToListing();
      };

      /**
       * @ngdoc method
       * @name WizardStepFactory#getPartialPath
       * @returns {string}
       */
      var getPartialPath = function () {
        return paths.PARTIALS_DIR() + '/wizard/steps/step-' + getCurrentStep() + '.html';
      };

      /**
       * @ngdoc method
       * @name WizardStepFactory#getRegionsTemplatePath
       * @returns {string}
       */
      var getRegionsTemplatePath = function() {
        return paths.TEMPLATES_DIR() + '/wave-regions.html';
      };

      /**
       * @ngdoc method
       * @name WizardStepFactory#getStepTitle
       * @returns {*}
       */
      var getStepTitle = function() {
        var title;

        switch(currentStep) {
          case 1:
            title = 'Step 1: Create Email';
            break;
          case 2:
            title = 'Step 2: Compose Email';
            break;
          case 3:
            title = 'Step 3: Preview and Test';
            break;
          case 4:
            title = 'Step 4: Schedule and Send';
            break;
        }

        return title;
      };

      // Getters and Setters //

      /**
       * @ngdoc method
       * @name WizardStepFactory#getCurrentStep
       * @returns {number}
       */
      var getCurrentStep = function () {
        return currentStep;
      };

      /**
       * @ngdoc method
       * @name WizardStepFactory#getMailingStatus
       * @returns {string}
       */
      var getMailingStatus = function() {
        return Mailing.getCurrentMailingStatus();
      };

      /**
       * @ngdoc method
       * @name WizardStepFactory#setCurrentStep
       * @param step
       */
      var setCurrentStep = function (step) {
        currentStep = step;
      };

      /////////////////////
      // Private Methods //
      /////////////////////

      /**
       * @private
       * @returns {ng.IPromise<TResult>|*}
       */
      var proceedToStep = function (step) {
        var changed = false;
        if (Mailing.isCurrentMailingDirty()) {
          var notificationInstance = Notification.loading('Saving...');
          changed = true;
        }

        return Mailing.saveProgress()
          .then(function () {
            if (changed) {
              Notification.clear(notificationInstance);
              Notification.success('Mailing saved');
            }

            redirectToStep(step);
          })
          .catch(function (response) {
            Notification.error('Failed to save mailing!');
            $log.error('Failed to save mailing!', response);
          });
      };

      /**
       * @private
       */
      var redirectToStep = function (step) {
        setCurrentStep(step);
        initialised = false;
        $location.path(getStepUrl(step));
      };

      /**
       * @private
       */
      var redirectToListing = function () {
        $location.path(constants.paths.WIZARD_ROOT);
      };

      /**
       * @private
       * @returns {string}
       */
      var getStepUrl = function (step) {
        return constants.paths.WIZARD_ROOT + '/' + Mailing.getCurrentMailing().id + '/steps/' + step;
      };

      return {
        init: init,
        isInitialised: isInitialised,
        getCurrentStep: getCurrentStep,
        getRegionsTemplatePath: getRegionsTemplatePath,
        setCurrentStep: setCurrentStep,
        nextStep: nextStep,
        prevStep: prevStep,
        nextStepAllowed: nextStepAllowed,
        prevStepAllowed: prevStepAllowed,
        cancel: cancel,
        saveAndContinueLater: saveAndContinueLater,
        sendTestEmail: sendTestEmail,
        submitMassEmail: submitMassEmail,
        getPartialPath: getPartialPath,
        getMailingStatus: getMailingStatus,
        getStepTitle: getStepTitle
      };
    }];









  /**
   * @ngdoc service
   * @name HeaderFactory
   */
  var HeaderProvider = ['$q', 'CiviApiFactory',
    /**
     *
     * @param $q
     * @param {CiviApiFactory} CiviApi
     */
      function ($q, CiviApi) {
      var constants = {
        entities: {
          HEADER: 'SimpleMailHeader'
        }
      };

      /**
       * @type {Array}
       */
      var headers = [];

      /**
       * @type {boolean}
       */
      var initialised = false;

      /**
       * @ngdoc method
       * @name HeaderFactory#init
       * @returns {*}
       */
      var init = function () {
        var deferred = $q.defer();

        if (initialised) {
          deferred.resolve();
        } else {
          CiviApi.get('SimpleMailHeader', {withFilters: true}, {cached: true})
            .then(function (response) {
              headers = response.data.values;
              initialised = true;
              deferred.resolve();
            })
            .catch(function () {
              deferred.reject();
            });
        }

        return deferred.promise;
      };

      /**
       * @ngdoc method
       * @name HeaderFactory#getHeaders
       * @returns {Array}
       */
      var getHeaders = function () {
        return headers;
      };

      return {
        init: init,
        getHeaders: getHeaders
      };
    }
  ];

  /**
   * @ngdoc service
   * @name CampaignMessageFactory
   */
  var CampaignMessageProvider = ['$q', 'CiviApiFactory',
    /**
     * @param $q
     * @param {CiviApiFactory} CiviApi
     */
      function ($q, CiviApi) {
      var constants = {
        entities: {
          MESSAGE: 'SimpleMailMessage'
        }
      };

      /**
       * @type {Array}
       */
      var messages = [];

      /**
       * @type {boolean}
       */
      var initialised = false;

      /**
       * @ngdoc method
       * @name CampaignMessageFactory#init
       * @returns {IPromise}
       */
      var init = function () {
        var deferred = $q.defer();

        if (initialised) {
          deferred.resolve();
        } else {
          CiviApi.get(constants.entities.MESSAGE, {is_active: 1}, {cached: true})
            .then(function (response) {
              messages = response.data.values;
              initialised = true;
              deferred.resolve();
            })
            .catch(function () {
              deferred.reject();
            });
        }

        return deferred.promise;
      };

      /**
       * @ngdoc method
       * @name CampaignMessageFactory#getMessages
       * @returns {Array}
       */
      var getMessages = function () {
        return messages;
      };

      return {
        init: init,
        getMessages: getMessages
      };
    }
  ];

  /**
   * @ngdoc service
   * @name MailingHelperFactory
   */
  var MailingHelperProvider = ['$filter', '$q', 'CiviApiFactory',
    /**
     * @param $filter
     * @param {CiviApiFactory} CiviApi
     */
      function ($filter, $q, CiviApi) {
      var constants = {
        entities: {
          OPTION_GROUP: 'OptionGroup',
          OPTION_VALUE: 'OptionValue',
          MAILING_GROUP: 'Group',
          MAILING_CATEGORY: 'Group'
        }
      };

      /**
       *
       * @type {Array}
       */
      var mailingGroups = [];

      /**
       *
       * @type {Array}
       */
      var mailingCategories = [];

      /**
       *
       * @type {Array}
       */
      var fromEmails = [];

      /**
       * @type {Array}
       */
      var headerFilters = [];

      /**
       * @type {boolean}
       */
      var mailingGroupsInitialised = false;

      /**
       * @type {boolean}
       */
      var fromEmailsInitialised = false;

      /**
       * @type {boolean}
       */
      var headerFiltersInitialised = false;

      ////////////////////
      // Public Methods //
      ////////////////////

      /**
       * @ngdoc method
       * @name MailingHelperFactory#initMailingGroups
       * @returns {IPromise}
       */
      var initMailingGroups = function () {
        var deferred = $q.defer();

        if (mailingGroupsInitialised) {
          deferred.resolve();
        } else {
          CiviApi.get(constants.entities.MAILING_GROUP)
            .then(function (response) {
              // TODO (robin): Move is_hidden filtering to API query
              var groups = $filter('filter')(response.data.values, {is_hidden: 0});

              angular.forEach(groups, function (group) {
                var isMailingGroup = false;
                var isMailingCategory = false;

                if (group.group_type.indexOf('2') !== -1) isMailingGroup = true;
                if (group.group_type.indexOf('3') !== -1) isMailingCategory = true;

                if (isMailingGroup) {
                  if (isMailingCategory) mailingCategories.push(group);
                  else mailingGroups.push(group);
                }
              });

              mailingGroupsInitialised = true;
              deferred.resolve();
            })
            .catch(function () {
              deferred.reject();
            });
        }

        return deferred.promise;
      };

      /**
       * @ngdoc method
       * @name MailingHelperFactory#initFromEmails
       * @returns {*}
       */
      var initFromEmails = function () {
        var deferred = $q.defer();

        if (fromEmailsInitialised) {
          deferred.resolve();
        } else {
          CiviApi.getValue(constants.entities.OPTION_GROUP, {name: 'from_email_address', return: 'id'}, {cached: true})
            .then(function (response) {
              return +response.data.result;
            })
            // Get the option values
            .then(function (groupId) {
              return CiviApi.get('OptionValue', {option_group_id: groupId}, {cached: true})
                .then(function (response) {
                	
                	for (var fromEmailIndex in response.data.values){
                		var item = response.data.values[fromEmailIndex];
                		if (!item.id){
                			delete(response.data.values[item]);
                		}
                	}
                	
                  fromEmails = response.data.values;
                  fromEmailsInitialised = true;
                  deferred.resolve();
                });
            })
            .catch(function () {
              deferred.reject();
            });
        }

        return deferred.promise;
      };

      /**
       * @ngdoc method
       * @name MailingHelperFactory#initHeaderFilters
       * @returns {IPromise}
       */
      var initHeaderFilters = function () {
        var deferred = $q.defer();

        if (headerFiltersInitialised) {
          deferred.resolve();
        } else {
          CiviApi.getValue(constants.entities.OPTION_GROUP, {name: 'sm_header_filter_options', return: 'id'},
            {cached: true})
            .then(function (response) {
              return +response.data.result;
            })
            .then(function (groupId) {
              return CiviApi.get(constants.entities.OPTION_VALUE, {option_group_id: groupId, is_active: '1'},
                {cached: true})
                .then(function (response) {
                  headerFilters = $filter('orderBy')(response.data.values, 'label');
                  headerFiltersInitialised = true;
                  deferred.resolve();
                });
            })
            .catch(function (response) {
              deferred.reject(response);
            });
        }

        return deferred.promise;
      };

      // Getters and Setters //

      /**
       * @ngdoc method
       * @name MailingHelperFactory#getMailingGroups
       * @returns {Array}
       */
      var getMailingGroups = function () {
        return mailingGroups;
      };

      /**
       * @ngdoc method
       * @name MailingHelperFactory#getMailingCategories
       * @returns {Array}
       */
      var getMailingCategories = function () {
        return mailingCategories;
      };

      /**
       * @ngdoc method
       * @name MailingHelperFactory#getFromEmails
       * @returns {Array}
       */
      var getFromEmails = function () {
        return fromEmails;
      };

      /**
       * @ngdoc method
       * @name MailingHelperFactory#getHeaderFilters
       * @returns {Array}
       */
      var getHeaderFilters = function () {
        return headerFilters;
      };

      return {
        initMailingGroups: initMailingGroups,
        initFromEmails: initFromEmails,
        initHeaderFilters: initHeaderFilters,
        getMailingCategories: getMailingCategories,
        getMailingGroups: getMailingGroups,
        getFromEmails: getFromEmails,
        getHeaderFilters: getHeaderFilters
      };
    }
  ];

  /**
   * @ngdoc service
   * @name MailingDetailFactory
   * @return {object}
   */
  var MailingDetailProvider = ['$log', '$q', '$routeParams', 'CiviApiFactory', 'NotificationFactory',
    /**
     *
     * @param $log
     * @param $q
     * @param $routeParams
     * @param {CiviApiFactory} CiviApi
     * @param {NotificationFactory} Notification
     */
      function ($log, $q, $routeParams, CiviApi, Notification) {
      var constants = {
        entities: {
          MAILING: 'SimpleMail'
        },
        statuses: {
          NOT_SCHEDULED: 'Not Scheduled',
          SCHEDULED: 'Scheduled',
          RUNNING: 'Running',
          COMPLETE: 'Complete',
          CANCELLED: 'Cancelled'
        }
      };

      //var mailingId = null;

      /**
       * @type {object}
       */
      var currentMailing = {};

      /**
       * @type {object}
       */
      var originalCurrentMailing = {};

      /**
       * @type {boolean}
       */
      var createdFromSearch;

			/**
			 * Stores the number of contacts that are being emailed
			 * This value is only populated if the contacts have come from a previous
			 * search result, or if this is a previous email that we've come back to
			 * 
			 * @type {int} 
			 */
			var contactsCount;

      /**
       * @type {string}
       */
      var status = constants.statuses.NOT_SCHEDULED;

      /**
       * @type {boolean}
       */
      var initialised = false;

      ////////////////////
      // Public Methods //
      ////////////////////

      /**
       * @ngdoc method
       * @name MailingDetailFactory#init
       * @returns {IPromise}
       */
      var init = function () {
        var deferred = $q.defer();

        if (isInitialised()) {
          deferred.resolve();
        } else {
          initMailing()
            .then(function () {
              initialised = true;
              deferred.resolve();
            })
            .catch(function () {
              deferred.reject();
            });
        }

        return deferred.promise;

        //return initMailing();
      };

      /**
       * @ngdoc method
       * @name MailingDetailFactory#isInitialised
       * @returns {boolean}
       */
      var isInitialised = function () {
        if (initialised) {
          // Un-initialise the mailing in case we are opening another mailing from the listing (or directly from the URL)
          if (shouldReset()) {
            resetCurrentMailing();
          }
        }

        return initialised;
      };

      /**
       * @ngdoc method
       * @name MailingDetailFactory#shouldReset
       * @returns {boolean}
       */
      var shouldReset = function () {
        return getCurrentMailingId() && ( getCurrentMailingId() != getMailingIdFromUrl() );
      };

      /**
       * @ngdoc method
       * @name MailingDetailFactory#resetCurrentMailing
       */
      var resetCurrentMailing = function () {
        setCurrentMailing({}, true);
        initialised = false;
      };

      /**
       * @returns {?number}
       */
      var getCurrentMailingId = function () {
        return +getCurrentMailing().id;
      };

      /**
       * @ngdoc method
       * @name MailingDetailFactory#canUpdate
       * @returns {boolean}
       */
      var canUpdate = function () {
        var mailing = getCurrentMailing();

        return !!mailing.crm_mailing_id && !!mailing.scheduled_date;
      };

      /**
       * @ngdoc method
       * @name MailingDetailFactory#saveProgress
       * @returns {IPromise}
       */
      var saveProgress = function () {
        // Avoid non-initialisation due to race conditions
        return init()
          .then(function () {
            // If nothing changed, just return a resolved promise
            if (!isCurrentMailingDirty()) return;

            var currentMailing = getCurrentMailing();

            // Reset scheduled_date and send_immediately in case the current mailing object (cached) has a scheduled
            // date but is not yet actually been scheduled - this is needed because if the mailing object has a
            // scheduled date and we sent the API request to save it, CiviCRM will actually schedule it. We only want
            // to schedule a mailing from the submitMassEmail() method, and not saveProgress(), because it will fire the
            // special API action 'submitmassemail', which takes care of a few important bits before scheduling.
            if (currentMailing.scheduled_date && isCurrentMailingNotScheduled()) {
              currentMailing.scheduled_date = '';
              if (currentMailing.send_immediately) {
                currentMailing.send_immediately = false;
              }
            }

            // Else, save the changes
            return CiviApi.create(constants.entities.MAILING, currentMailing)
              .then(function (response) {
                return CiviApi.get(constants.entities.MAILING, {id: response.data.values[0].id});
              })
              .then(function (response) {
                setCurrentMailing(response.data.values[0], true);
              });
          });
      };

      /**
       * @ngdoc method
       * @name MailingDetailFactory#isCurrentMailingDirty
       * @returns {boolean}
       */
      var isCurrentMailingDirty = function () {
        return !angular.equals(getCurrentMailing(), getCurrentMailing(true));
      };

      /**
       * @ngdoc method
       * @name MailingDetailFactory#getCurrentMailingStatus
       * @returns {string}
       */
      var getCurrentMailingStatus = function() {
        return status;
      };

      /**
       * @ngdoc method
       * @name MailingDetailFactory#isCurrentMailingNotScheduled
       * @returns {boolean}
       */
      var isCurrentMailingNotScheduled = function() {
        return getCurrentMailingStatus() === constants.statuses.NOT_SCHEDULED;
      };

      /**
       * @ngdoc method
       * @name MailingDetailFactory#submitMassEmail
       * @returns {IPromise}
       */
      var submitMassEmail = function () {
        if (currentMailing.send_immediately) {
          currentMailing.scheduled_date = Date.create().format('{yyyy}-{{MM}}-{{dd}} {{HH}}:{{mm}}:{{ss}}');
        }

        return CiviApi.post(constants.entities.MAILING, getCurrentMailing(), 'submitmassemail', {
          success: 'Mailing submitted for mass emailing',
          error: 'Oops! Failed to submit the mailing for mass emailing'
        });
      };

      /**
       * @ngdoc method
       * @name MailingDetailFactory#sendTestEmail
       *
       * @returns {IPromise}
       */
      var sendTestEmail = function () {
        var mailing = getCurrentMailing();

        Notification.info('Sending test email');

        return CiviApi.post('SimpleMail', {
          crmMailingId: mailing.crm_mailing_id,
          groupId: mailing.testRecipientGroupId,
          emails: mailing.testRecipientEmails
        }, 'sendtestemail')
          .then(function (response) {
            Notification.success('Test email sent');
          })
          .catch(function (response) {
            var description = (response.data && response.data.error_message) ? response.data.error_message : '';
            Notification.error('Failed to send test email', description);
          });
      };

      /**
       * @ngdoc method
       * @name MailingDetailFactory#isCreatedFromSearch
       * @returns {boolean}
       */
      var isCreatedFromSearch = function () {
        return createdFromSearch;
      };

			/**
			 * @ngdoc method
			 * @name MailingDetailFactory#getContactsCount
			 * @returns {int} 
			 */
			var getContactsCount = function(){
				return contactsCount;
			};

      // Getters and Setters

      /**
       * @ngdoc method
       * @name MailingDetailFactory#getCurrentMailing
       * @param {boolean=} original
       * @returns {object}
       */
      var getCurrentMailing = function (original) {
        return original ? originalCurrentMailing : currentMailing;
      };

      /**
       * @ngdoc method
       * @name MailingDetailFactory#setCurrentMailing
       * @param {object} mailing
       * @param {boolean=} updateOriginal
       */
      var setCurrentMailing = function (mailing, updateOriginal) {
        currentMailing = mailing;
        if (updateOriginal) originalCurrentMailing = angular.copy(mailing);

        updateCurrentMailingStatus();
      };

      /**
       * @param boolean
       * @private
       */
      var setCreatedFromSearch = function (boolean) {
        createdFromSearch = boolean;
      };

      /////////////////////
      // Private Methods //
      /////////////////////

      /**
       * @private
       * @returns {boolean}
       */
      var isNewMailing = function () {
        return getMailingIdFromUrl() === 'new';
      };

      /**
       * @private
       * @returns {IPromise}
       */
      var initMailing = function () {
        var deferred = $q.defer();

        // The mailing isn't new (i.e. mailing ID exists in the URL) - populate current mailing using the API
        // constants.entities.MAILING = SimpleMail
        if (!isNewMailing()) {
          CiviApi.get(constants.entities.MAILING, {id: getMailingIdFromUrl()})
            .then(function (response) {
            	
              setCurrentMailing(response.data.values[0], true);

              var createdFromSearch = response.data.values[0].hidden_recipient_group_entity_ids.length ? true : false;
              setCreatedFromSearch(createdFromSearch);
							
							if (response.data.contactsCount){
								contactsCount = response.data.contactsCount;
							}
							
              deferred.resolve();
            })
            .catch(function () {
              deferred.reject();
            });
        } else {
          CiviApi.post('SimpleMail', getCurrentMailing(), 'iscreatedfromsearch')
            .then(function (response) {
              
              var createdFromSearch = response.data.values[0].answer;
              
              setCreatedFromSearch(createdFromSearch);
							
							if (createdFromSearch){

								CiviApi.post('SimpleMail', getCurrentMailing(), 'getsearchcontacts')
									.then(function(response){
										contactsCount = response.data.values.length;
			              deferred.resolve();
									});
							
							} else {
	              deferred.resolve();
							}
							
            });
        }

        return deferred.promise;
      };

      /**
       * @private
       */
      var updateCurrentMailingStatus = function() {
        switch (getCurrentMailing().status) {
         case 'Scheduled':
            status = constants.statuses.SCHEDULED;
            break;
          case 'Running':
            status = constants.statuses.RUNNING;
            break;
          case 'Complete':
            status = constants.statuses.COMPLETE;
            break;
          case 'Canceled':
            status = constants.statuses.CANCELLED;
            break;
          case 'Not Scheduled':
            // break missed intentionally
          default:
            status = constants.statuses.NOT_SCHEDULED;
            break;
        }
      };

      /**
       * @private
       * @returns {?number|string}
       */
      var getMailingIdFromUrl = function () {
        return $routeParams.mailingId;
      };

      return {
        canUpdate: canUpdate,
        clearCurrentMailing: resetCurrentMailing,
        init: init,
        saveProgress: saveProgress,
        sendTestEmail: sendTestEmail,
        submitMassEmail: submitMassEmail,
        //getCurrentMailingId: getCurrentMailingId,
        getCurrentMailing: getCurrentMailing,
        setCurrentMailing: setCurrentMailing,
        isInitialised: isInitialised,
        isCreatedFromSearch: isCreatedFromSearch,
        getContactsCount : getContactsCount,
        isCurrentMailingDirty: isCurrentMailingDirty,
        isCurrentMailingNotScheduled: isCurrentMailingNotScheduled,
        getCurrentMailingStatus: getCurrentMailingStatus
      };
    }];

  /**
   * @ngdoc service
   * @name NotificationFactory
   * @return {object}
   */
  var NotificationProvider = ['$log',
    /**
     * Create a notification
     *
     * @param $log
     */
      function ($log) {
      /**
       * Enable or disable all notifications
       *
       * @type {boolean}
       */
      var notificationEnabled = true;

      /**
       * Enable or disable logging of notifications
       *
       * @type {boolean}
       */
      var logNotifications = true;

      /**
       * Notification status constants for passing as argument to CiviCRM notification function
       *
       * @readonly
       * @enum {string}
       */
      var constants = {
        notificationTypes: {
          SUCCESS: 'success',
          ERROR: 'error',
          INFO: 'info',
          ALERT: 'alert',
          LOADING: 'crm-msg-loading'
        }
      };

      /**
       * Create an alert message
       *
       * @ngdoc method
       * @name NotificationFactory#alert
       * @param subject
       * @param description
       */
      var alert = function (subject, description) {
        return _createCrmNotification(subject, description, constants.notificationTypes.ALERT);
      };

      /**
       * Create a success message
       *
       * @ngdoc method
       * @name NotificationFactory#success
       * @param subject
       * @param description
       */
      var success = function (subject, description) {
        return _createCrmNotification(subject, description, constants.notificationTypes.SUCCESS);
      };

      /**
       * Create an informative message
       *
       * @ngdoc method
       * @name NotificationFactory#info
       * @param subject
       * @param description
       */
      var info = function (subject, description) {
        return _createCrmNotification(subject, description, constants.notificationTypes.INFO);
      };

      /**
       * Create an error message
       *
       * @ngdoc method
       * @name NotificationFactory#error
       * @param subject
       * @param description
       */
      var error = function (subject, description) {
        return _createCrmNotification(subject, description, constants.notificationTypes.ERROR);
      };

      /**
       * Create a loading message
       *
       * @ngdoc method
       * @name NotificationFactory#loading
       * @param subject
       * @param description
       */
      var loading = function (subject, description) {
        return _createCrmNotification(subject, description, constants.notificationTypes.LOADING, {expires: 0});
      };

      /**
       * Create a generic error message
       *
       * @ngdoc method
       * @name NotificationFactory#genericError
       */
      var genericError = function () {
        return _createCrmNotification('Oops! Something went wrong.', 'Please refresh the page', constants.notificationTypes.ERROR);
      };

      /**
       * Close a notification given by its instance
       *
       * @ngdoc method
       * @name NotificationFactory#clear
       * @param instance Notification instance
       */
      var clear = function (instance) {
        instance.close();
      };

      /**
       * Wrapper for creating CiviCRM notifications, and optionally logging them
       *
       * @ngdoc function
       * @param subject
       * @param description
       * @param type
       * @param {object=} options
       * @private
       */
      var _createCrmNotification = function (subject, description, type, options) {
        if (notificationEnabled) {
          description = description || '';
          options = options || {};

          if (logNotifications) $log.debug('(' + type.toUpperCase() + ') ' + subject, description);

          return CRM.alert(description, subject, type, options);
        }
      };

      return {
        alert: alert,
        clear: clear,
        success: success,
        info: info,
        error: error,
        loading: loading,
        genericError: genericError
      };
    }
  ];

  /**
   * @ngdoc factory
   * @name loggingServices
   * @deprecate TODO (robin): Use the $log everywhere and remove this
   */
  services.factory("loggingServices",
    function () {
      /**
       * Enable or disable all logging
       *
       * @type {boolean}
       */
      var loggingEnabled = true;

      return {
        /**
         * Log into the browser console
         *
         * @param subject
         * @param data
         */
        createLog: function (subject, data) {
          if (loggingEnabled) {
            if (data) {
              console.log(subject + ":", data);
            } else {
              console.log(subject);
            }
          }
        }
      };
    });

  /**
   * @ngdoc service
   * @name CiviApiFactory
   * @alias CiviApiFactory
   */
  var CiviApiProvider = ['$http', '$q', '$log', 'NotificationFactory',
    /**
     * @param {$http} $http
     * @param {$q} $q
     * @param {$log} $log
     * @param {NotificationFactory} Notification
     */
      function ($http, $q, $log, Notification) {
      /**
       * Return a list of records for the given entity
       *
       * @name CiviApiFactory#get
       * @param {string} entityName
       * @param {object=} data Optional data to pass in the GET/POST request
       * @param {{success: string=, error: string=, progress: string=}=} options
       * @returns {IPromise}
       */
      var get = function (entityName, data, options) {
        return post(entityName, data, 'get', options);
      };

      /**
       * Return value corresponding to the given name for the entity
       *
       * @name CiviApiFactory#getValue
       * @param {string} entityName
       * @param {object=} data Optional data to pass in the GET/POST request
       * @param {{success: string=, error: string=, progress: string=}=} options
       * @returns {IPromise}
       */
      var getValue = function (entityName, data, options) {
        return post(entityName, data, 'getValue', options);
      };

      /**
       * Create a new record for the given entity
       *
       * @name CiviApiFactory#create
       * @param entityName
       * @param {object=} data Optional data to pass in the GET/POST request
       * @param {{success: string=, error: string=, progress: string=}=} options
       * @returns {IPromise}
       */
      var create = function (entityName, data, options) {
        return post(entityName, data, 'create', options);
      };

      /**
       * Update an existing record for the given entity
       *
       * @name CiviApiFactory#update
       * @param entityName
       * @param {object=} data Optional data to pass in the GET/POST request
       * @param {{success: string=, error: string=, progress: string=}=} options
       * @returns {IPromise}
       */
      var update = function (entityName, data, options) {
        return post(entityName, data, 'create', options);
      };

      /**
       * Delete a record for the given entity
       *
       * @name CiviApiFactory#remove
       * @param {string} entityName
       * @param {object=} data Optional data to pass in the GET/POST request
       * @param {{success: string=, error: string=, progress: string=}=} options
       * @returns {IPromise}
       */
      var remove = function (entityName, data, options) {
        return post(entityName, data, 'delete', options)
      };

      /**
       * Send a POST request to the CiviCRM API. This will also create logs and, optionally, notifications.
       *
       * @name CiviApiFactory#post
       * @param {string} entityName
       * @param {object=} data Optional data to pass in the GET/POST request
       * @param {string} action
       * @param {{success: string=, error: string=, progress: string=}=} options
       * @returns {IPromise}
       */
      var post = function (entityName, data, action, options) {
        data = data || {};
        options = options || {};

        var successMessage = options.success || null;
        var errorMessage = options.error || null;
        var progressMessage = options.progress || null;

        var cached = options.cached || false;

        if (progressMessage) {
          var notificationInstance = Notification.loading(progressMessage);
        }

        return _createPost(entityName, data, action, cached)
          .then(function (response) {
            if (response.data.is_error) return $q.reject(response);

            if (progressMessage) {
              Notification.clear(notificationInstance);
            }

            if (successMessage) {
              Notification.success(successMessage);
              $log.info(successMessage + ':', response);
            } else {
              $log.info('Successfully performed \'' + action + '\' on \'' + entityName + '\' with response:', response);
            }

            return response;
          })
          .catch(function (response) {
            if (errorMessage) {
              if (response.data.error_message) errorMessage += ': ' + response.data.error_message;

              Notification.error(errorMessage);
              $log.error(errorMessage + ':', response);
            } else {
              $log.error('Failed to perform ' + action + ' on ' + entityName + ' with response:', response);
            }

            return $q.reject(response);
          });
      };

      /**
       * Wrapper to configure HTTP post request and send it to the CiviCRM API for various actions
       *
       * @param {string} entityName
       * @param {object=} data Optional data to pass in the GET/POST request
       * @param {string} action
       * @param {boolean} cached
       * @returns {IHttpPromise|HttpPromise}
       * @private
       */
      var _createPost = function (entityName, data, action, cached) {
        data = data || {};

        data.entity = entityName;
        data.action = action;
        data.sequential = 1;
        data.json = 1;
        data.rowCount = 0;

        // Because data needs to be sent as string for CiviCRM to accept
        var serialisedData = jQuery.param(data);

        // TODO (robin): Move this to config
        var postUrl = '/civicrm/ajax/rest';

        // Set the headers so AngularJS POSTs the data as form data (and not request payload, which CiviCRM doesn't recognise)
        var headers = {'Content-Type': 'application/x-www-form-urlencoded'};

        return $http.post(postUrl, serialisedData, {headers: headers, cached: cached});
      };

      return {
        // Methods
        get: get,
        getValue: getValue,
        create: create,
        update: update,
        remove: remove,
        post: post
      };
    }
  ];

  angular.module('simpleMail.services')
    .factory('MailingsListingFactory', MailingsListingProvider)
    .factory('MailingDetailFactory', MailingDetailProvider)
    .factory('HeaderFactory', HeaderProvider)
    .factory('CampaignMessageFactory', CampaignMessageProvider)
    .factory('MailingHelperFactory', MailingHelperProvider)
    .factory('WizardStepFactory', WizardStepProvider)
    .factory('NotificationFactory', NotificationProvider)
    .factory('CiviApiFactory', CiviApiProvider)
  ;
})();