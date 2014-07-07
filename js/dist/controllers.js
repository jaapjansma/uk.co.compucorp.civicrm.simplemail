var controllers = angular.module('simpleMailApp.controllers', []);

controllers.config(['$httpProvider', function ($httpProvider) {
  // This is needed (Utils/Rest.php::ajax()) for CiviCRM to treat the request as genuine
  $httpProvider.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
}]);

/**
 * Headers
 */
controllers.controller('HeadersAdminController', [
  '$scope', '$http', 'civiApiServices', 'loggingServices', 'notificationServices',
  function ($scope, $http, civiApi, log, notification) {
    $scope.test = 'Hello world';
    $scope.headers = [];

    civiApi.get('SimpleMailHeader')
      .success(function (headers) {
        $scope.headers = headers;
        log.createLog('Headers received', headers);
      }).error(function (response) {
        log.createLog('Failed to retrieve headers', response);
      });
  }
]);

/**
 * A single header
 */
controllers.controller('HeaderAdminController', ['$scope', '$http', '$routeParams',
  function ($scope, $http, $routeParams) {
    $scope.header = {};

    $http.post('/civicrm/ajax/rest?json=1&sequential=1&entity=SimpleMailHeader&action=get&id=' + $routeParams.headerId)
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
controllers.controller('MessagesAdminController', [
  '$scope', '$http', 'civiApiServices', 'loggingServices', 'notificationServices',
  function ($scope, $http, civiApi, log, notification) {

    $scope.$on('$viewContentLoaded', function () {
      cj('#crm-container textarea.huge:not(.textarea-processed), #crm-container textarea.form-textarea:not(.textarea-processed)').each(function () {
        $this = cj(this);
        if ($this.parents('div.civicrm-drupal-wysiwyg').length == 0)
          $this.TextAreaResizer();
      });
    });


    $scope.test = 'Hello world';
    $scope.messages = {};
    $scope.newMessage = {
//      editing: true
    };

    // civiApiService.get('SimpleMailMessages)
    // civiApiService.update('SimpleMailMessages', #id)
    // civiApiService.create('SimpleMailMessages')
    // civiApiService.delete('SimpleMailMessages', #id)

    civiApi.get('SimpleMailMessage')
      .success(function (messages) {
        $scope.messages = messages;
        log.createLog('Messages retrieved', messages);
      }).error(function (response) {
        log.createLog('Failed to retrive messages', response);
      });

    /**
     * Retrieve the array of all messages out of the messages object
     *
     * @returns {ui.slider.options.values|*|s.values|values|.options.values|b.values}
     */
    $scope.getMessages = function () {
      return $scope.messages.values;
    };

    /**
     * Retrieve a message using its index in the message array
     *
     * @param index
     * @returns {*}
     */
    $scope.getMessage = function (index) {
      return $scope.getMessages()[index];
    };

    $scope.getMessageCopy = function (index) {
      return angular.copy($scope.getMessage(index));
    };

    $scope.sanitiseMessage = function (message) {
      if ("editing" in message) {
        delete message.editing;
      }

      if (!("is_active" in message)) {
        message.is_active = 0;
      }

      return message;
    };

    // todo: simplify this - too many similarly named functions are confusing - remove all but the essential ones
    $scope.getSanitisedMessage = function (index) {
      return $scope.sanitiseMessage($scope.getMessageCopy(index));
    };

    $scope.enableAddingMessage = function () {
      $scope.newMessage.editing = true;
    };

    $scope.clearNewMessageForm = function () {
      $scope.newMessage = {};
    };

    $scope.disableAddingMessage = function () {
      $scope.newMessage.editing = false;
      $scope.clearNewMessageForm();
    };

    $scope.enableEditingMessage = function (index) {
      $scope.getMessage(index).editing = true;
    };

    $scope.disableEditingMessage = function (index) {
      $scope.getMessage(index).editing = false;
    };


    $scope.addMessage = function () {
      var message = $scope.sanitiseMessage(angular.copy($scope.newMessage));

      civiApi.create('SimpleMailMessage', message)
        .success(function (response) {
          log.createLog('Create message response', response);

          if (response.error_message) {
            log.createLog('Failed to add message', response.error_message);
            $scope.errorMessage = response.error_message;
          } else {
            notification.success('Message added');
            $scope.messages.values = $scope.messages.values.concat(response.values);
            $scope.disableAddingMessage();
          }
        })
    }

    /**
     * Update a message
     *
     * @param index
     */
    $scope.updateMessage = function (index) {
      var message = $scope.getSanitisedMessage(index);

      civiApi.update('SimpleMailMessage', message)
        .success(function (response) {
          log.createLog('Update message response', response);

          $scope.disableEditingMessage(index);

          if (response.error_message) {
            notification.error('Failed to update message', response.error_message);
            $scope.errorMessage = response.error_message;
          } else {
            notification.success('Message updated');
          }
        });
    };

    /**
     * Delete a message
     *
     * @param index
     */
    $scope.deleteMessage = function (index) {
      var message = $scope.getSanitisedMessage(index);

      civiApi.remove('SimpleMailMessage', message)
        .success(function (response) {
          console.log(response);

          if (response.error_message) {
            console.log('Failed to update the record:', response.error_message);
            $scope.errorMessage = response.error_message;
          } else {
            notification.success('Message deleted');
            $scope.getMessages().splice(index, 1);
          }
        });
    };

    /**
     * Save a message to the backend database
     *
     * @param messageId
     */
    $scope.save = function (messageId) {
      $http.post('/civicrm/ajax/rest?entity=SimpleMailMessage&action=create&sequential=1&json=1')
    }
  }
]);