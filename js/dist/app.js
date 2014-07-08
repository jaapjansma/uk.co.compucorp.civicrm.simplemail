var adminApp = angular.module('simpleMailAdminApp', [
  'ngRoute',
  'ngAnimate',
  'simpleMailAdminApp.controllers',
  'simpleMailAdminApp.services'
]);

function partialUrl(url) {
  return '/civicrm_custom/extensions/compucorp/uk.co.compucorp.civicrm.simplemail/partials/admin/' + url;
}

adminApp.config(['$routeProvider',
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
