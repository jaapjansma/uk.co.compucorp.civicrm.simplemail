(function () {
  "use strict";

  /**
   * Controllers for the mailing wizard section of the app
   *
   * @type {*|module}
   */
  var controllers = angular.module('simpleMail.app.controllers', []);

  controllers.config(['$httpProvider', function ($httpProvider) {
    // This is needed (Utils/Rest.php::ajax()) for CiviCRM to treat the request as genuine
    $httpProvider.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
  }]);

  /**
   * Listing of mailing wizards
   */
  controllers.controller('MailingsController', [
    '$scope', '$http', 'civiApiServices', 'loggingServices', 'notificationServices',
    function ($scope, $http, civiApi, log, notification) {

      $scope.constants = {
        ENTITY_NAME: 'SimpleMail'
      };

      civiApi.get($scope.constants.ENTITY_NAME)
        .success(function (response) {
          log.createLog('Mailings retrieved', response);
          $scope.mailings = response.values;
        });
    }
  ]);

  /**
   * Step 1 of the wizard
   */
  controllers.controller('CreateMailingController', [
    '$scope', '$http', '$routeParams', '$location', 'civiApiServices', 'loggingServices', 'notificationServices', 'paths', 'mailingServices',
    function ($scope, $http, $routeParams, $location, civiApi, log, notification, paths, mailing) {
      $scope.model = {
        selectedGroupIds: {}
      };

      // Initialise the step
      mailing.initStep({step: 1, scope: $scope});

      $scope.constants = {
        ENTITY_NAME: 'Group'
      };

      // Initialise empty mailing
      $scope.mailing = {};

      $scope.$watch('model.selectedGroupIds', function (newVal, oldVal) {
        if (oldVal !== newVal) {
          $scope.mailing.recipientGroupIds = newVal;
        }
      });

      // Get the current mailing
      mailing.getCurrent()
        .success(function (response) {
          log.createLog('Mailing retrieved', response);
          $scope.mailing = response.values[0];
          mailing.getRecipientGroups()
            .success(function (response) {
              console.log('Groups retrieved', response);
              var recipientGroupIds = [], recipientGroups = response.values;

              for (var i = 0, end = response.values.length; i < end; i++) {
                recipientGroupIds.push(recipientGroups[i].entity_id);
              }

              $scope.mailing.recipientGroupIds = recipientGroupIds;
              $scope.model.selectedGroupIds = recipientGroupIds;
            });
        })
        .error(function (response) {
          log.createLog('Failed to retrieve mailing', response);
        });

      // Get the list of mailing recipient groups
      civiApi.get($scope.constants.ENTITY_NAME)
        .success(function (response) {
          log.createLog('Groups retrieved', response);
          $scope.groups = response.values;
        });
    }
  ]);

  /**
   * Step 2 of the wizard
   */
  controllers.controller('ComposeMailingController', [
    '$scope', '$http', '$routeParams', '$location', 'civiApiServices', 'loggingServices', 'notificationServices', 'paths', 'mailingServices', 'selectedMessageTextFilter',
    function ($scope, $http, $routeParams, $location, civiApi, log, notification, paths, mailing, selectedMessageText) {
      $scope.model = {
        selectedMessage: {}
      };

      // Initialise the step
      mailing.initStep({step: 2, scope: $scope});

      $scope.constants = {
        ENTITY_NAME: 'Group'
      };

      // Initialise empty mailing
      $scope.mailing = {};

      $scope.$watch('model.selectedMessage.id', function (newVal, oldVal) {
        if (oldVal !== newVal) {
          $scope.mailing.message_id = newVal;
          $scope.model.selectedMessage.text = selectedMessageText($scope.messages, $scope.model.selectedMessage.id);
        }
      });

      // Get the current mailing
      mailing.getCurrent()
        .success(function (response) {
          log.createLog('Mailing retrieved', response);
          $scope.mailing = response.values[0];
          $scope.model.selectedMessage.id = +$scope.mailing.message_id;
        })
        .error(function (response) {
          console.log('Failed to retrieve mailing', response);
        });

      // Get the option group
      civiApi.get('OptionGroup', {name: 'from_email_address'})
        .success(function (response) {
          log.createLog('From-email address option response', response);
          $scope.fromEmailOptionGroup = response.values[0];

          // Get the option values
          civiApi.get('OptionValue', {option_group_id: $scope.fromEmailOptionGroup.id})
            .success(function (response) {
              log.createLog('From-email address group options response', response);
              $scope.fromEmailOptionValues = response.values;
            })
            .error(function (response) {
              // TODO
            });
        })
        .error(function (response) {

        });

      // Get the messages
      civiApi.get('SimpleMailMessage', {is_active: 1}).
        success(function (response) {
          log.createLog('Messages retrieved', response);
          $scope.messages = response.values;
        })
        .error(function (response) {
          // TODO
        });
    }
  ]);

  /**
   * Step 3
   */
  controllers.controller('TestMailingController', [
    '$scope', '$http', '$routeParams', '$location', 'civiApiServices', 'loggingServices', 'notificationServices', 'mailingServices',
    function ($scope, $http, $routeParams, $location, civiApi, log, notification, mailing) {
      // Initialise the step
      mailing.initStep({step: 3, scope: $scope});

      $scope.constants = {
        ENTITY_NAME: 'Group'
      };

      // Initialise empty mailing
      $scope.mailing = {};

      $scope.constants = {
        ENTITY_NAME: 'Group'
      };

      // Get the current mailing
      mailing.getCurrent()
        .success(function (response) {
          log.createLog('Mailing retrieved', response);
          $scope.mailing = response.values[0];
        })
        .error(function (response) {
          log.createLog('Failed to retrieve mailing', response);
        });

      civiApi.get($scope.constants.ENTITY_NAME)
        .success(function (response) {
          log.createLog('Groups retrieved', response);
          $scope.groups = response.values;
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
