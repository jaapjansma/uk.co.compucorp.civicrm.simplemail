var controllers = angular.module('simpleMail.app.controllers', []);

controllers.config(['$httpProvider', function ($httpProvider) {
  // This is needed (Utils/Rest.php::ajax()) for CiviCRM to treat the request as genuine
  $httpProvider.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
}]);

controllers.controller('MailingsController', [
  '$scope', '$http', 'civiApiServices', 'loggingServices', 'notificationServices',
  function ($scope, $http, civiApi, log, notification) {

    $scope.constants = {
      ENTITY_NAME: 'SimpleMail'
    };

    civiApi.get($scope.constants.ENTITY_NAME)
      .success(function (response) {
        log.createLog('Mailings received', response);
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
    // Set the current step of the wizard
    mailing.setCurrentStep(1);

    // Set whether links to previous/next step be shown
    $scope.showPrevStepLink = mailing.showPrevStepLink();
    $scope.showNextStepLink = mailing.showNextStepLink();

    // Set the partial path for the current step
    $scope.partial = mailing.getStepPartialPath();

    $scope.constants = {
      ENTITY_NAME: 'Group'
    };

    // Initialise empty mailing
    $scope.mailing = {};

    // Get the current mailing
    mailing.getCurrent()
      .success(function (response) {
        log.createLog('Mailing received', response);
        $scope.mailing = response.values[0];
      })
      .error(function (response) {
        log.createLog('Failed to retrieve mailing', response);
      });

    // Get the list of mailing recipient groups
    civiApi.get($scope.constants.ENTITY_NAME)
      .success(function (response) {
        log.createLog('Groups received', response);
        $scope.groups = response.values;
      });

    // Proceed to next step
    $scope.nextStep = function () {
      mailing.nextStep($scope.mailing);
    };


    // Go back to previous step
    $scope.prevStep = function () {
      mailing.prevStep($scope.mailing);
    };
  }
]);

/**
 * Step 2 of the wizard
 */
controllers.controller('ComposeMailingController', [
  '$scope', '$http', '$routeParams', '$location', 'civiApiServices', 'loggingServices', 'notificationServices', 'paths', 'mailingServices',
  function ($scope, $http, $routeParams, $location, civiApi, log, notification, paths, mailing) {
    // Set the current step of the wizard
    mailing.setCurrentStep(2);

    // Set whether links to previous/next step be shown
    $scope.showPrevStepLink = mailing.showPrevStepLink();
    $scope.showNextStepLink = mailing.showNextStepLink();

    // Set the partial path for the current step
    $scope.partial = mailing.getStepPartialPath();

    $scope.constants = {
      ENTITY_NAME: 'Group'
    };

    // Initialise empty mailing
    $scope.mailing = {};

    // TODO (robin): is this needed?
    $scope.selectedMessage = 0;

    // TODO (robin): is this needed?
    $scope.$watch('selectedMessage', function (newVal, oldVal) {
      console.log('Changed');
      if (oldVal == newVal) return;
    });

    // TODO (robin): delete this?
    $scope.test = function () {
      $scope.selectedMessage++;
    };

    // Get the current mailing
    mailing.getCurrent()
      .success(function (response) {
        log.createLog('Mailing retrieved', response);
        $scope.mailing = response.values[0];
      })
      .error(function (response) {
        console.log('Failed to retrieve mailing', response);
      });

    // Get the option group
    civiApi.get('OptionGroup', {name: 'mailing_header_filter_options'})
      .success(function (response) {
        log.createLog('Mailing header filter option response', response);
        $scope.headerFilterOptionGroup = response.values[0];

        // Get the option values
        civiApi.get('OptionValue', {option_group_id: $scope.headerFilterOptionGroup.id})
          .success(function (response) {
            log.createLog('Mailing header filter group options response', response);
            $scope.headerFilterOptionValues = response.values;
          })
          .error(function (response) {

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

      });

    // Proceed to next step
    $scope.nextStep = function () {
      mailing.nextStep($scope.mailing);
    };


    // Go back to previous step
    $scope.prevStep = function () {
      mailing.prevStep($scope.mailing);
    };
  }
]);

/**
 * Step 3
 */
controllers.controller('TestMailingController', [
  '$scope', '$http', '$routeParams', '$location', 'civiApiServices', 'loggingServices', 'notificationServices', 'mailingServices',
  function ($scope, $http, $routeParams, $location, civiApi, log, notification, mailing) {
    // Set the current step of the wizard
    mailing.setCurrentStep(3);

    // Set whether links to previous/next step be shown
    $scope.showPrevStepLink = mailing.showPrevStepLink();
    $scope.showNextStepLink = mailing.showNextStepLink();

    // Set the partial path for the current step
    $scope.partial = mailing.getStepPartialPath();

    $scope.constants = {
      ENTITY_NAME: 'Group'
    };

    // Initialise empty mailing
    $scope.mailing = {};

    $scope.constants = {
      ENTITY_NAME: 'Group'
    };

    civiApi.get($scope.constants.ENTITY_NAME)
      .success(function (response) {
        log.createLog('Groups received', response);
        $scope.groups = response.values;
      });


    // Proceed to next step
    $scope.nextStep = function () {
      mailing.nextStep($scope.mailing);
    };

    // Go back to previous step
    $scope.prevStep = function () {
      mailing.prevStep($scope.mailing);
    };
  }
]);

/**
 * Step 4 of the wizard
 */
controllers.controller('ScheduleAndSendController', [
  '$scope', '$http', '$routeParams', '$location', 'civiApiServices', 'loggingServices', 'notificationServices', 'mailingServices',
  function ($scope, $http, $routeParams, $location, civiApi, log, notification, mailing) {
    // Set the current step of the wizard
    mailing.setCurrentStep(4);

    // Set whether links to previous/next step be shown
    $scope.showPrevStepLink = mailing.showPrevStepLink();
    $scope.showNextStepLink = mailing.showNextStepLink();

    // Set the partial path for the current step
    $scope.partial = mailing.getStepPartialPath();

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

    // Proceed to next step
    $scope.nextStep = function () {
      mailing.nextStep($scope.mailing);
    };

    // Go back to previous step
    $scope.prevStep = function () {
      mailing.prevStep($scope.mailing);
    };
  }
]);
