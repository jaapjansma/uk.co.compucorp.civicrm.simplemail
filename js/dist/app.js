/**
 * Simple Mail app
 *
 * @type {*}
 */
var app = angular.module('simpleMail.app', [
  'ngRoute',
  'ngAnimate',
  'ui.select2',
  'simpleMail.app.controllers',
  'simpleMail.services'
]);

function partialUrl(url) {
  return '/civicrm_custom/extensions/compucorp/uk.co.compucorp.civicrm.simplemail/partials/wizard/steps/' + url;
}

app.config(['$routeProvider',
  function ($routeProvider) {
    $routeProvider
      // todo: add resolvers to listing controllers in order to not render view until API has returned data
      .when('/steps/1', {
        templateUrl: partialUrl('steps.html'),
//        controller: 'StepsController'
        controller: 'CreateMailingController'
      })
      .when('/steps/2', {
        templateUrl: partialUrl('steps.html'),
        controller: 'ComposeMailingController'
      })
      .when('/steps/3', {
        templateUrl: partialUrl('steps.html'),
        controller: 'TestMailingController'
      })
      .when('/steps/4', {
        templateUrl: partialUrl('steps.html'),
        controller: 'ScheduleAndSendController'
      })
//      .when('/steps/2', {
//        templateUrl: partialUrl('steps.html'),
//        controller: 'StepsController'
//      })
      .otherwise({
        templateUrl: partialUrl('steps.html'),
        controller: 'StepsController'
      });
  }
]);
