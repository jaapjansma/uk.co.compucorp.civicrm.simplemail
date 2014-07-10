var controllers = angular.module('simpleMail.app.controllers', []);

controllers.config(['$httpProvider', function ($httpProvider) {
  // This is needed (Utils/Rest.php::ajax()) for CiviCRM to treat the request as genuine
  $httpProvider.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
}]);

controllers.controller('StepOneController', [
  '$scope', '$http', 'civiApiServices', 'loggingServices', 'notificationServices',
  function ($scope, $http, civiApi, log, notification) {

    $scope.constants = {
      ENTITY_NAME: 'Group'
    };

    civiApi.get($scope.constants.ENTITY_NAME)
      .success(function (response) {
        log.createLog('Groups received', response);
        $scope.groups = response.values;
      });
  }
]);


/**
 * Step 1 of the wizard
 */
controllers.controller('CreateMailingController', [
  '$scope', '$http', '$routeParams', '$location', 'civiApiServices', 'loggingServices', 'notificationServices',
  function ($scope, $http, $routeParams, $location, civiApi, log, notification) {

    $scope.partialUrl = function (url) {
      return '/civicrm_custom/extensions/compucorp/uk.co.compucorp.civicrm.simplemail/partials/wizard/steps/' + url;
    };

    $scope.currentStep = 1;
    $scope.partial = $scope.partialUrl('step-1.html');

    $scope.constants = {
      ENTITY_NAME: 'Group'
    };

    civiApi.get($scope.constants.ENTITY_NAME)
      .success(function (response) {
        log.createLog('Groups received', response);
        $scope.groups = response.values;
      });

    $scope.nextStep = function () {
      $scope.currentStep++;
      $location.path('/steps/' + $scope.currentStep);
    };

    $scope.prevStep = function () {
      $scope.currentStep--;
      $location.path('/steps/' + $scope.currentStep);
    };
  }
]);

/**
 * Step 2 of the wizard
 */
controllers.controller('ComposeMailingController', [
  '$scope', '$http', '$routeParams', '$location', 'civiApiServices', 'loggingServices', 'notificationServices',
  function ($scope, $http, $routeParams, $location, civiApi, log, notification) {

    $scope.partialUrl = function (url) {
      return '/civicrm_custom/extensions/compucorp/uk.co.compucorp.civicrm.simplemail/partials/wizard/steps/' + url;
    };

    $scope.currentStep = 2;
    $scope.partial = $scope.partialUrl('step-2.html');

    $scope.constants = {
      ENTITY_NAME: 'Group'
    };

    $scope.selectedMessage = 0;

    $scope.$watch('selectedMessage', function (newVal, oldVal) {
      console.log('Changed');
      if (oldVal == newVal) return;
    });


    $scope.test = function () {
      $scope.selectedMessage++;
    };

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

    civiApi.get('SimpleMailMessage', {is_active: 1}).
      success(function (response) {
        log.createLog('Messages retrieved', response);
        $scope.messages = response.values;
      })
      .error(function (response) {

      });


    $scope.nextStep = function () {
      $scope.currentStep++;
      $location.path('/steps/' + $scope.currentStep);
    };

    $scope.prevStep = function () {
      $scope.currentStep--;
      $location.path('/steps/' + $scope.currentStep);
    };

  }
]);

/**
 * Step 3
 */
controllers.controller('TestMailingController', [
  '$scope', '$http', '$routeParams', '$location', 'civiApiServices', 'loggingServices', 'notificationServices',
  function ($scope, $http, $routeParams, $location, civiApi, log, notification) {

    $scope.partialUrl = function (url) {
      return '/civicrm_custom/extensions/compucorp/uk.co.compucorp.civicrm.simplemail/partials/wizard/steps/' + url;
    };

    $scope.currentStep = 3;
    $scope.partial = $scope.partialUrl('step-3.html');

    $scope.constants = {
      ENTITY_NAME: 'Group'
    };

    civiApi.get($scope.constants.ENTITY_NAME)
      .success(function (response) {
        log.createLog('Groups received', response);
        $scope.groups = response.values;
      });

    $scope.nextStep = function () {
      $scope.currentStep++;
      $location.path('/steps/' + $scope.currentStep);
    };

    $scope.prevStep = function () {
      $scope.currentStep--;
      $location.path('/steps/' + $scope.currentStep);
    };

  }
]);

/**
 * Step 4 of the wizard
 */
controllers.controller('ScheduleAndSendController', [
  '$scope', '$http', '$routeParams', '$location', 'civiApiServices', 'loggingServices', 'notificationServices',
  function ($scope, $http, $routeParams, $location, civiApi, log, notification) {

    $scope.partialUrl = function (url) {
      return '/civicrm_custom/extensions/compucorp/uk.co.compucorp.civicrm.simplemail/partials/wizard/steps/' + url;
    };

    // Activate the jQuery datepicker plugin once the partial has been included
    $scope.$on('$includeContentLoaded', function(e) {
      cj( "#datepicker" ).datepicker();
    });

    $scope.currentStep = 4;
    $scope.partial = $scope.partialUrl('step-4.html');

    $scope.constants = {
      ENTITY_NAME: 'Group'
    };

    $scope.nextStep = function () {
      $scope.currentStep++;
      $location.path('/steps/' + $scope.currentStep);
    };

    $scope.prevStep = function () {
      $scope.currentStep--;
      $location.path('/steps/' + $scope.currentStep);
    };

  }
]);

/*
 controllers.controller('StepsController', [
 '$scope', '$http', '$routeParams', '$location', 'civiApiServices', 'loggingServices', 'notificationServices',
 function ($scope, $http, $routeParams, $location, civiApi, log, notification) {

 $scope.constants = {
 ENTITY_NAME: 'Group'
 };

 $scope.partialUrl = function (url) {
 return '/civicrm_custom/extensions/compucorp/uk.co.compucorp.civicrm.simplemail/partials/wizard/steps/' + url;
 };
 ///civicrm/ajax/rest?entity=OptionGroup&action=get&name=mailing_header_filter_options&debug=1&sequential=1&json=1
 $scope.steps = {
 1: {
 partial: $scope.partialUrl('step-1.html'),
 fields: {
 headerImageFilters: function () {
 console.log('hello');
 //            var headerFilterOption = civiApi.get('OptionGroup', {name: 'mailing_header_filter_options'})
 //              .success(function(response) {
 //               log.createLog('Mailing header filter option response', response);
 //              })
 //              .error(function(response) {
 //
 //              });

 var filters = {};

 return filters;
 },
 fromAddresses: function () {
 return [
 {
 email: 'robinmitra1@gmail.com',
 name: 'Robin Mitra'
 },
 {
 email: 'bill@microsoft.com',
 name: 'Bill Gates'
 },
 {
 email: 'steve@apple.com',
 name: 'Steve Jobs'
 },
 {
 email: 'richard@virgin.com',
 name: 'Richard Branson'
 }
 ];
 }
 }
 },
 2: $scope.partialUrl('step-2.html')
 };

 if ($routeParams.step) {
 $scope.currentStep = +$routeParams.step;
 } else {
 $scope.currentStep = 1;
 }

 civiApi.get($scope.constants.ENTITY_NAME)
 .success(function (response) {
 log.createLog('Groups received', response);
 $scope.groups = response.values;
 });

 $scope.nextStep = function () {
 $scope.currentStep++;
 $location.path('/steps/' + $scope.currentStep);
 };

 $scope.prevStep = function () {
 $scope.currentStep--;
 $location.path('/steps/' + $scope.currentStep);
 };
 }
 ]);
 */