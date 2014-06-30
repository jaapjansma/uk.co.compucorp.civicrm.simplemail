var controllers = angular.module('simpleMailControllers', []);

controllers.config(['$httpProvider', function ($httpProvider) {
  // This is needed (Utils/Rest.php::ajax()) for CiviCRM to treat the request as genuine
  $httpProvider.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
}]);

/**
 * Headers
 */
controllers.controller('HeadersAdminController', ['$scope', '$http',
  function ($scope, $http) {
    $scope.test = 'Hello world';
    $scope.headers = [];

    $http.post('/civicrm/ajax/rest?json=1&debug=on&sequential=1&entity=SimpleMailHeader&action=get')
      .success(function (headers) {
        $scope.headers = headers;
        console.log('Headers:', headers);
      }).error(function () {
        console.log('failure');
      });
  }
]);

/**
 * Header
 */
controllers.controller('HeaderAdminController', ['$scope', '$http', '$routeParams',
  function ($scope, $http, $routeParams) {
    $scope.header = {};

    $http.post('/civicrm/ajax/rest?json=1&debug=on&sequential=1&entity=SimpleMailHeader&action=get&id=' + $routeParams.headerId)
      .success(function (header) {
        $scope.header = header;
        console.log('Headers:', header);
      }).error(function () {
        console.log('failure');
      });
  }
]);

/**
 * Messages
 */
controllers.controller('MessagesAdminController', ['$scope', '$http',
  function ($scope, $http) {
    $scope.test = 'Hello world';
    $scope.messages = [];

    $http.post('/civicrm/ajax/rest?json=1&debug=on&sequential=1&entity=SimpleMailMessage&action=get')
      .success(function (messages) {
        $scope.messages = messages;
        console.log('Messages', messages);
      }).error(function () {
        console.log('failure');
      });
  }
]);