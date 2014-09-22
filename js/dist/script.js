(function () {
  "use strict";

  /**
   * Simple Mail admin app
   *
   * @name simpleMail.adminApp
   * @type {ng.IModule}
   */
  var app = angular.module('simpleMail.adminApp', [
    'ngRoute',
    'ngAnimate',
    'ui.select',
    'simpleMail.adminApp.controllers',
    'simpleMail.services',
    'simpleMail.directives',
    'simpleMail.constants',
    'angularFileUpload'
  ]);

  app.config(['$routeProvider', 'paths',
    function ($routeProvider, paths) {
      $routeProvider
        // TODO (robin): add resolvers to listing controllers in order to not render view until API has returned data
        .when('/headers', {
          templateUrl: paths.PARTIALS_DIR() + '/admin/listHeaders.html',
          controller: 'HeadersAdminController'
        })
        .when('/headers/:headerId/edit', {
          templateUrl: paths.PARTIALS_DIR() + '/admin/editHeader.html',
          controller: 'HeaderAdminController'
        })
        .when('/headers/new', {
          templateUrl: paths.PARTIALS_DIR() + '/admin/editHeader.html',
          controller: 'HeaderAdminController'
        })
        .when('/messages', {
          templateUrl: paths.PARTIALS_DIR() + '/admin/listMessages.html',
          controller: 'MessagesAdminController'
        })
        .otherwise({
          redirectTo: '/'
        });
    }
  ]);
})();

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
    '$scope', '$http', '$q', 'CiviApiFactory', 'loggingServices', 'NotificationFactory',
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
    '$scope', '$http', '$q', '$fileUploader', 'CiviApiFactory', 'loggingServices', 'NotificationFactory', '$routeParams', '$location', '$filter',
    function ($scope, $http, $q, $fileUploader, civiApi, log, notification, $routeParams, $location, $filter) {
      $scope.header = {};
      $scope.models = {};
      $scope.filters = [];

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
        console.info('Before upload', item);

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

        // This is to manually delete the existing file from the server's file system, if someone uploads another file
        // using the 'file' input element instead of the drop zone, so as to not leave orphan files behind
        $scope.remove(item.field);

        $scope.header[item.field] = response.values[0].imageFileName;
        $scope.header[item.field + '_url'] = response.values[0].imageUrl;

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
            return civiApi.get('SimpleMailHeaderFilter', {header_id: $scope.header.id})
              .then(function (response) {
                console.log('Filters retrieved', response);
                if (response.data.is_error) return $q.reject(response);

                $scope.header.filterIds = [];

                angular.forEach(response.data.values, function (value, key) {
                  $scope.header.filterIds.push(value.entity_id);
                });

                return true;
              });
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

          return civiApi.get('OptionValue', {option_group_id: response, is_active: '1'})
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

                  var removed = $filter('arrayDiff')(oldFilterIds, newFilterIds);
                  var added = $filter('arrayDiff')(newFilterIds, oldFilterIds);

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
    '$scope', '$http', '$q', 'CiviApiFactory', 'loggingServices', 'NotificationFactory',
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
(function () {
  "use strict";

  /**
   * Simple Mail app
   *
   * @type {*}
   */
  var app = angular.module('simpleMail.app', [
    'ngRoute',
    'ngAnimate',
    'ui.select',
    'ngQuickDate',
    'simpleMail.app.controllers',
    'simpleMail.services',
    'simpleMail.directives',
    'simpleMail.constants',
    'simpleMail.filters'
  ]);

  app.config(['$routeProvider', 'paths', 'ngQuickDateDefaultsProvider', '$provide',
    function ($routeProvider, paths, ngQuickDate, $provide) {
      ngQuickDate.set({        
//        closeButtonHtml: "<i class='fa fa-times'></i>",
//        buttonIconHtml: "<i class='fa fa-clock-o'></i>",
//        nextLinkHtml: "<i class='fa fa-chevron-right'></i>",
//        prevLinkHtml: "<i class='fa fa-chevron-left'></i>",
        // Take advantage of Sugar.js date parsing
        parseDateFunction: function (str) {
         var d = Date.create(str);
          return d.isValid() ? d : null;
        }
      });

      $routeProvider
        // TODO (robin): add resolvers to listing controllers in order to not render view until API has returned data
        .when('/mailings', {
          templateUrl: paths.PARTIALS_DIR() + '/wizard/listMailings.html',
          controller: 'MailingsController'
        })
        .when('/mailings/:mailingId', {
          redirectTo: '/mailings/:mailingId/steps/1'
        })
        .when('/mailings/:mailingId/steps', {
          redirectTo: '/mailings/:mailingId/steps/1'
        })
        .when('/mailings/:mailingId/steps/1', {
          templateUrl: paths.PARTIALS_DIR() + '/wizard/steps/steps.html',
          controller: 'CreateMailingController'
        })
        .when('/mailings/:mailingId/steps/2', {
          templateUrl: paths.PARTIALS_DIR() + '/wizard/steps/steps.html',
          controller: 'ComposeMailingController'
        })
        .when('/steps/2', {
          templateUrl: paths.PARTIALS_DIR() + '/wizard/steps/steps.html',
          controller: 'ComposeMailingController'
        })
        .when('/mailings/:mailingId/steps/3', {
          templateUrl: paths.PARTIALS_DIR() + '/wizard/steps/steps.html',
          controller: 'TestMailingController'
        })
        .when('/mailings/:mailingId/steps/4', {
          templateUrl: paths.PARTIALS_DIR() + '/wizard/steps/steps.html',
          controller: 'ScheduleAndSendController'
        })
        .otherwise({
          redirectTo: '/mailings'
        });

      $provide.decorator('$log', ['$delegate', 'config',
        function ($delegate, config) {
          var emptyFn = function () {
          };

          if (!config.LOGGING_ENABLED) {
            $delegate.log = $delegate.info = $delegate.warning = $delegate.error = $delegate.debug = emptyFn;
          } else {
            if (!config.LOG_LOG) $delegate.log = emptyFn;
            if (!config.LOG_INFO) $delegate.info = emptyFn;
            if (!config.LOG_WARNING) $delegate.warning = emptyFn;
            if (!config.LOG_ERROR) $delegate.error = emptyFn;
            if (!config.LOG_DEBUG) $delegate.debug = emptyFn;
          }

          /** Could decorate $log like in the comments below */
          //var log = $delegate.log, info = $delegate.info, warning = $delegate.warning, error = $delegate.error, debug = $delegate.debug;
          //$delegate.debug = function () {
          //  var args = [].slice.call(arguments);
          //  args[0] = 'DECORATED: ' + args[0];
          //  debug.apply(null, args);
          //};

          return $delegate;
        }
      ]);
    }
  ]);
})();

(function () {
  "use strict";

  var constants = angular.module('simpleMail.constants', []);

  constants.constant('paths', {
    EXT_DIR: '/sites/all/extensions/uk.co.compucorp.civicrm.simplemail',

    /**
     * TODO (robin): This could potentially be refactor so that the interface for using this could become more consistent and be like constants.TEMPLATE_DIR, instead of constants.TEMPLATE_DIR() - this can be achieved by returning a reference to a function. e.g. TEMPLATE_DIR: _getTemplatesDir()
     * @return {string}
     */
    TEMPLATES_DIR: function () {
      return this.EXT_DIR + '/js/dist/templates'
    },
    /**
     * @return {string}
     */
    PARTIALS_DIR: function () {
      return this.EXT_DIR + '/partials'
    }
  });

  constants.constant('config', {
    /**
     * Disable this to globally disable ALL methods of $log service within the application
     */
    LOGGING_ENABLED: true,

    // Fine grained control over $log methods
    LOG_LOG: true,
    LOG_INFO: true,
    LOG_WARNING: true,
    LOG_ERROR: true,
    LOG_DEBUG: true
  });
})();
(function () {
  "use strict";

  /**
   * @type {ng.IModule}
   *
   * @description Controllers for the mailing wizard section of the app
   */
  var controllers = angular.module('simpleMail.app.controllers', []);

  controllers.config(['$httpProvider', function ($httpProvider) {
    // This is needed (Utils/Rest.php::ajax()) for CiviCRM to treat the request as genuine
    $httpProvider.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
  }]);

  /**
   * @ngdoc controller
   * @name MailingsController
   * @requires MailingsListingFactory
   * @type {*[]}
   */
  var MailingsController = ['$scope', '$http', '$q', 'CiviApiFactory', 'loggingServices', 'NotificationFactory', '$filter', 'MailingsListingFactory', '$log',

    /**
     *
     * @param $scope
     * @param $http
     * @param $q
     * @param civiApi
     * @param log
     * @param notification
     * @param $filter
     * @param {MailingsListingFactory} MailingsListing
     */
      function ($scope, $http, $q, civiApi, log, notification, $filter, MailingsListing, $log) {
      $scope.constants = {
        ENTITY_NAME: 'SimpleMail',
        DRAFT: 'Not Scheduled',
        SCHEDULED: 'Scheduled',
        SENT: 'Complete',
        CANCELLED: 'Canceled'
      };

      $scope.showFilters = true;

      $scope.models = {};
      $scope.models.mailingsLoaded = false;

      $scope.mailingFilters = {
        status: {},
        creator: 'all'
      };

      $scope.filteredMailings = [];

      $scope.mailingFilters.status[$scope.constants.DRAFT] = true;
      $scope.mailingFilters.status[$scope.constants.SCHEDULED] = true;
      $scope.mailingFilters.status[$scope.constants.SENT] = true;
      $scope.mailingFilters.status[$scope.constants.CANCELLED] = true;

      MailingsListing.init()
        .then(function () {
          $scope.mailings = MailingsListing.getMailings();
          $scope.userId = MailingsListing.getUserId();

          $scope.models.creators = MailingsListing.getCreators();
          $scope.models.creators.unshift({id: 'all', 'name': 'All'});

          // The below will cause to show mailings for all users if the current user never created any mailing;
          // otherwise nothing would be shown, potentially confusing the user that mailings are missing/lost
          var currentUserInCreators = $filter('filter')($scope.models.creators, {id: $scope.userId});
          $scope.mailingFilters.creator = currentUserInCreators.length ? $scope.userId : 'all';
        })
        .finally(function () {
          $scope.models.mailingsLoaded = true;
        });

      /**
       * @name deleteMailing
       * @description Delete a mailing given by its index in the mailings array
       *
       * @param mailing
       */
      $scope.deleteMailing = function (mailing) {
        if (!mailing.hasOwnProperty('_internal')) mailing._internal = {};

        // Don't do anything if the button was pressed already and waiting for server response
        if (mailing._internal.deleteEnabled === false) {
          return;
        }

        mailing._internal.deleteEnabled = false;

        MailingsListing.deleteMailing(mailing)
          .finally(function () {
            mailing._internal.deleteEnabled = true;
          });
      };

      /**
       * Cancel scheduled mass mailing
       *
       * @param mailing
       */
      $scope.cancelMailing = function (mailing) {
        if (!mailing.hasOwnProperty('_internal')) mailing._internal = {};

        // Don't do anything if the button was pressed already and waiting for server response
        if (mailing._internal.cancelEnabled === false) {
          return;
        }

        mailing._internal.cancelEnabled = false;

        var index = $scope.mailings.indexOf(mailing);

        if (index !== -1) {
          civiApi.post('SimpleMail', mailing, 'cancelmassemail')
            .then(function (response) {
              if (response.data.is_error) return $q.reject(response);

              notification.success('Mailing cancelled');
              mailing.status = 'Canceled';
              mailing._internal.cancelEnabled = true;
            })
            .catch(function (response) {
              notification.error('Failed to cancel the mailing');
              console.log('Failed to cancel the mailing', response);
              mailing._internal.cancelEnabled = true;
            })
        }
      };

      /**
       * Create a duplicate of a mailing
       *
       * @param mailing
       */
      $scope.duplicateMailing = function (mailing) {
        var index = $scope.mailings.indexOf(mailing);

        // TODO (robin): Ugly hack - fix this when refactoring model manipulations to services
        $scope.duplicatedMailing = mailing;

        if (index !== -1) {
          civiApi.post('SimpleMail', mailing, 'duplicatemassemail')
            .then(function (response) {
              if (response.data.is_error) return $q.reject(response);
              notification.success('Mailing duplicated');

              civiApi.get('SimpleMail', {id: response.data.values[0].id})
                .then(function (response) {
                  if (response.data.is_error) return $q.reject(response);

                  $scope.mailings.push(response.data.values[0]);
                })
                .catch(function (response) {
                  return $q.reject('Failed to retrieve the newly duplicated mailing', response);
                })
            })
            .catch(function (response) {
              notification.error('Failed to duplicate the mailing', response.data.error_message);
              console.log('Failed to duplicate the mailing', response);
            });
        }
      }
    }
  ];

  angular.module('simpleMail.app.controllers')
    .controller('MailingsController', MailingsController);

  ///**
  // * @ngDoc controller
  // * @name MailingsController
  // *
  // * @description Listing of mailing wizards
  // */
  //controllers.controller('MailingsController', [
  //  '$scope', '$http', '$q', 'CiviApiFactory', 'loggingServices', 'NotificationFactory', '$filter', 'MailingsListingFactory',
  //  function ($scope, $http, $q, civiApi, log, notification, $filter, MailingsListingFactory) {
  //
  //    $scope.constants = {
  //      ENTITY_NAME: 'SimpleMail',
  //      DRAFT: 'Not Scheduled',
  //      SCHEDULED: 'Scheduled',
  //      SENT: 'Complete',
  //      CANCELLED: 'Canceled'
  //    };
  //
  //    $scope.showFilters = true;
  //
  //    $scope.models = {};
  //    $scope.models.mailingsLoaded = false;
  //
  //    $scope.mailingFilters = {
  //      status: {},
  //      creator: 'all'
  //    };
  //
  //    $scope.filteredMailings = [];
  //
  //    $scope.mailingFilters.status[$scope.constants.DRAFT] = true;
  //    $scope.mailingFilters.status[$scope.constants.SCHEDULED] = true;
  //    $scope.mailingFilters.status[$scope.constants.SENT] = true;
  //    $scope.mailingFilters.status[$scope.constants.CANCELLED] = true;
  //
  //    MailingsListingFactory.get()
  //      .then(function () {
  //        $scope.mailings = MailingsListingFactory.mailings;
  //      });
  //
  //    civiApi.get($scope.constants.ENTITY_NAME)
  //      .then(function (response) {
  //        log.createLog('Mailings retrieved', response);
  //        $scope.mailings = response.data.values;
  //
  //        var creators = $filter('extractColumn')($scope.mailings, {id: 'created_id', name: 'sort_name'});
  //        $scope.models.creators = $filter('unique')(creators, 'id');
  //        $scope.models.creators.unshift({id: 'all', 'name': 'All'});
  //
  //        // The below will cause to show mailings for all users if the current user never created any mailing;
  //        // otherwise nothing would be shown, potentially confusing the user that mailings are missing/lost
  //        var currentUserInCreators = $filter('filter')($scope.models.creators, {id: response.data.userId});
  //        $scope.mailingFilters.creator = currentUserInCreators.length ? response.data.userId : 'all';
  //      })
  //      .finally(function() {
  //        $scope.models.mailingsLoaded = true;
  //      })
  //      .catch(function (response) {
  //        console.log('Failed to retrieve mailing', response);
  //      });
  //
  //    /**
  //     * @name deleteMailing
  //     * @description Delete a mailing given by its index in the mailings array
  //     *
  //     * @param mailing
  //     */
  //    $scope.deleteMailing = function (mailing) {
  //      if (!mailing.hasOwnProperty('_internal')) mailing._internal = {};
  //
  //      // Don't do anything if the button was pressed already and waiting for server response
  //      if (mailing._internal.deleteEnabled === false) {
  //        return;
  //      }
  //
  //      mailing._internal.deleteEnabled = false;
  //
  //      var index = $scope.mailings.indexOf(mailing);
  //
  //      if (index !== -1) {
  //        civiApi.remove('SimpleMail', mailing)
  //          .then(function (response) {
  //            if (response.data.is_error) return $q.reject(response);
  //
  //            notification.success('Mailing deleted');
  //             $scope.mailings.splice(index, 1);
  //            mailing._internal.deleteEnabled = true;
  //          })
  //          .catch(function (response) {
  //            notification.error('Failed to delete the mailing', response.data.error_message);
  //            console.log('Failed to delete the mailing', response);
  //            mailing._internal.deleteEnabled = true;
  //          });
  //      }
  //    };
  //
  //    /**
  //     * Cancel scheduled mass mailing
  //     *
  //     * @param mailing
  //     */
  //    $scope.cancelMailing = function (mailing) {
  //      if (!mailing.hasOwnProperty('_internal')) mailing._internal = {};
  //
  //      // Don't do anything if the button was pressed already and waiting for server response
  //      if (mailing._internal.cancelEnabled === false) {
  //        return;
  //      }
  //
  //      mailing._internal.cancelEnabled = false;
  //
  //      var index = $scope.mailings.indexOf(mailing);
  //
  //      if (index !== -1) {
  //        civiApi.post('SimpleMail', mailing, 'cancelmassemail')
  //          .then(function (response) {
  //            if (response.data.is_error) return $q.reject(response);
  //
  //            notification.success('Mailing cancelled');
  //            mailing.status = 'Canceled';
  //            mailing._internal.cancelEnabled = true;
  //          })
  //          .catch(function (response) {
  //            notification.error('Failed to cancel the mailing');
  //            console.log('Failed to cancel the mailing', response);
  //            mailing._internal.cancelEnabled = true;
  //          })
  //      }
  //    };
  //  }
  //]);

  /**
   * Step 1 of the wizard
   */
  controllers.controller('CreateMailingController', [
    '$scope', '$http', '$routeParams', '$location', '$filter', 'CiviApiFactory', 'loggingServices', 'NotificationFactory', 'paths', 'mailingServices',
    function ($scope, $http, $routeParams, $location, $filter, civiApi, log, notification, paths, mailing) {
      // Initialise the step
      mailing.initStep({step: 1, scope: $scope});

      $scope.constants = {
        ENTITY_NAME: 'Group'
      };

      // Initialise empty mailing
      $scope.mailing = {};
      $scope.groups = [];

      mailing.getMailing()
        .then(function (response) {
          $scope.mailing = response;
        });

      // Get the list of mailing recipient groups
      civiApi.get($scope.constants.ENTITY_NAME)
        .then(function (response) {
          log.createLog('Groups retrieved', response);
          $scope.groups = $filter('filter')(response.values, {is_hidden: 0});
        });
    }
  ]);

  /**
   * Step 2 of the wizard
   */
  controllers.controller('ComposeMailingController', [
    '$scope', '$timeout', '$http', '$routeParams', '$location', '$q', 'CiviApiFactory', 'loggingServices', 'NotificationFactory', 'paths', 'mailingServices', 'itemFromCollectionFilter',
    function ($scope, $timeout, $http, $routeParams, $location, $q, civiApi, log, notification, paths, mailing, itemFromCollection) {
      $scope.models = {
        selectedMessage: {},
        headersLoaded: false
      };

      $scope.headers = $scope.messages = [];

      // Initialise the step
      mailing.initStep({step: 2, scope: $scope});

      $scope.constants = {
        ENTITY_NAME: 'Group'
      };

      // Initialise empty mailing
      $scope.mailing = {};

      $scope.$watch('mailing.message_id', function (newVal, oldVal) {
        if (oldVal !== newVal) {
          $scope.mailing.message_id = newVal;

          var item = itemFromCollection($scope.messages, 'id', $scope.mailing.message_id);
          var selectedMessage = item.item;

          if (selectedMessage !== null && selectedMessage.hasOwnProperty('text')) {
            $scope.models.selectedMessage.text = selectedMessage.text;
          }
        }
      });

      // Get from emails
      civiApi.getValue('OptionGroup', {name: 'from_email_address', return: 'id'})
        .then(function (response) {
          log.createLog('From-email address option response', response);

          if (response.data.is_error) return $q.reject(response);

          return response.data.result;
        })
        // Get the option values
        .then(function (groupId) {
          return civiApi.get('OptionValue', {option_group_id: groupId})
            .then(function (response) {
              log.createLog('From-email address group options response', response);
              $scope.fromEmailOptionValues = response.data.values;
            })
        })
        .catch(function () {
          notification.error('Failed to retrieve from-email addresses');
        });

      // Get the headers
      civiApi.get('SimpleMailHeader', {withFilters: true}, 'get')
        .then(function (response) {
          /*
           * Get the list of filters from option value table
           * Selecting a filter from the drop down would retrieve headers that have this filter applied
           * Show images in each header for the selected filter
           * Selecting an image would set the header's ID on $scope.mailing.header_id
           */
          console.log('Headers retrieved', response);

          if (response.data.is_error) return $q.reject(response);

          $scope.headers = response.data.values;
        })
        .then(function () {
          $scope.models.headersLoaded = true;
        })
        .catch(function (response) {
          console.log('Failed to retrieve headers', response);
        });

      // Get the filter options
      civiApi.getValue('OptionGroup', {name: 'sm_header_filter_options', return: 'id'})
        .then(function (response) {
          if (response.data.is_error) return $q.reject(response);

          console.log('Option group for filters retrieved', response);
          return +response.data.result;
        })
        .then(function (groupId) {
          civiApi.get('OptionValue', {option_group_id: groupId, is_active: '1'})
            .then(function (response) {
              if (response.data.is_error) return $q.reject(response);

              console.log('Filter values retrieved', response);
              $scope.filters = response.data.values;
              $scope.filters.unshift({id: "all", label: "All"});

              return true;
            });
        })
        .catch(function (response) {
          console.log('Failed to retrieve filter values', response);
        });

      // Get the current mailing
      mailing.getMailing()
        .then(function (response) {
          $scope.mailing = response;
        })
        .then(function (response) {
          // Get the messages - note: this is within 'then' as otherwise it is possible that messages are not retrieved
          // the mailing is, thereby making the selectedMessageText filter fail to populate the message text reliably
          return civiApi.get('SimpleMailMessage', {is_active: 1}).
            success(function (response) {
              log.createLog('Messages retrieved', response);
              $scope.messages = response.values;

              var item = itemFromCollection($scope.messages, 'id', $scope.mailing.message_id);
              var selectedMessage = item.item;

              if (selectedMessage !== null && selectedMessage.hasOwnProperty('text')) {
                $scope.models.selectedMessage.text = selectedMessage.text;
              }
            })
        })
        .catch(function (response) {
          console.log('Failed to retrieve the mailing', response);
        });
    }
  ]);

  /**
   * Step 3
   */
  controllers.controller('TestMailingController', [
    '$scope', '$http', '$routeParams', '$location', '$filter', 'CiviApiFactory', 'loggingServices', 'NotificationFactory', 'mailingServices',
    function ($scope, $http, $routeParams, $location, $filter, civiApi, log, notification, mailing) {
      // Initialise the step
      mailing.initStep({step: 3, scope: $scope});

      $scope.constants = {
        ENTITY_NAME: 'Group'
      };

      // Initialise empty mailing
      $scope.mailing = {};
      $scope.groups = [];

      $scope.constants = {
        ENTITY_NAME: 'Group'
      };

      $scope.models = {
        emailHtml: ''
      };

      // Get the current mailing
      mailing.getMailing()
        .then(function (response) {
          $scope.mailing = response;
        });

      civiApi.get($scope.constants.ENTITY_NAME)
        .then(function (response) {
          log.createLog('Groups retrieved', response);
          $scope.groups = $filter('filter')(response.values, {is_hidden: 0});
        });
    }
  ]);

  /**
   * Step 4 of the wizard
   */
  controllers.controller('ScheduleAndSendController', [
    '$scope', '$http', '$routeParams', '$location', 'CiviApiFactory', 'loggingServices', 'NotificationFactory', 'mailingServices',
    function ($scope, $http, $routeParams, $location, civiApi, log, notification, mailing) {
      // Initialise the step
      mailing.initStep({step: 4, scope: $scope});

      $scope.constants = {
        ENTITY_NAME: 'Group'
      };

      // Initialise empty mailing
      $scope.mailing = {};

      // Get the current mailing
      mailing.getMailing()
        .then(function (response) {
          $scope.mailing = response;
        });

      // Activate the jQuery datepicker plugin once the partial has been included
      $scope.$on('$includeContentLoaded', function (e) {
        cj("#datepicker").datepicker();
      });

      $scope.constants = {
        ENTITY_NAME: 'Group'
      };
    }
  ]);
})();

(function () {
  "use strict";

  /**
   * Directive to create an image uploader, with drag-n-drop support
   *
   * @ngdoc directive
   * @name smImageUploader
   * @alias smImageUploader
   *
   * @restrict AE
   * @element ANY
   *
   * @param {expression} model Model for the image
   * @param {expression} uploader Reference to the image uploader
   * @param {expression} onRemove Action to perform when the remove button is clicked
   * @param {object} config Configuration for the directive
   *
   * @type {*[]}
   */
  var smImageUploaderDirective = ['paths', function (paths) {
    function link(scope) {
      scope.$watch(function () {
          return scope.config.required;
        }, function (newVal) {
          if (['0', '1'].indexOf(newVal) !== -1) {
            scope.isRequired = +newVal ? true : false;
          }
          else if (['false', 'true'].indexOf(newVal) !== -1) {
            scope.isRequired = newVal === 'true';
          } else {
            scope.isRequired = newVal;
          }
        }
      );
    }

    return {
      restrict: 'AE',
      scope: {
        model: '=',
        uploader: '=',
        config: '=',
        remove: '&onRemove'
      },
      templateUrl: paths.TEMPLATES_DIR() + '/image-uploader.html',
      link: link
    };
  }];

  /**
   * A directive to create a simple horizontal image carousel
   *
   * @ngdoc directive
   * @name smImageCarousel
   * @alias smImageCarousel
   *
   * @restrict AE
   * @element ANY
   *
   * @param {array} items
   * @param {number} selectedFilterId
   * @param {number} selectedItemId
   * @param {boolean} itemsLoaded
   *
   * @type {*[]}
   */
  var smImageCarouselDirective = ['paths', '$timeout', '$rootScope', 'itemFromCollectionFilter', 'headersForSelectedFilterFilter',
    function (paths, $timeout, $rootScope, itemFromCollection, headersForSelectedFilter) {
      function link(scope, element) {
        scope.selectedIndex = null;
        scope.selectedItem = null;
        scope.filteredItems = [];

        // Setup the index of saved selected image once all headers have been retrieved
        scope.$watchCollection(function () {
            return scope.items;
          },
          function (newVal) {
            console.log(newVal);

            if (newVal.length) {
              scope.selectedFilterId = 'all';

              console.log('Selected item', scope.selectedItem);
            }
          });

        // Update selected header ID according to the image selected (clicked)
        scope.$watch(function () {
            return scope.selectedIndex;
          },
          function (newVal) {
            if (newVal !== null) {
              scope.selectedItemId = scope.filteredItems[scope.selectedIndex].id;
              console.log('Item ID', scope.selectedItemId);
            }
          });

        // This will make sure that, even if selectedItemId was received late, the selectedIndex is set correctly
        scope.$watch(function () {
            return scope.selectedItemId;
          },
          function (newVal) {
            if (newVal) {
              scope.updateSelection();
            }
          }
        );

        /*
         Upon change of filter:
         1. change in filter will be detected, which will filter items using the new filter id (upon change of filter by the user)
         3. after filtering, update width

         Upon initial page load:
         1. change filter id (set it to 'all')
         2. change in filter will be detected, which will filter items using the new filter id
         3. after filtering, update width
         */

        // Update the selected item's (in order to select the correct header image) index upon changing filter and
        // update the width of the carousel
        scope.$watch(function () {
            return scope.selectedFilterId;
          },
          function () {
            console.log('--- Filter changed ---');

            scope.filterItems();
            scope.updateSelection();
          }, true);

        // Filter items based on the currently selected filter and update the carousel width
        scope.filterItems = function () {
          scope.filteredItems = headersForSelectedFilter(scope.items, scope.selectedFilterId);

          $timeout(function () {
            scope.setWidth();
          }, 200);
        };

        /**
         * Select an image when it is clicked
         *
         * @param {number} index
         */
        scope.selectImage = function (index) {
          console.log('Image selected with index', index);
          scope.selectedIndex = index;
        };

        // Update the index of the selected item to the item's relative position in the currently filtered list
        // This will make sure that correct image is highlighted as selected even when the list is filtered
        scope.updateSelection = function () {
          var item = itemFromCollection(scope.filteredItems, 'id', scope.selectedItemId);

          scope.selectedIndex = item.index;
        };

        scope.resetWidth = function () {
          element.find('ul').width('100%');
        };

        scope.setWidth = function () {
          var listElements = element.find('ul').find('img');
          var totalLength = 0;
          var currentLength = 0;

          if (listElements.length) {
            for (var i = 0; i < listElements.length; i++) {
              currentLength = $(listElements[i]).outerWidth(true);
              totalLength += currentLength;
              console.log(currentLength);
            }

            totalLength += totalLength * 0.005;
          } else {
            totalLength = '100%';
          }

          console.log('Total length', totalLength);

          element.find('ul').width(totalLength);
        }
      }

      return {
        restrict: 'AE',
        scope: {
          items: '=',
          selectedFilterId: '=',
          selectedItemId: '=',
          itemsLoaded: '='
        },
        templateUrl: paths.TEMPLATES_DIR() + '/simple-image-carousel.html',
        link: link
      }
    }];

  /**
   * A directive to make the CK Editor work in AngularJS app
   *
   * @ngdoc directive
   * @name smCkEditor
   * @alias smCkEditor
   *
   * @restrict A
   * @element textarea
   *
   * @param {ngModel} ngModel The text to be edited in the CK Editor
   *
   * @type {*[]}
   */
  var smCkEditorDirective = [function () {
    function link(scope, element, attributes, ngModel) {
      var ck = CKEDITOR.replace(element[0], {
        enterMode: CKEDITOR.ENTER_BR
      });

      if (!ngModel) return;

      ck.on('pasteState', function () {
        scope.$apply(function () {
          ngModel.$setViewValue(ck.getData());
        });
      });

      ngModel.$render = function () {
        ck.setData(ngModel.$viewValue);
      };
    }

    return {
      require: '?ngModel',
      restrict: 'A',
      link: link
    }
  }];


  /**
   * A directive to embed a preview of email HTML
   *
   * @ngdoc directive
   * @name smEmailPreviewer
   * @alias smEmailPreviewer
   *
   * @restrict A
   * @element iframe
   *
   * @param {string} emailContent The HTML content of the email
   *
   * @type {*[]}
   */
  var smEmailPreviewerDirective = [function () {
    function link(scope, element, attributes) {
      scope.$watch(attributes.emailContent, function (oldVal, newVal) {
        var content = oldVal ? oldVal : newVal;
        if (content) {
          var iframe = element[0];
          var doc = null;

          if (iframe.contentDocument) {
            doc = iframe.contentDocument;
          } else if (iframe.contentWindow) {
            doc = iframe.contentWindow.document;
          }

          // Write email contents into the iframe
          doc.open();
          doc.writeln(content);
          doc.close();
        }
      });
    }

    return {
      restrict: 'A',
      link: link
    }
  }];

  /**
   * A directive to create action buttons next to each mailing on the listing of mailings
   *
   * @ngdoc directive
   * @name smMailingActionButtons
   * @alias smMailingActionButtons
   *
   * @restrict AE
   * @element ANY
   *
   * @param {object} mailing The mailing object
   * @param {object} status-constants An object containing mailing status constants
   * @param {string} onDelete Action to perform on clicking on the delete button
   * @param {string} onCancel Action to perform on clicking of the cancel button
   *
   * @type {*[]}
   */
  var smMailingActionButtonsDirective = ['paths', function (paths) {
    return {
      restrict: 'AE',
      scope: {
        mailing: '=',
        constants: '=statusConstants',
        duplicate: '&onDuplicate',
        delete: '&onDelete',
        cancel: '&onCancel'
      },
      templateUrl: paths.TEMPLATES_DIR() + '/action-buttons.html'
    }
  }];

  angular.module('simpleMail.directives', [])
    .directive('smImageUploader', smImageUploaderDirective)
    .directive('smImageCarousel', smImageCarouselDirective)
    .directive('smCkEditor', smCkEditorDirective)
    .directive('smEmailPreviewer', smEmailPreviewerDirective)
    .directive('smMailingActionButtons', smMailingActionButtonsDirective)
  ;

})();
(function () {
  "use strict";

  /**
   * @type {ng.IModule}
   */
  var filters = angular.module('simpleMail.filters', []);

  /**
   * @ngDoc filter
   * @name itemFromCollection
   * @kind function
   *
   * @description Search for an item by a key in a collection, and return it if found
   *
   * @param collection An array of objects or arrays
   * @param searchKey
   * @param searchValue
   * @returns object An object consisting of the item found (or null is not found) and its associated index (or
   * null if not found) in the collection
   */
  filters.filter('itemFromCollection', [
    function () {
      return function (collection, searchKey, searchValue) {
        var foundItem = {item: null, index: null};

        if (angular.isUndefined(collection) || angular.isUndefined(searchValue)) return foundItem;

        var currentItem = null;

        for (var i = 0, end = collection.length; i < end; i++) {
          currentItem = collection[i];

          // For both arrays and objects (since arrays are basically objects)
          if (angular.isObject(currentItem) && currentItem.hasOwnProperty(searchKey) && currentItem[searchKey] === searchValue) {
            foundItem.item = currentItem;
            foundItem.index = i;
          }
        }

        return foundItem;
      }
    }
  ]);

  /**
   * @ngDoc filter
   * @name filterMailings
   * @kind function
   */
  filters.filter('filterMailings', ['$filter',
    function ($filter) {
      return function (mailings, filters) {
        if (! angular.isArray(mailings)) return false;

        if( ! angular.isObject(filters)) return mailings;

        var filteredMailings = mailings;

        if (filters.hasOwnProperty('status') && filters.status) {
          filteredMailings = $filter('filterMailingsByStatus')(mailings, filters.status);
        }

        if (filters.hasOwnProperty('creator') && filters.creator) {
          filteredMailings = $filter('filterMailingsByCreator')(filteredMailings, filters.creator);
        }

        return filteredMailings;
      }
    }
  ]);

  /**
   * @ngDoc filter
   * @name filterMailingsByStatus
   */
  filters.filter('filterMailingsByStatus', [
    function () {
      return function (mailings, filters) {

        var activeFilters = [];

        angular.forEach(filters, function (value, key) {
          if (value) activeFilters.push(key);
        });

        var currentMailing = null;
        var filteredMailings = [];

        for (var i = 0, iEnd = mailings.length; i < iEnd; i++) {
          currentMailing = mailings[i];

          if (currentMailing.hasOwnProperty('status') && activeFilters.indexOf(currentMailing.status) !== -1) {
            filteredMailings.push(currentMailing);
          }
        }

        return filteredMailings;
      }
    }
  ]);

  /**
   * @ngDoc filter
   * @name filterMailingsByCreator
   */
  filters.filter('filterMailingsByCreator', [
    function () {
      return function (mailings, creatorId) {
        if (creatorId === 'all') return mailings;

        var filteredMailings = [];

        var currentMailing = null;
        for (var i = 0, iEnd = mailings.length; i < iEnd; i++) {
          currentMailing = mailings[i];

          if (currentMailing.hasOwnProperty('created_id') && currentMailing.created_id === creatorId) {
            filteredMailings.push(currentMailing);
          }
        }

        return filteredMailings;
      }
    }
  ]);

  /**
   * @ngDoc filter
   */
  filters.filter('headersForSelectedFilter', ['uniqueFilter',
    function (unique) {
      return function (headers, filterId) {
        if (filterId === 'all') {
          return unique(headers, 'id');
        }

        if (!filterId) return headers;

        var filteredHeaders = [];

        angular.forEach(headers, function (value, key) {
          if (value.entity_id === filterId) {
            console.log('Value', value);
            filteredHeaders.push(value);
          }
        });

        return filteredHeaders;
      }
    }
  ]);

  /**
   * @ngDoc filter
   */
  filters.filter('unique', [
    function () {
      return function (items, uniqueKey) {
        var keys = [];
        var uniqueItems = [];

        uniqueKey = uniqueKey || 0;
        
        angular.forEach(items, function(value) {
          var candidate = null;
          if (angular.isObject(value) && value.hasOwnProperty(uniqueKey)) {
            candidate = value[uniqueKey];
          } else if (angular.isString(value)) {
            candidate = value;
          }

          if (keys.indexOf(candidate) === -1) {
            keys.push(candidate);
            uniqueItems.push(value);
          }

        });

        return uniqueItems;
      }
    }
  ]);

  /**
   * @ngDoc filter
   */
  filters.filter('extractColumn', [
    function () {
      return function (collection, columns) {
        var extractedColumn = [];

        if (angular.isObject(collection) && angular.isObject(columns)) {
          angular.forEach(collection, function (item) {
            var row = {};

            angular.forEach(columns, function (column, alias) {
              if (angular.isObject(item) && item.hasOwnProperty(column) && item[column]) {
                row[alias] = item[column];
              }
            });

            extractedColumn.push(row);
          });
        }

        return extractedColumn;
      }
    }
  ]);


  /**
   * Get elements in array 1 that are not in array 2
   *
   * @ngdoc filter
   * @name arrayDiff
   *
   * @param {array} array1
   * @param {array} array2
   * @return {array}
   */
  var arrayDiff = [function () {
    return function (array1, array2) {
      var diff = [];

      for (var i = 0, end = array1.length; i < end; i++) {
        if (-1 === array2.indexOf(array1[i])) {
          diff.push(array1[i]);
        }
      }

      return diff;
    }
  }];

  angular.module('simpleMail.filters')
    .filter('arrayDiff', arrayDiff);
})();


// TODO (robin): Check code documentation towards the end to fix any inconsistencies due to code updates
// TODO (robin): Update select2 to 3.5.0 in order to fix: Cannot read property 'hasClass' of null

(function () {
  "use strict";

  /**
   * Generic services
   *
   * @type {ng.IModule}
   */
  var services = angular.module('simpleMail.services', []);

  /**
   * @ngdoc service
   * @name MailingsListingFactory
   * @return {object}
   */
  var MailingsListingProvider = ['$q', '$filter', 'CiviApiFactory', 'NotificationFactory',

    /**
     *
     * @param {$q} $q
     * @param $filter
     * @param {CiviApiFactory} civiApi
     * @param {NotificationFactory} notification
     * @returns {object}
     */
      function ($q, $filter, civiApi, notification) {
      var constants = {
        entities: {
          MAILING_ENTITY: 'SimpleMail'
        }
      };

      /**
       * An array containing mailings
       *
       * @ngdoc property
       * @name MailingsListingFactory#mailings
       * @type {Array}
       */
      var mailings = [];

      /**
       * The user ID of the current user
       *
       * @ngdoc property
       * @name MailingsListingFactory#userId
       * @type {null}
       */
      var userId = null;

      /**
       * @ngdoc property
       * @name MailingsListingFactory#creators
       * @type {Array}
       */
      var creators = [];

      ////////////////////
      // Public Methods //
      ////////////////////

      /**
       * Initialise the factory
       *
       * @ngdoc method
       * @name MailingsListingFactory#init
       */
      var init = function () {
        var deferred = $q.defer();

        initMailings()
          .then(initCreators)
          .then(function () {
            deferred.resolve();
          })
          .catch(function (response) {
            deferred.reject();
            $log.error('Failed to initialise mailings', response);
          });

        return deferred.promise;
      };

      /**
       * @ngdoc method
       * @name MailingsListingFactory#deleteMailing
       * @param mailing
       */
      var deleteMailing = function (mailing) {
        var deferred = $q.defer();

        var index = mailings.indexOf(mailing);

        if (index !== -1) {
          civiApi.remove(constants.entities.MAILING_ENTITY, mailing)
            .then(function () {
              mailings.splice(index, 1);
              deferred.resolve();
            })
            .catch(function (response) {
              deferred.reject(response);
            });
        } else {
          deferred.reject('Mailing to be deleted was not found in the list of all mailings');
        }

        return deferred.promise
          .then(function () {
            notification.success('Mailing deleted');
          })
          .catch(function (response) {
            notification.error('Failed to delete the mailing');
            $log.error('Failed to delete the mailing as it was not found in the list of all mailings', response);

            return $q.reject();
          });
      };

      // Getters //

      /**
       * @ngdoc method
       * @name MailingsListingFactory#getMailings
       * @returns {Array}
       */
      var getMailings = function () {
        return mailings;
      };

      /**
       * @ngdoc method
       * @name MailingsListingFactory#getUserId
       * @returns {Array}
       */
      var getUserId = function () {
        return userId;
      };

      /**
       * @ngdoc method
       * @name MailingsListingFactory#getCreators
       * @returns {Array}
       */
      var getCreators = function () {
        return creators;
      };

      /////////////////////
      // Private Methods //
      /////////////////////

      /**
       * @name initMailings
       * @private
       * @returns {ng.IPromise<TResult>}
       */
      var initMailings = function () {
        return civiApi.get(constants.entities.MAILING_ENTITY, {}, {error: 'Failed to retrieve mailings'})
          .then(function (response) {
            mailings = response.data.values;
            userId = response.data.userId;
          })
          .catch(function (response) {
            notification.error(response);
          })
      };

      /**
       * @name initCreators
       * @private
       */
      var initCreators = function () {
        creators = $filter('extractColumn')(mailings, {id: 'created_id', name: 'sort_name'});
        creators = $filter('unique')(creators, 'id');
      };

      return {
        init: init,
        deleteMailing: deleteMailing,
        getMailings: getMailings,
        getUserId: getUserId,
        getCreators: getCreators
      };
    }
  ];

  /**
   * TODO (robin): Remove pluralisation of service names and it them PascalCased
   * @ngdoc service
   */
  services.factory('mailingServices', ['$location', '$routeParams', '$q', 'CiviApiFactory', 'paths', 'NotificationFactory',
    function ($location, $routeParams, $q, civiApi, paths, notification) {
      var constants = {
        ENTITY: 'SimpleMail'
      };

      /**
       * Steps for the mailing wizard
       *
       * @readonly
       * @enum {number}
       */
      var Steps = {
        /**
         * First step of the wizard
         */
        FIRST: 1,

        /**
         * Last step of the wizard
         */
        LAST: 4
      };

      /**
       * Root path of mailings
       *
       * @type {string}
       */
      var pathRoot = '/mailings';

      /**
       * Get the URL corresponding to the current step
       *
       * @param {object} params
       * @param {number} params.mailingId
       * @param {number} params.step
       * @returns {string}
       */
      var getStepUrl = function (params) {
        return pathRoot + '/' + params.mailingId + '/steps/' + params.step;
      };

      /**
       * Get the partial path for the current step
       *
       * @param {number} step
       * @returns {string}
       */
      var getStepPartialPath = function (step) {
        return paths.PARTIALS_DIR() + '/wizard/steps/step-' + step + '.html';
      };

      /**
       * Redirect to the listing of headers
       */
      var redirectToListing = function () {
        $location.path(pathRoot);
      };

      return {
        /**
         * Mailing configuration and settings
         */
        config: {
          /**
           * The ID of the current mailing
           *
           * @type {?number}
           */
          mailingId: null,

          /**
           * The current mailing object
           *
           * @type {?object}
           */
          mailing: null,

          /**
           * Current step of the wizard, initialised to first step
           *
           * @type {number}
           */
          step: Steps.FIRST
        },

        /**
         * Initialise a step
         *
         * @param {object} params
         * @param {number} params.step Current step of the mailing
         * @param {$rootScope.Scope} params.scope Scope object for binding wizard navigation buttons
         * @returns {self} Returns self for chaining
         */
        initStep: function (params) {
          this.setStep(params.step)
            .setScope(params.scope);

          this.setupMailing()
            .setupButtons()
            .setupPartials();

          return this;
        },

        /**
         * Setup and initialise the current mailing
         *
         * @returns {self} Returns self for chaining
         */
        setupMailing: function () {
          var mailingId = $routeParams.mailingId;

          var mailing = mailingId === "new"
            ? {}
            : this.get(mailingId)
            .then(function (response) {
              return response;
            })
            .catch(function (response) {
              console.log('Failed to retrieve mailing', response);
              return {};
            });

          this.setMailingId(mailingId);
          this.setMailing(mailing);

          return this;
        },

        /**
         * Set the scope for the mailing
         *
         * @param {$rootScope.Scope} scope
         * @returns {self} Returns self for chaining
         */
        setScope: function (scope) {
          this.config.scope = scope;

          return this;
        },

        /**
         * Get the scope for the mailing
         *
         * @returns {*}
         */
        getScope: function () {
          return this.config.scope;
        },

        /**
         * Set the partial path for the current step
         */
        setupPartials: function () {
          this.getScope().partial = getStepPartialPath(this.getStep());

          return this;
        },

        /**
         * Get the current mailing ID
         *
         * @returns {?number}
         */
        getMailingId: function () {
          return this.config.mailingId;
        },

        /**
         * Set the current mailing ID
         *
         * @param {number} id
         */
        setMailingId: function (id) {
          this.config.mailingId = +id;
        },

        getMailing: function () {
          return $q.when(this.config.mailing);
        },

        /**
         * Set mailing
         *
         * @param {object} mailing
         */
        setMailing: function (mailing) {
          this.config.mailing = mailing;
        },

        /**
         * Get mailing by ID as a promise object
         *
         * @param {int} id
         * @returns {IPromise}
         */
        get: function (id) {
          // TODO (robin): Returning HTTP Promises throughout the services could be replaced with returning a generic promise and performing various validation and repetitive tasks in the service, rather that duplicating it in the controllers (e.g. generic implementation of success() and error() could be done within the service to improve re-usability, and a generic promise could be returned back so that every call to an HTTP service doesn't require boilerplate implementation of success() and error() repetitively
          return civiApi.get(constants.ENTITY, {id: id})
            .then(function (response) {
              if (response.data.is_error) return $q.reject(response);

              console.log('Mailing retrieved', response);
              return response.data.values[0];
            });
        },

        // TODO (robin): Validation before submitting request
        submitMassEmail: function () {
          this.getMailing()
            .then(function (mailing) {
              if (mailing.send_immediately) {
                mailing.scheduled_date = Date.create().format('{yyyy}-{{MM}}-{{dd}} {{HH}}:{{mm}}:{{ss}}');
              }

              return mailing;
            })
            .then(function (mailing) {
              return civiApi.post(constants.ENTITY, mailing, 'submitmassemail');
              //return self.saveProgress();
            })
            .then(function () {
              notification.success('Mailing submitted for mass emailing');
              redirectToListing();
            })
            .catch(function (response) {
              notification.error('Oops! Failed to submit the mailing for mass emailing');
              console.log('Something went wrong when trying to submit for mass emailing', response);

              return $q.reject(response);
            });
          this.saveProgress().then()
        },

        /**
         * Save progress of the mailing
         *
         * @returns {ng.IPromise<TResult>|*}
         */
        saveProgress: function () {
          var self = this;

          return this.getMailing()
            .then(function (mailing) {
              return civiApi.create(constants.ENTITY, mailing);
            })
            .then(function (response) {
              if (response.data.is_error) return $q.reject(response);

              console.log('Mailing saved', response);
              notification.success('Mailing saved');

              // This is to set the mailing ID when a new mailing is created, as the ID would be 'new' otherwise.
              // Setting the ID here would automatically ensure that clicking on the navigation buttons (e.g. 'next')
              // would redirect to the correct URL (i.e. with correct mailing ID and step in the URL), as the
              // navigation logic in this service uses mailing ID to figure out redirections.
              if (isNaN(self.getMailingId())) {
                self.setMailingId(+response.data.values[0].id);
              }
            })
            .catch(function (response) {
              notification.error('Failed to save the mailing');
              console.log('Failed to save the mailing', response);

              return $q.reject(response);
            });
        },

        /**
         * Send a request to send test email
         */
        submitTestEmail: function () {
          this.getMailing()
            .then(function (mailing) {
              if (!mailing.crm_mailing_id) {
                notification.error('Cannot send test email as CiviCRM mailing does not exist for this');
                return;
              }

              notification.info('Sending test email');

              var data = {crmMailingId: mailing.crm_mailing_id, groupId: mailing.testRecipientGroupId};
              return civiApi.post('SimpleMail', data, 'sendtestemail');
            })
            .then(function (response) {
              console.log(response);
              notification.success('Test email send');
            })
            .catch(function (response) {
              notification.error('Failed to send test email');
              console.log('Failed to send test email', response);
            });
        },

        /**
         * Set the current step. This should be defined at each step in order for next/prev step buttons to work correctly.
         *
         * @param {number} step
         * @returns {*}
         */
        setStep: function (step) {
          this.config.step = step;

          return this;
        },

        /**
         * Go back to the previous step of the mailing wizard
         */
        prevStep: function () {
          this.proceedToStep(this.config.step - 1);
        },

        /**
         * Proceed to the next step of the mailing wizard
         */
        nextStep: function () {
          this.proceedToStep(this.config.step + 1);
        },

        /**
         * Proceed to a given step number
         *
         * @param {number} step
         */
        proceedToStep: function (step) {
          var self = this;

          this.saveProgress()
            .then(function () {
              self.redirectToStep(step);
            })
            .catch(function (response) {
              console.log('Failed to save progress', response);
            });
        },

        /**
         * Redirect to a given step number. This doesn't save anything - simply redirects using AngularJS $location
         * service
         *
         * @param {number} step
         */
        redirectToStep: function (step) {
          $location.path(getStepUrl({
            mailingId: this.getMailingId(),
            step: step
          }));
        },

        /**
         * Cancel all modifications on the current step of a mailing. This simply redirects using AngularJS $location
         * service back to the listing
         */
        cancel: function () {
          $location.path(pathRoot);
        },

        /**
         * Get the current step number of the mailing
         *
         * @returns {number}
         */
        getStep: function () {
          return this.config.step;
        },

        /**
         * Whether the link to previous step be shown
         *
         * @returns {boolean}
         */
        showPrevStepLink: function () {
          return this.getStep() !== Steps.FIRST;
        },

        /**
         * Whether the link to next step be shown
         *
         * @returns {boolean}
         */
        showNextStepLink: function () {
          return this.getStep() !== Steps.LAST;
        },

        /**
         * Setup various buttons on the mailing
         *
         * @returns {self} Returns self for chaining
         */
        setupButtons: function () {
          var self = this;
          var scope = this.getScope();


          // Set whether links to previous/next step be shown
          scope.showPrevStepLink = this.showPrevStepLink();
          scope.showNextStepLink = this.showNextStepLink();

          if (this.getStep() === Steps.LAST) {
            scope.showSubmitMassEmailLink = true;

            this.getMailing().then(function (response) {
              if (response.crm_mailing_id && response.send_on) scope.canUpdate = true;
            })
          }

          // Proceed to next step
          scope.nextStep = function () {
            self.setMailing(scope.mailing);
            self.nextStep();
          };

          // Go back to previous step
          scope.prevStep = function () {
            self.setMailing(scope.mailing);
            self.prevStep();
          };

          scope.submitMassEmail = function () {
            self.setMailing(scope.mailing);
            self.submitMassEmail();
          };

          scope.submitTestEmail = function () {
            self.submitTestEmail();
          };

          scope.saveAndContinueLater = function () {
            self.setMailing(scope.mailing);
            self.saveProgress()
              .then(function () {
                notification.success('Mailing saved');
                redirectToListing();
              })
              .catch(function (response) {
                notification.error('Failed to save mailing');
                console.log('Failed to save progress', response);
              });
          };

          scope.cancel = function () {
            self.cancel();
          };

          return this;
        }
      }
    }
  ]);

  /**
   * @ngdoc service
   * @name NotificationFactory
   * @return {object}
   */
  var NotificationProvider = ['$log',
    /**
     * Create a notification
     *
     * @param $log
     */
      function ($log) {
      /**
       * Enable or disable all notifications
       *
       * @type {boolean}
       */
      var notificationEnabled = true;

      /**
       * Enable or disable logging of notifications
       *
       * @type {boolean}
       */
      var logNotifications = true;

      /**
       * Notification status constants for passing as argument to CiviCRM notification function
       *
       * @readonly
       * @enum {string}
       */
      var constants = {
        notificationTypes: {
          SUCCESS: 'success',
          ERROR: 'error',
          INFO: 'info',
          ALERT: 'alert'
        }
      };

      /**
       * Create an alert message
       *
       * @ngdoc method
       * @name NotificationFactory#alert
       * @param subject
       * @param description
       */
      var alert = function (subject, description) {
        _createCrmNotification(subject, description, constants.notificationTypes.ALERT);
      };

      /**
       * Create a success message
       *
       * @ngdoc method
       * @name NotificationFactory#success
       * @param subject
       * @param description
       */
      var success = function (subject, description) {
        _createCrmNotification(subject, description, constants.notificationTypes.SUCCESS);
      };

      /**
       * Create an informative message
       *
       * @ngdoc method
       * @name NotificationFactory#info
       * @param subject
       * @param description
       */
      var info = function (subject, description) {
        _createCrmNotification(subject, description, constants.notificationTypes.INFO);
      };

      /**
       * Create an error message
       *
       * @ngdoc method
       * @name NotificationFactory#error
       * @param subject
       * @param description
       */
      var error = function (subject, description) {
        _createCrmNotification(subject, description, constants.notificationTypes.ERROR);
      };

      /**
       * Wrapper for creating CiviCRM notifications, and optionally logging them
       *
       * @ngdoc function
       * @param subject
       * @param description
       * @param type
       * @private
       */
      var _createCrmNotification = function (subject, description, type) {
        if (notificationEnabled) {
          description = description || '';
          CRM.alert(description, subject, type);

          if (logNotifications) $log.debug('(' + type.toUpperCase() + ') ' + subject, description);
        }
      };

      return {
        alert: alert,
        success: success,
        info: info,
        error: error
      };
    }
  ];

  // TODO (robin): use the builtin log service of AngularJS and decorate it with custom behavior rather than this below
  // TODO (robin): Switch to revealing module pattern and move logNotifications to global config
  ///**
  // * @ngdoc factory
  // * @name NotificationFactory
  // */
  //services.factory("NotificationFactory", ['$log',
  //  /**
  //   * Create a notification
  //   *
  //   * @param $log
  //   * @returns {{alert: Function, success: Function, info: Function, error: Function, _createCrmNotication: Function}}
  //   */
  //    function ($log) {
  //    /**
  //     * Enable or disable all notifications
  //     *
  //     * @type {boolean}
  //     */
  //    var notificationEnabled = true;
  //
  //    /**
  //     * Enable or disable logging of notifications
  //     *
  //     * @type {boolean}
  //     */
  //    var logNotifications = true;
  //
  //    /**
  //     * Notification status constants for passing as argument to CiviCRM notification function
  //     *
  //     * @readonly
  //     * @enum {string}
  //     */
  //    var notificationTypes = {
  //      SUCCESS: 'success',
  //      ERROR: 'error',
  //      INFO: 'info',
  //      ALERT: 'alert'
  //    };
  //
  //    return {
  //      /**
  //       * Create an alert message
  //       *
  //       * @param subject
  //       * @param description
  //       */
  //      alert: function (subject, description) {
  //        this._createCrmNotication(subject, description, notificationTypes.ALERT);
  //      },
  //
  //      /**
  //       * Create a success message
  //       *
  //       * @param subject
  //       * @param description
  //       */
  //      success: function (subject, description) {
  //        this._createCrmNotication(subject, description, notificationTypes.SUCCESS);
  //      },
  //
  //      /**
  //       * Create an informative message
  //       *
  //       * @param subject
  //       * @param description
  //       */
  //      info: function (subject, description) {
  //        this._createCrmNotication(subject, description, notificationTypes.INFO);
  //      },
  //
  //      /**
  //       * Create an error message
  //       *
  //       * @param subject
  //       * @param description
  //       */
  //      error: function (subject, description) {
  //        this._createCrmNotication(subject, description, notificationTypes.ERROR);
  //      },
  //
  //      /**
  //       * Wrapper for creating CiviCRM notifications, and optionally logging them
  //       *
  //       * @param subject
  //       * @param description
  //       * @param type
  //       * @private
  //       */
  //      _createCrmNotication: function (subject, description, type) {
  //        if (notificationEnabled) {
  //          description = description || '';
  //          CRM.alert(description, subject, type);
  //
  //          if (logNotifications) $log.debug('(' + type.toUpperCase() + ') ' + subject, description);
  //        }
  //      }
  //    };
  //  }
  //]);

  /**
   * @ngdoc factory
   * @name loggingServices
   * @deprecate TODO (robin): Use the $log everywhere and remove this
   */
  services.factory("loggingServices",
    function () {
      /**
       * Enable or disable all logging
       *
       * @type {boolean}
       */
      var loggingEnabled = true;

      return {
        /**
         * Log into the browser console
         *
         * @param subject
         * @param data
         */
        createLog: function (subject, data) {
          if (loggingEnabled) {
            if (data) {
              console.log(subject + ":", data);
            } else {
              console.log(subject);
            }
          }
        }
      };
    });

  /**
   * @ngdoc service
   * @name CiviApiFactory
   * @alias CiviApiFactory
   */
  var CiviApiProvider = ['$http', '$q', '$log', 'NotificationFactory',
    /**
     * @param {$http} $http
     * @param {$q} $q
     * @param {$log} $log
     * @param {NotificationFactory} Notification
     */
      function ($http, $q, $log, Notification) {
      /**
       * Return a list of records for the given entity
       *
       * @name CiviApiFactory#get
       * @param {string} entityName
       * @param {object=} data Optional data to pass in the GET/POST request
       * @param {{success: string=, error: string=}=} options
       * @returns {ng.IPromise.<TResult>|*}
       */
      var get = function (entityName, data, options) {
        return post(entityName, data, 'get', options);
      };

      /**
       * Return value corresponding to the given name for the entity
       *
       * @name CiviApiFactory#getValue
       * @param {string} entityName
       * @param {object=} data Optional configuration
       * @param {object=} data Optional data to pass in the GET/POST request
       * @param {{success: string=, error: string=}=} options
       * @returns {ng.IPromise.<TResult>|*}
       */
      var getValue = function (entityName, data, options) {
        return post(entityName, data, 'getValue', options);
      };

      /**
       * Create a new record for the given entity
       *
       * @name CiviApiFactory#create
       * @param entityName
       * @param {object=} data Optional data to pass in the GET/POST request
       * @param {{success: string=, error: string=}=} options
       * @returns {ng.IPromise.<TResult>|*}
       */
      var create = function (entityName, data, options) {
        return post(entityName, data, 'create', options);
      };

      /**
       * Update an existing record for the given entity
       *
       * @name CiviApiFactory#update
       * @param entityName
       * @param {object=} data Optional data to pass in the GET/POST request
       * @param {{success: string=, error: string=}=} options
       * @returns {ng.IPromise.<TResult>|*}
       */
      var update = function (entityName, data, options) {
        return post(entityName, data, 'create', options);
      };

      /**
       * Delete a record for the given entity
       *
       * @name CiviApiFactory#remove
       * @param {string} entityName
       * @param {object=} data Optional data to pass in the GET/POST request
       * @param {{success: string=, error: string=}=} options
       * @returns {ng.IPromise.<TResult>|*}
       */
      var remove = function (entityName, data, options) {
        return post(entityName, data, 'delete', options)
      };

      /**
       * Send a POST request to the CiviCRM API. This will also create logs and, optionally, notifications.
       *
       * @name CiviApiFactory#post
       * @param {string} entityName
       * @param {object=} data Optional data to pass in the GET/POST request
       * @param {string} action
       * @param {{success: string=, error: string=}=} options
       * @returns {ng.IPromise<TResult>|*}
       */
      var post = function (entityName, data, action, options) {
        data = data || {};
        options = options || {};

        var successMessage = options.success || null;
        var errorMessage = options.error || null;

        return _createPost(entityName, data, action)
          .then(function (response) {
            if (response.data.is_error) return $q.reject(response);

            if (successMessage) {
              Notification.success(successMessage);
              $log.info(successMessage + ':', response);
            } else {
              $log.info('Successfully performed \'' + action + '\' on \'' + entityName + '\' with response:', response);
            }

            return response;
          })
          .catch(function (response) {
            if (errorMessage) {
              if (response.data.error_message) errorMessage += ': ' + response.data.error_message;

              Notification.error(errorMessage);
              $log.error(errorMessage + ':', response);
            } else {
              $log.error('Failed to perform ' + action + ' on ' + entityName + ' with response:', response);
            }

            return $q.reject(response);
          });
      };

      /**
       * Wrapper to configure HTTP post request and send it to the CiviCRM API for various actions
       *
       * @param {string} entityName
       * @param {object=} data Optional data to pass in the GET/POST request
       * @param {string} action
       * @returns {HttpPromise}
       * @private
       */
      var _createPost = function (entityName, data, action) {
        data = data || {};

        data.entity = entityName;
        data.action = action;
        data.sequential = 1;
        data.json = 1;

        // Because data needs to be sent as string for CiviCRM to accept
        var serialisedData = jQuery.param(data);

        // TODO (robin): Move this to config
        var postUrl = '/civicrm/ajax/rest';

        // Set the headers so AngularJS POSTs the data as form data (and not request payload, which CiviCRM doesn't recognise)
        var headers = {'Content-Type': 'application/x-www-form-urlencoded'};

        return $http.post(postUrl, serialisedData, {headers: headers});
      };

      return {
        // Methods
        get: get,
        getValue: getValue,
        create: create,
        update: update,
        remove: remove,
        post: post
      };
    }
  ];

  angular.module('simpleMail.services')
    .factory('MailingsListingFactory', MailingsListingProvider)
    .factory('NotificationFactory', NotificationProvider)
    .factory('CiviApiFactory', CiviApiProvider)
  ;
})();