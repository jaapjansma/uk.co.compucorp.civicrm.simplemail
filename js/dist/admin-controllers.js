(function () {
  "use strict";

  /**
   * Controllers for the admin section of the app
   *
   * @type {*|module}
   */
  var controllers = angular.module('simpleMail.adminApp.controllers', []);

  controllers.config(['$httpProvider', function ($httpProvider) {
    // This is needed (Utils/Rest.php::ajax()) for CiviCRM to treat the request as genuine
    $httpProvider.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
  }]);

  /**
   * Admin listing of headers
   */
  controllers.controller('HeadersAdminController', [
    '$scope', '$http', 'civiApiServices', 'loggingServices', 'notificationServices',
    function ($scope, $http, civiApi, log, notification) {
      $scope.constants = {
        ENTITY_NAME: 'SimpleMailHeader'
      };

      $scope.headers = {};

      // TODO (robin): rename the argument in all success/error to response to stay consistent and predictable
      civiApi.get($scope.constants.ENTITY_NAME)
        .success(function (headers) {
          // TODO (robin): may be just save the actual headers array in headers, so that getHeaders won't be needed and make the behaviour more predictable
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
   * Detail page of a header
   */
  controllers.controller('HeaderAdminController', [
    '$scope', '$http', '$q', '$fileUploader', 'civiApiServices', 'loggingServices', 'notificationServices', '$routeParams', '$location', 'utilityServices',
    function ($scope, $http, $q, $fileUploader, civiApi, log, notification, $routeParams, $location, utils) {
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

      uploader.bind('beforeupload', function
        (event, item) {
        console.info('Before upload', item)
        ;

        switch (item.field) {
          case 'image':
            $scope.header.uploadingField = 'image';
            item.formData.push({field: 'image'});
            break;

          case 'logo_image':
            $scope.header.
              uploadingField = 'logo_image';
            item.
              formData.push({field: 'logo_image'});
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

      // TODO (robin): this would be used instead of just linking to the listing URL in the view, in order to provide a hook for cleanup, etc. such as removal of any uploaded images (as otherwise such unused, unreferenced images would be a waste)
      $scope.cancel = function () {

      };

      $scope.remove = function (field) {
        var fileName = $scope.header[field];

        if (fileName) {
          civiApi.post('SimpleMailHeader', {field: field, fileName: fileName}, 'deleteimage')
            .success(function (response) {
              if (response.is_error) {
                notification.error('Failed to delete the image', response.error_message);
              } else {
                notification.success('Image deleted successfully');
              }
            });
        }

        $scope.header[field] = $scope.header[field + '_url'] = undefined;
      };

      // Populate the fields when editing an existing header
      if ($routeParams.headerId) {
        civiApi.get($scope.constants.ENTITY_NAME, {id: $routeParams.headerId})
          .then(function (response) {
            log.createLog('Header retrieved', response);

            if (response.data.is_error) return $q.reject(response);

            $scope.header = response.data.values[0];
            return true;
          })
          .then(function (response) {
            var promises = [];

            // Get filters
            var filterPromise = civiApi.get('SimpleMailHeaderFilter', {header_id: $scope.header.id})
              .then(function (response) {
                console.log('Filters retrieved', response);
                if (response.data.is_error) return $q.reject(response);

                $scope.header.filterIds = [];

                angular.forEach(response.data.values, function (value, key) {
                  $scope.header.filterIds.push(value.entity_id);
                });
              });

            // Calculate image URLs for previewing images
            // TODO (robin): Use the newer GetImageUrl API action on SimpleMailHeader entity instead
            var imagePromise = civiApi.getValue('Setting', {name: 'imageUploadURL'})
              .then(function (response) {
                log.createLog('Setting retrieved', response);

                if (response.data.is_error) return $q.reject(response);

                var baseUrl = response.data.result + 'simple-mail';

                if ($scope.header.image) {
                  $scope.header.image_url = baseUrl + '/image/' + $scope.header.image;
                }
                if ($scope.header.logo_image) {
                  $scope.header.logo_image_url = baseUrl + '/logo_image/' + $scope.header.logo_image;
                }
              });

            promises.push(filterPromise);
            promises.push(imagePromise);

            // Promises here are handled this way, instead of chaining them, in order to allow sending API calls in a
            // non-blocking way, so as to improve performance, and also supported by the fact that retrieving filters
            // and image URLs are not sequential operations.
            return $q.all(promises);
          })
          // Error
          .catch(function (response) {
            notification.error('Failed to retrieve the header', response.data.error_message);
            $scope.redirectToListing();
          });
      }

      // Get the list of mailing recipient groups
      civiApi.getValue('OptionGroup', {name: 'sm_header_filter_options', return: 'id'})
        .then(function (response) {
          log.createLog('Option Group ID retrieved for filters', response);
          if (response.data.is_error) return $q.reject(response);

          return +response.data.result;
        })
        .then(function (response) {
          console.log('Option Group ID', response);

          return civiApi.get('OptionValue', {option_group_id: response})
        })
        .then(function (response) {
          console.log('Option values retrieved', response);

          $scope.filters = response.data.values;
        })
        .catch(function (response) {
          console.log('Failed to retrieve filters', response);
        });


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
            // Save or update header
            .then(function (response) {
              log.createLog('Update header response', response);

              if (response.data.is_error) $q.reject(response);

              notification.success('Header updated');

            })
            // Save or update filters
            .then(function (response) {
              return civiApi.get('SimpleMailHeaderFilter', {header_id: +$scope.header.id})
                .then(function (response) {
                  console.log('Filters retrieved', response);

                  if (response.data.is_error) return $q.reject(response);

                  var oldFilterIds = [];
                  var newFilterIds = $scope.header.filterIds;

                  angular.forEach(response.data.values, function (value, key) {
                    oldFilterIds.push(value.entity_id);
                  });

                  console.log('Old filters', oldFilterIds);
                  console.log('New filters', newFilterIds);

                  var removed = utils.arrayDiff(oldFilterIds, newFilterIds);
                  var added = utils.arrayDiff(newFilterIds, oldFilterIds);

                  console.log('Removed filters', removed);
                  console.log('Added filters', added);

                  return {added: added, removed: removed, filters: response};
                })
                // Add new filters
                .then(function (filters) {
                  var promises = [];

                  for (var i = 0, endAdded = filters.added.length; i < endAdded; i++) {
                    var data = {
                      header_id: $scope.header.id,
                      entity_table: 'civicrm_option_value',
                      entity_id: +filters.added[i]
                    };

                    var promise = civiApi.create('SimpleMailHeaderFilter', data)
                      .then(function (response) {
                        if (response.data.is_error) return $q.reject(response);

                        console.log('Filter added', response);
                        return true;
                      })
                      .catch(function (response) {
                        return $q.reject(response);
                      });

                    promises.push(promise);
                  }

                  return $q.all(promises)
                    .then(function (response) {
                      return filters;
                    })
                    .catch(function (response) {
                      return $q.reject(response);
                    });

                })
                // Delete removed filters
                .then(function (filters) {
                  var promises = [];

                  for (var i = 0, endRemoved = filters.removed.length; i < endRemoved; i++) {
                    var removeId = null;

                    angular.forEach(filters.filters.data.values, function (value, key) {
                      if (value.entity_id === filters.removed[i]) removeId = +value.id;
                    });

                    var promise = civiApi.remove('SimpleMailHeaderFilter', {id: removeId})
                      .then(function (response) {
                        if (response.data.is_error) return $q.reject(response);

                        console.log('Filter deleted', response);
                        return true;
                      })
                      .catch(function (response) {
                        return $q.reject(response);
                      });

                    promises.push(promise);
                  }

                  return $q.all(promises);
                })
                .catch(function (response) {
                  return $q.reject(response);
                });
            })
            .then($scope.redirectToListing)
            .catch(function (response) {
              notification.error('Failed to update header', response.data.error_message);
            });
        }
        // TODO (robin): Save filters for new headers as well - may be refactor the logic from above into a controller method
        else {
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
   * Admin list and inline editing of messages
   */
  controllers.controller('MessagesAdminController', [
    '$scope', '$http', 'civiApiServices', 'loggingServices', 'notificationServices',
    function ($scope, $http, civiApi, log, notification) {

      $scope.$on('$viewContentLoaded', function () {
        cj('#crm-container textarea.huge:not(.textarea-processed), #crm-container textarea.form-textarea:not(.textarea-processed)').each(function () {
          var self = cj(this);
          if (self.parents('div.civicrm-drupal-wysiwyg').length == 0)
            self.TextAreaResizer();
        });
      });

      $scope.constants = {
        ENTITY_NAME: 'SimpleMailMessage'
      };

      $scope.messages = {};
      $scope.newMessage = {
        //      editing: true
      };

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

      // TODO (robin): simplify this - too many similarly named functions are confusing - remove all but the essential ones
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

            // TODO (robin): this could be refactored out into the civiApiServices, so that we only need to send the callback functions for success and failure to it from here
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
})();