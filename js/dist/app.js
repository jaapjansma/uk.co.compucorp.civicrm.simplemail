var app = angular.module('simpleMailApp', [
  'ngRoute',
  'simpleMailControllers'
]);

function partialUrl(url) {
  return '/civicrm_custom/extensions/compucorp/uk.co.compucorp.civicrm.simplemail/partials/admin/' + url;
}

app.config(['$routeProvider',
  function ($routeProvider) {
    $routeProvider
      .when('/headers', {
        templateUrl: '/civicrm_custom/extensions/compucorp/uk.co.compucorp.civicrm.simplemail/partials/admin/listHeaders.html',
        controller: 'HeadersAdminController'
      })
      .when('/headers/:headerId', {
        templateUrl: partialUrl('editHeader.html'),
        controller: 'HeaderAdminController'
      })
      .when('/messages', {
        templateUrl: partialUrl('listMessages.html'),
        controller: 'MessagesAdminController'
      })
      .when('/messages/:messageId', {
        templateUrl: partialUrl('editMessage.html'),
        controller: 'MessageAdminController'
      })
      .otherwise({
        redirectTo: '/'
      })
  }
]);
