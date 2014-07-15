// simpleMail.adminApp
// simpleMail.services
// simpleMail.adminApp.controllers
// simpleMail.app.controllers
// simpleMail.app
/**
 * Simple Mail admin app
 *
 * @type {*}
 */
var app = angular.module('simpleMail.adminApp', [
  'ngRoute',
  'ngAnimate',
  'simpleMail.adminApp.controllers',
  'simpleMail.services',
  'simpleMail.directives',
  'angularFileUpload'
]);

function partialUrl(url) {
  return '/civicrm_custom/extensions/compucorp/uk.co.compucorp.civicrm.simplemail/partials/admin/' + url;
}

app.config(['$routeProvider',
  function ($routeProvider) {
    $routeProvider
      // todo: add resolvers to listing controllers in order to not render view until API has returned data
      .when('/headers', {
        templateUrl: partialUrl('listHeaders.html'),
        controller: 'HeadersAdminController'
      })
      .when('/headers/:headerId/edit', {
        templateUrl: partialUrl('editHeader.html'),
        controller: 'HeaderAdminController'
      })
      .when('/headers/new', {
        templateUrl: partialUrl('editHeader.html'),
        controller: 'HeaderAdminController'
      })
      .when('/messages', {
        templateUrl: partialUrl('listMessages.html'),
        controller: 'MessagesAdminController'
      })
      .otherwise({
        redirectTo: '/'
      })
  }
]);
