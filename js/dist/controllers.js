var messagesAdmin = angular.module('messagesAdmin', []);

messagesAdmin.controller('MessagesAdminController', ['$scope', '$http',
    function ($scope, $http) {
        $scope.test = 'Hello world';

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