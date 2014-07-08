var controllers = angular.module('simpleMail.adminApp.controllers', []);

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
    $scope.constants = {
      ENTITY_NAME: 'SimpleMailHeader'
    };

    $scope.headers = {};

    civiApi.get($scope.constants.ENTITY_NAME)
      .success(function (headers) {
        $scope.headers = headers;
        log.createLog('Headers received', headers);
      }).error(function (response) {
        log.createLog('Failed to retrieve headers', response);
      });


    /**
     * Retrieve the array of all headers out of the headers object
     *
     * @returns {ui.slider.options.values|*|s.values|values|.options.values|b.values}
     */
    $scope.getHeaders = function () {
      return $scope.headers.values;
    };

    $scope.getHeader = function (index) {
      return $scope.getHeaders()[index];
    };

    $scope.sanitiseHeader = function (header) {
      return header;
    };

    $scope.deleteHeader = function (index) {
      var header = $scope.sanitiseHeader(angular.copy($scope.getHeader(index)));

      civiApi.remove($scope.constants.ENTITY_NAME, header)
        .success(function (response) {
          log.createLog('Delete message response', response);

          if (response.error_message) {
            notification.error('Failed to delete header', response.error_message);
            $scope.errorMessage = response.error_message;
          } else {
            notification.success('Header deleted');
            $scope.getHeaders().splice(index, 1);
          }
        });
    };
  }
]);

/**
 * A single header
 */
controllers.controller('HeaderAdminController', [
  '$scope', '$http', 'civiApiServices', 'loggingServices', 'notificationServices', '$routeParams', '$location',
  function ($scope, $http, civiApi, log, notification, $routeParams, $location) {
    $scope.header = {};

    $scope.constants = {
      ENTITY_NAME: 'SimpleMailHeader'
    };

    if ($routeParams.headerId) {
      civiApi.get($scope.constants.ENTITY_NAME, $routeParams.headerId)
        .success(function (response) {
          log.createLog('Header retrieved', response);

          if (header.error_message) {
            notification.error('Failed to retrieve the header', response.error_message);
            $scope.redirectToListing();
          } else {
            $scope.header = response.values[0];
          }
        });
    }

    /**
     * Redirect to the listing of headers
     */
    $scope.redirectToListing = function () {
      $location.path('/headers');
    };

    /**
     * Create or update header depending upon whether the header was loaded from the database or was being added as new
     */
    $scope.createOrUpdateHeader = function () {
      if ($scope.header.id) {
        civiApi.update($scope.constants.ENTITY_NAME, $scope.header)
          .success(function (response) {
            log.createLog('Update header response', response);

            if (response.error_message) {
              notification.error('Failed to update header', response.error_message);
            } else {
              notification.success('Header updated');
              $scope.redirectToListing();
            }
          });
      } else {
        civiApi.create($scope.constants.ENTITY_NAME, $scope.header)
          .success(function (response) {
            log.createLog('Save header response', response);

            if (response.error_message) {
              notification.error('Failed to add header', response.error_message);
            } else {
              notification.success('Header added');
              $scope.redirectToListing();
            }
          });
      }
    };
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

    $scope.constants = {
      ENTITY_NAME: 'SimpleMailMessage'
    };

    $scope.messages = {};
    $scope.newMessage = {
//      editing: true
    };

    // civiApiService.get('SimpleMailMessages)
    // civiApiService.update('SimpleMailMessages', #id)
    // civiApiService.create('SimpleMailMessages')
    // civiApiService.delete('SimpleMailMessages', #id)

    civiApi.get($scope.constants.ENTITY_NAME)
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


    /**
     * Create a new message
     */
    $scope.createMessage = function () {
      var message = $scope.sanitiseMessage(angular.copy($scope.newMessage));

      civiApi.create($scope.constants.ENTITY_NAME, message)
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
    };

    /**
     * Update a message
     *
     * @param index
     */
    $scope.updateMessage = function (index) {
      var message = $scope.getSanitisedMessage(index);

      civiApi.update($scope.constants.ENTITY_NAME, message)
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

      civiApi.remove($scope.constants.ENTITY_NAME, message)
        .success(function (response) {
          console.log(response);

          // todo: this could be refactored out into the civiApiServices, so that we only need to send the callback functions for success and failure to it from here
          if (response.error_message) {
            console.log('Failed to update the record:', response.error_message);
            $scope.errorMessage = response.error_message;
          } else {
            notification.success('Message deleted');
            $scope.getMessages().splice(index, 1);
          }
        });
    };
  }
]);