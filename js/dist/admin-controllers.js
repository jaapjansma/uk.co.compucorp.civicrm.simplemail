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

    // todo: rename the argument in all success/error to response to stay consistent and predictable
    civiApi.get($scope.constants.ENTITY_NAME)
      .success(function (headers) {
        // todo: may be just save the actual headers array in headers, so that getHeaders won't be needed and make the behaviour more predictable
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
  '$scope', '$http', '$fileUploader', 'civiApiServices', 'loggingServices', 'notificationServices', '$routeParams', '$location',
  function ($scope, $http, $fileUploader, civiApi, log, notification, $routeParams, $location) {
    $scope.header = {};

    $scope.constants = {
      ENTITY_NAME: 'SimpleMailHeader'
    };

    // create a uploader with options
    var uploader = $scope.imageUploader = $fileUploader.create({
      scope: $scope,                          // to automatically update the html. Default: $rootScope
      url: '/civicrm/ajax/rest?entity=SimpleMailHeader&action=uploadimage&json=1&sequential=1',
//      queueLimit: 1,
      autoUpload: true,
      headers: {
        'X-Requested-with': 'XMLHttpRequest'
      },
      filters: [
        function (item) {                    // first user filter
          console.info('filter1');
          return true;
        }
      ]
    });

    /*
     // Fires after adding a single file to the queue
     uploader.bind('afteraddingfile', function (event, item) {
     console.info('After adding a file', item);
     });

     // Fires when adding a file fails
     uploader.bind('whenaddingfilefailed', function (event, item) {
     console.info('When adding a file failed', item);
     });

     // Fires after adding all dragged/selected images to the queue
     uploader.bind('afteraddingall', function (event, items) {
     console.info('After adding all files', items);
     });

     // Fires before uploading an item
     uploader.bind('beforeupload', function (event, item) {
     console.info('Before upload', item);
     });

     // On file upload progress
     uploader.bind('progress', function (event, item, progress) {
     console.info('Progress: ' + progress, item);
     });
     */

    // Fires before uploading an item
    uploader.bind('beforeupload', function (event, item) {
      console.info('Before upload', item);

      switch (item.field) {
        case 'image':
          $scope.header.uploadingField = 'image';
          item.formData.push({field: 'image'});
          break;

        case 'logo_image':
          $scope.header.uploadingField = 'logo_image';
          item.formData.push({field: 'logo_image'});
          break;

        default:
          break;
      }
    });

    // On file successfully uploaded
    uploader.bind('success', function (event, xhr, item, response) {
      console.info('Success', xhr, item, response);

      // This will make that the existing file gets deleted from the server's file system, if someone uploads another file using the 'file' input element, instead of using the drop zone, so as to not leave orphan files behind
      $scope.remove(item.field);

      $scope.header[item.field] = response.imageFileName;
      $scope.header[item.field + '_url'] = response.imageUrl;

      $scope.header.uploadingField = null;

      notification.success('Image uploaded');
    });

    // On upload error
    uploader.bind('error', function (event, xhr, item, response) {
      console.info('Error', xhr, item, response);
    });

    // On file upload complete (whether successful or not)
    uploader.bind('complete', function (event, xhr, item, response) {
      console.info('Complete', xhr, item, response);
    });

    // On upload queue progress
    uploader.bind('progressall', function (event, progress) {
      console.info('Total progress: ' + progress);
    });

    // todo: this would be used instead of just linking to the listing URL in the view, in order to provide a hook for cleanup, etc. such as removal of any uploaded images (as otherwise such unused, unreferenced images would be a waste)
    $scope.cancel = function () {

    }

    // todo: this should also remove the image from the server as the images would keep piling in the directory even if not being used
    $scope.remove = function (field) {
      var fileName = $scope.header[field];
      civiApi.post('SimpleMailHeader', {field: field, fileName: fileName}, 'deleteimage')
        .success(function(response) {
          if (response.is_error) {
            notification.error('Failed to delete the image', response.error_message);
          } else {
            notification.success('Image deleted successfully');
          }
        });

      $scope.header[field] = $scope.header[field + '_url'] = undefined;
    };

    // Populate the fields when editing an existing header
    if ($routeParams.headerId) {
      civiApi.get($scope.constants.ENTITY_NAME, {id: $routeParams.headerId})
        .success(function (response) {
          log.createLog('Header retrieved', response);

          if (header.is_error) {
            notification.error('Failed to retrieve the header', response.error_message);
            $scope.redirectToListing();
          } else {

            $scope.header = response.values[0];

            civiApi.getValue('Setting', {name: 'imageUploadURL'})
              .success(function (response) {
                log.createLog('Setting retrieved', response);

                if (response.is_error) {
                  notification.error('Failed to retrieve image upload URL setting', response.error_message);
                } else {
                  var baseUrl = response.result + 'simple-mail';

                  if ($scope.header.image) {
                    $scope.header.image_url = baseUrl + '/image/' + $scope.header.image;
                  }
                  if ($scope.header.logo_image) {
                    $scope.header.logo_image_url = baseUrl + '/logo_image/' + $scope.header.logo_image;
                  }
                }
              });
          }
        });
    }

    /**
     * Redirect to the listing of headers
     */
    $scope.redirectToListing = function () {
      $location.path('/headers');
    };

    $scope.validateHeader = function (form) {
      var errors = false;

      if (form.$error.required) {
        errors = true;
      }

      return errors;
    };

    /**
     * Create or update header depending upon whether the header was loaded from the database or was being added as new
     */
    $scope.createOrUpdateHeader = function (form) {
      $scope.header.submitted = true;

      if ($scope.validateHeader(form)) {
        notification.error('Please fix the errors on the page');
        return;
      }

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