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
    '$scope', '$http', '$q', 'civiApiServices', 'loggingServices', 'notificationServices',
    function ($scope, $http, $q, civiApi, log, notification) {
      $scope.constants = {
        ENTITY_NAME: 'SimpleMailHeader'
      };

      $scope.headers = {};

      // Get all headers
      civiApi.get($scope.constants.ENTITY_NAME)
        .then(function (response) {
          if (response.data.is_error) return $q.reject(response);

          $scope.headers = response.data.values;
          log.createLog('Headers received', $scope.headers);

          return true;
        })
        .catch(function (response) {
          log.createLog('Failed to retrieve headers', response);
        });

      /**
       * Delete a header
       *
       * Note: The API action for delete would also delete the corresponding images and filters
       *
       * @param index
       */
      $scope.deleteHeader = function (index) {
        var header = $scope.headers[index];

        civiApi.remove($scope.constants.ENTITY_NAME, header)
          .then(function (response) {
            log.createLog('Delete message response', response);

            if (response.data.is_error) return $q.reject(response);

            return true;
          })
          .then(function () {
            // Remove the header from the listing upon successful deletion
            $scope.headers.splice(index, 1);
            notification.success('Header deleted');
          })
          .catch(function (response) {
            notification.error('Failed to delete header', response.data.error_message);
            $scope.errorMessage = response.data.error_message;
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

      $scope.cancel = function () {
        // Delete any images uploaded in case a new header was being added but cancelled without saving
        if (!$scope.header.id) {
          // Delete header image if one was uploaded
          if ($scope.header.image) {
            $scope.remove('image');
          }

          // Delete logo image if one was uploaded
          if ($scope.header.logo_image) {
            $scope.remove('logo_image');
          }
        }

        $scope.redirectToListing();
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
    '$scope', '$http', '$q', 'civiApiServices', 'loggingServices', 'notificationServices',
    function ($scope, $http, $q, civiApi, log, notification) {

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

      $scope.messages = [];
      $scope.newMessage = {'is_active': '1'};

      civiApi.get($scope.constants.ENTITY_NAME)
        .then(function (response) {
          if (response.data.is_error) return $q.reject(response);

          $scope.messages = response.data.values;
          log.createLog('Messages retrieved', $scope.messages);

          return true;
        })
        .catch(function (response) {
          log.createLog('Failed to retrieve messages', response);
        });

      /**
       * Clear new message form
       */
      $scope.clearNewMessageForm = function () {
        $scope.newMessage = {};
      };

      /**
       * Enable showing form for new message
       */
      $scope.enableAddingMessage = function () {
        $scope.newMessage.editing = true;
      };

      /**
       * Disable showing form for new message
       */
      $scope.disableAddingMessage = function () {
        $scope.newMessage.editing = false;
        $scope.clearNewMessageForm();
      };

      /**
       * Enable inline editing of a message
       *
       * @param index
       */
      $scope.enableEditingMessage = function (index) {
        $scope.messages[index].editing = true;
      };

      /**
       * Disable inline editing of a message
       *
       * @param index
       */
      $scope.disableEditingMessage = function (index) {
        $scope.messages[index].editing = false;
      };

      /**
       * Create a new message
       */
      $scope.createMessage = function () {
        var message = $scope.newMessage;

        // Save the new message
        civiApi.create($scope.constants.ENTITY_NAME, message)
          .then(function (response) {
            log.createLog('Create message response', response);

            if (response.data.is_error) return $q.reject(response);

            notification.success('Message added');

            return response.data.values[0];
          })
          // Add the newly saved message to the listing
          .then(function (message) {
            $scope.messages.push(message);
            $scope.disableAddingMessage();
          })
          .catch(function (response) {
            log.createLog('Failed to add message', response.data.error_message);
            $scope.errorMessage = response.data.error_message;
          });
      };

      /**
       * Update a message
       *
       * @param index
       */
      $scope.updateMessage = function (index) {
//        var message = $scope.getSanitisedMessage(index);
        var message = $scope.messages[index];

        civiApi.update($scope.constants.ENTITY_NAME, message)
          .then(function (response) {
            log.createLog('Update message response', response);

            if (response.is_error) return $q.reject(response);

            notification.success('Message updated');

            return true;
          })
          .then(function () {
            $scope.disableEditingMessage(index);
          })
          .catch(function (response) {
            notification.error('Failed to update message', response.data.error_message);
            $scope.errorMessage = response.data.error_message;
          });
      };

      /**
       * Delete a message
       *
       * @param index
       */
      $scope.deleteMessage = function (index) {
        var message = $scope.messages[index];

        // Send API call to remove the message in DB
        civiApi.remove($scope.constants.ENTITY_NAME, message)
          .then(function (response) {
            console.log(response);

            if (response.is_error) return $q.reject(response);

            notification.success('Message deleted');

            return true;
          })
          // Remove the message from the listing
          .then(function () {
            $scope.messages.splice(index, 1);
          })
          .catch(function (response) {
            console.log('Failed to update the record:', response.error_message);
            $scope.errorMessage = response.error_message;
          });
      };
    }
  ]);
})();