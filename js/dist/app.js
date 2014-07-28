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
  'simpleMail.services',
  'simpleMail.constants',
  'simpleMail.filters'
]);

function partialUrl(url) {
  return '/civicrm_custom/extensions/compucorp/uk.co.compucorp.civicrm.simplemail/partials/wizard/steps/' + url;
}

app.config(['$routeProvider', 'paths',
  function ($routeProvider, paths) {
    $routeProvider
      // TODO (robin): add resolvers to listing controllers in order to not render view until API has returned data
      .when('/mailings', {
        templateUrl: paths.PARTIALS_DIR() + '/wizard/listMailings.html',
        controller: 'MailingsController'
      })
      .when('/mailings/:mailingId', {
        redirectTo: '/mailings/:mailingId/steps/1'
      })
      .when('/mailings/:mailingId/steps', {
        redirectTo: '/mailings/:mailingId/steps/1'
      })
      .when('/mailings/:mailingId/steps/1', {
        templateUrl: partialUrl('steps.html'),
        controller: 'CreateMailingController'
      })
      .when('/mailings/:mailingId/steps/2', {
        templateUrl: partialUrl('steps.html'),
        controller: 'ComposeMailingController'
      })
      .when('/steps/2', {
        templateUrl: partialUrl('steps.html'),
        controller: 'ComposeMailingController'
      })
      .when('/mailings/:mailingId/steps/3', {
        templateUrl: partialUrl('steps.html'),
        controller: 'TestMailingController'
      })
      .when('/mailings/:mailingId/steps/4', {
        templateUrl: partialUrl('steps.html'),
        controller: 'ScheduleAndSendController'
      })
      .otherwise({
        redirectTo: '/mailings'
      });
  }
]);
