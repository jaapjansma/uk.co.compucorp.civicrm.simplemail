var messagesAdmin = angular.module('messagesAdmin', []);

messagesAdmin.config(['$httpProvider', function ($httpProvider) {
  // This is needed (Utils/Rest.php::ajax()) for CiviCRM to treat the request as genuine
  $httpProvider.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
}]);

messagesAdmin.controller('MessagesAdminController', ['$scope', '$http',
  function ($scope, $http) {
    $scope.test = 'Hello world';
    $scope.messages = [];

    $http.post('/civicrm/ajax/rest?json=1&debug=on&entity=SimpleMailMessage&action=get')
      .success(function (messages) {
        $scope.messages = messages;
        console.log(messages);
      }).error(function () {
        console.log('failure');
      });

    $scope.messages = [
      {
        id: 1,
        label: 'Message one',
        text: 'This is the long text',
        isActive: true
      },
      {
        id: 2,
        label: 'Message two',
        text: 'This is the long text',
        isActive: true
      },
      {
        id: 3,
        label: 'Message three',
        text: 'This is the long text',
        isActive: true
      },
      {
        id: 4,
        label: 'Message four',
        text: 'This is the long text',
        isActive: true
      }
    ];
  }
]);