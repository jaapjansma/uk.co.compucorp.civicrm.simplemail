/**
 * Simple Mail app
 *
 * @type {*}
 */
var app = angular.module('simpleMail.app', [
  'ngRoute',
  'ngAnimate',
  'simpleMail.app.controllers',
  'simpleMail.services'
]);

function partialUrl(url) {
  return '/civicrm_custom/extensions/compucorp/uk.co.compucorp.civicrm.simplemail/partials/' + url;
}

app.config(['$routeProvider',
  function ($routeProvider) {
    $routeProvider
      // todo: add resolvers to listing controllers in order to not render view until API has returned data
      .when('/steps/1', {
        templateUrl: partialUrl('step-1.html'),
        controller: 'StepOneController'
      })
    .otherwise({
        redirectTo: '/'
      })
  }
]);
