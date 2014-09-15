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
   * @ngDoc controller
   * @name MailingsController
   *
   * @description Listing of mailing wizards
   */
  controllers.controller('MailingsController', [
    '$scope', '$http', '$q', 'civiApiServices', 'loggingServices', 'notificationServices', '$filter',
    function ($scope, $http, $q, civiApi, log, notification, $filter) {

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

      civiApi.get($scope.constants.ENTITY_NAME)
        .then(function (response) {
          log.createLog('Mailings retrieved', response);
          $scope.mailings = response.data.values;

          var creators = $filter('extractColumn')($scope.mailings, {id: 'created_id', name: 'sort_name'});
          $scope.models.creators = $filter('unique')(creators, 'id');
          $scope.models.creators.unshift({id: 'all', 'name': 'All'});

          // The below will cause to show mailings for all users if the current user never created any mailing;
          // otherwise nothing would be shown, potentially confusing the user that mailings are missing/lost
          var currentUserInCreators = $filter('filter')($scope.models.creators, {id: response.data.userId});
          $scope.mailingFilters.creator = currentUserInCreators.length ? response.data.userId : 'all';
        })
        .finally(function() {
          $scope.models.mailingsLoaded = true;
        })
        .catch(function (response) {
          console.log('Failed to retrieve mailing', response);
        });

      /**
       * @name deleteMailing
       * @description Delete a mailing given by its index in the mailings array
       *
       * @param mailing
       */
      $scope.deleteMailing = function (mailing) {
        if (!mailing.hasOwnProperty('_internal')) mailing._internal = {};

        // Don't do anything if the button was pressed already and waiting for server response
        if (mailing._internal.deleteEnabled === false) {
          return;
        }

        mailing._internal.deleteEnabled = false;

        var index = $scope.mailings.indexOf(mailing);

        if (index !== -1) {
          civiApi.remove('SimpleMail', mailing)
            .then(function (response) {
              if (response.data.is_error) return $q.reject(response);

              notification.success('Mailing deleted');
               $scope.mailings.splice(index, 1);
              mailing._internal.deleteEnabled = true;
            })
            .catch(function (response) {
              notification.error('Failed to delete the mailing', response.data.error_message);
              console.log('Failed to delete the mailing', response);
              mailing._internal.deleteEnabled = true;
            });
        }
      };

      /**
       * Cancel scheduled mass mailing
       *
       * @param mailing
       */
      $scope.cancelMailing = function (mailing) {
        if (!mailing.hasOwnProperty('_internal')) mailing._internal = {};

        // Don't do anything if the button was pressed already and waiting for server response
        if (mailing._internal.cancelEnabled === false) {
          return;
        }

        mailing._internal.cancelEnabled = false;

        var index = $scope.mailings.indexOf(mailing);

        if (index !== -1) {
          civiApi.post('SimpleMail', mailing, 'cancelmassemail')
            .then(function (response) {
              if (response.data.is_error) return $q.reject(response);

              notification.success('Mailing cancelled');
              mailing.status = 'Canceled';
              mailing._internal.cancelEnabled = true;
            })
            .catch(function (response) {
              notification.error('Failed to cancel the mailing');
              console.log('Failed to cancel the mailing', response);
              mailing._internal.cancelEnabled = true;
            })
        }
      };
    }
  ]);

  /**
   * Step 1 of the wizard
   */
  controllers.controller('CreateMailingController', [
    '$scope', '$http', '$routeParams', '$location', '$filter', 'civiApiServices', 'loggingServices', 'notificationServices', 'paths', 'mailingServices',
    function ($scope, $http, $routeParams, $location, $filter, civiApi, log, notification, paths, mailing) {
      // Initialise the step
      mailing.initStep({step: 1, scope: $scope});

      $scope.constants = {
        ENTITY_NAME: 'Group'
      };

      // Initialise empty mailing
      $scope.mailing = {};
      $scope.groups = [];

      mailing.getMailing()
        .then(function (response) {
          $scope.mailing = response;
        });

      // Get the list of mailing recipient groups
      civiApi.get($scope.constants.ENTITY_NAME)
        .success(function (response) {
          log.createLog('Groups retrieved', response);
          $scope.groups = $filter('filter')(response.values, {is_hidden: 0});
        });
    }
  ]);

  /**
   * Step 2 of the wizard
   */
  controllers.controller('ComposeMailingController', [
    '$scope', '$timeout', '$http', '$routeParams', '$location', '$q', 'civiApiServices', 'loggingServices', 'notificationServices', 'paths', 'mailingServices', 'itemFromCollectionFilter',
    function ($scope, $timeout, $http, $routeParams, $location, $q, civiApi, log, notification, paths, mailing, itemFromCollection) {
      $scope.models = {
        selectedMessage: {},
        headersLoaded: false
      };

      $scope.headers = $scope.messages = [];

      // Initialise the step
      mailing.initStep({step: 2, scope: $scope});

      $scope.constants = {
        ENTITY_NAME: 'Group'
      };

      // Initialise empty mailing
      $scope.mailing = {};

      $scope.$watch('mailing.message_id', function (newVal, oldVal) {
        if (oldVal !== newVal) {
          $scope.mailing.message_id = newVal;

          var item = itemFromCollection($scope.messages, 'id', $scope.mailing.message_id);
          var selectedMessage = item.item;

          if (selectedMessage !== null && selectedMessage.hasOwnProperty('text')) {
            $scope.models.selectedMessage.text = selectedMessage.text;
          }
        }
      });

      // Get from emails
      civiApi.getValue('OptionGroup', {name: 'from_email_address', return: 'id'})
        .then(function (response) {
          log.createLog('From-email address option response', response);

          if (response.data.is_error) return $q.reject(response);

          return response.data.result;
        })
        // Get the option values
        .then(function (groupId) {
          return civiApi.get('OptionValue', {option_group_id: groupId})
            .then(function (response) {
              log.createLog('From-email address group options response', response);
              $scope.fromEmailOptionValues = response.data.values;
            })
        })
        .catch(function () {
          notification.error('Failed to retrieve from-email addresses');
        });

      // Get the headers
      civiApi.get('SimpleMailHeader', {withFilters: true}, 'get')
        .then(function (response) {
          /*
           * Get the list of filters from option value table
           * Selecting a filter from the drop down would retrieve headers that have this filter applied
           * Show images in each header for the selected filter
           * Selecting an image would set the header's ID on $scope.mailing.header_id
           */
          console.log('Headers retrieved', response);

          if (response.data.is_error) return $q.reject(response);

          $scope.headers = response.data.values;
        })
        .then(function () {
          $scope.models.headersLoaded = true;
        })
        .catch(function (response) {
          console.log('Failed to retrieve headers', response);
        });

      // Get the filter options
      civiApi.getValue('OptionGroup', {name: 'sm_header_filter_options', return: 'id'})
        .then(function (response) {
          if (response.data.is_error) return $q.reject(response);

          console.log('Option group for filters retrieved', response);
          return +response.data.result;
        })
        .then(function (groupId) {
          civiApi.get('OptionValue', {option_group_id: groupId, is_active: '1'})
            .then(function (response) {
              if (response.data.is_error) return $q.reject(response);

              console.log('Filter values retrieved', response);
              $scope.filters = response.data.values;
              $scope.filters.unshift({id: "all", label: "All"});

              return true;
            });
        })
        .catch(function (response) {
          console.log('Failed to retrieve filter values', response);
        });

      // Get the current mailing
      mailing.getMailing()
        .then(function (response) {
          $scope.mailing = response;
        })
        .then(function (response) {
          // Get the messages - note: this is within 'then' as otherwise it is possible that messages are not retrieved
          // the mailing is, thereby making the selectedMessageText filter fail to populate the message text reliably
          return civiApi.get('SimpleMailMessage', {is_active: 1}).
            success(function (response) {
              log.createLog('Messages retrieved', response);
              $scope.messages = response.values;

              var item = itemFromCollection($scope.messages, 'id', $scope.mailing.message_id);
              var selectedMessage = item.item;

              if (selectedMessage !== null && selectedMessage.hasOwnProperty('text')) {
                $scope.models.selectedMessage.text = selectedMessage.text;
              }
            })
        })
        .catch(function (response) {
          console.log('Failed to retrieve the mailing', response);
        });
    }
  ]);

  /**
   * Step 3
   */
  controllers.controller('TestMailingController', [
    '$scope', '$http', '$routeParams', '$location', '$filter', 'civiApiServices', 'loggingServices', 'notificationServices', 'mailingServices',
    function ($scope, $http, $routeParams, $location, $filter, civiApi, log, notification, mailing) {
      // Initialise the step
      mailing.initStep({step: 3, scope: $scope});

      $scope.constants = {
        ENTITY_NAME: 'Group'
      };

      // Initialise empty mailing
      $scope.mailing = {};
      $scope.groups = [];

      $scope.constants = {
        ENTITY_NAME: 'Group'
      };

      $scope.models = {
        emailHtml: ''
      };

      // Get the current mailing
      mailing.getMailing()
        .then(function (response) {
          $scope.mailing = response;
        });

      civiApi.get($scope.constants.ENTITY_NAME)
        .success(function (response) {
          log.createLog('Groups retrieved', response);
          $scope.groups = $filter('filter')(response.values, {is_hidden: 0});
        });
    }
  ]);

  /**
   * Step 4 of the wizard
   */
  controllers.controller('ScheduleAndSendController', [
    '$scope', '$http', '$routeParams', '$location', 'civiApiServices', 'loggingServices', 'notificationServices', 'mailingServices',
    function ($scope, $http, $routeParams, $location, civiApi, log, notification, mailing) {
      // Initialise the step
      mailing.initStep({step: 4, scope: $scope});

      $scope.constants = {
        ENTITY_NAME: 'Group'
      };

      // Initialise empty mailing
      $scope.mailing = {};

      // Get the current mailing
      mailing.getMailing()
        .then(function (response) {
          $scope.mailing = response;
        });

      // Activate the jQuery datepicker plugin once the partial has been included
      $scope.$on('$includeContentLoaded', function (e) {
        cj("#datepicker").datepicker();
      });

      $scope.constants = {
        ENTITY_NAME: 'Group'
      };
    }
  ]);
})();
