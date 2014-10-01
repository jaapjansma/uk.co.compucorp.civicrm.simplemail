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
    'simpleMail.filters',
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
            .then(function (response) {
              if (response.is_error) return $q.reject(response);

                notification.success('Image deleted successfully');
            })
            .catch(function (response) {
              notification.error('Failed to delete the image', response.error_message);
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

        //if ($scope.header.id) {
          civiApi.create($scope.constants.ENTITY_NAME, $scope.header)
            // Save or update header
            .then(function (response) {
              log.createLog('Update header response', response);

              if (response.data.is_error) $q.reject(response);

              notification.success('Header updated');

              $scope.header.id = response.data.values[0].id;
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
        //}
        // TODO (robin): Save filters for new headers as well - may be refactor the logic from above into a controller method
        //else {
        //  civiApi.create($scope.constants.ENTITY_NAME, $scope.header)
        //    .success(function (response) {
        //      log.createLog('Save header response', response);
        //
        //      if (response.error_message) {
        //        notification.error('Failed to add header', response.error_message);
        //      } else {
        //        notification.success('Header added');
        //        $scope.redirectToListing();
        //      }
        //    });
        //}
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
       .when('/mailings/:mailingId/steps/:step', {
          templateUrl: paths.PARTIALS_DIR() + '/wizard/steps/steps.html',
          controller: ''
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
    EXT_DIR: CRM.resourceUrls['uk.co.compucorp.civicrm.simplemail'],

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
       return MailingsListing.deleteMailing(mailing);
     };

      /**
       * Cancel scheduled mass mailing
       *
       * @param mailing
       */
      $scope.cancelMailing = function (mailing) {
       return MailingsListing.cancelMailing(mailing);
      };

      /**
       * Create a duplicate of a mailing
       *
       * @param mailing
       */
      $scope.duplicateMailing = function (mailing) {
        return MailingsListing.duplicateMailing(mailing);
      }
    }
  ];

  /**
   * Step 1 of the wizard
   *
   * @ngdoc controller
   * @name CreateMailingCtrl
   * @type {*[]}
   */
  var CreateMailingCtrl = ['$q', 'MailingDetailFactory', 'NotificationFactory', 'MailingHelperFactory', 'WizardStepFactory',
    /**
     *
     * @param $q
     * @param {MailingDetailFactory} Mailing
     * @param {NotificationFactory} Notification
     * @param {MailingHelperFactory} Helper
     * @param {WizardStepFactory} Wizard
     */
      function ($q, Mailing, Notification, Helper, Wizard) {
      var self = this;

      this.mailing = Mailing.getCurrentMailing();
      this.groups = Helper.getMailingGroups();

      var promises = [];

      var mailingPromise = Mailing.init()
        .then(function () {
          self.mailing = Mailing.getCurrentMailing();
        });

      var mailingGroupsPromise = Helper.initMailingGroups()
        .then(function () {
          self.groups = Helper.getMailingGroups();
        });

      // TODO (robin): This is not elegant - find a better solution if there is time
      var isCreatedFromSearchPromise = Wizard.fromSearch()
        .then(function (response) {
          self.fromSearch = response;
        });

      promises.push(mailingPromise, mailingGroupsPromise, isCreatedFromSearchPromise);

      $q.all(promises)
        .catch(function () {
          Notification.genericError();
        })
        .finally(function () {
          self.initialised = true;
          Wizard.init();
        });
    }
  ];

  /**
   * Step 2 of the wizard
   *
   * @ngdoc controller
   * @name ComposeMailingCtrl
   * @type {*[]}
   */
  var ComposeMailingCtrl = ['$filter', '$q', '$scope', 'CampaignMessageFactory', 'HeaderFactory', 'MailingHelperFactory', 'MailingDetailFactory', 'NotificationFactory', 'WizardStepFactory',
    /**
     * @param $filter
     * @param $q
     * @param $scope
     * @param {CampaignMessageFactory} CampaignMessage
     * @param {HeaderFactory} Header
     * @param {MailingHelperFactory} Helper
     * @param {MailingDetailFactory} Mailing
     * @param {NotificationFactory} Notification
     * @param {WizardStepFactory} Wizard
     */
      function ($filter, $q, $scope, CampaignMessage, Header, Helper, Mailing, Notification, Wizard) {
      var self = this;

      this.headersLoaded = false;

      this.mailing = Mailing.getCurrentMailing();
      this.filters = Helper.getHeaderFilters();
      this.headers = Header.getHeaders();
      this.fromEmails = Helper.getFromEmails();
      this.messages = CampaignMessage.getMessages();

      var promises = [];

      var mailingPromise = Mailing.init()
        .then(function () {
          self.mailing = Mailing.getCurrentMailing();
        });

      var headerFiltersPromise = Helper.initHeaderFilters()
        .then(function () {
          self.filters = Helper.getHeaderFilters();
          self.filters.unshift({id: "all", label: "All"});
        });

      var headersPromise = Header.init()
        .then(function () {
          self.headers = Header.getHeaders();
          self.headersLoaded = true;
        });

      var fromEmailsPromise = Helper.initFromEmails()
        .then(function () {
          self.fromEmails = Helper.getFromEmails();
        });

      var campaignMessagesPromise = CampaignMessage.init()
        .then(function () {
          self.messages = CampaignMessage.getMessages();
        });

      promises.push(mailingPromise, headerFiltersPromise, headersPromise, fromEmailsPromise, campaignMessagesPromise);

      $q.all(promises)
        .then(function () {
          self.updateSelectedMessage();
        })
        .catch(function () {
          Notification.genericError();
        })
        .finally(function () {
          Wizard.init();
        });

      // TODO (robin): Could this be refactored so that the view interpolates the result of this method? This might mean invoking it is no longer needed in the above then() method
      this.updateSelectedMessage = function () {
        if (this.mailing.message_id) {
          this.selectedMessage = $filter('filter')(this.messages, {id: this.mailing.message_id})[0];
        }
      };
    }
  ];

  /**
   * Step 3 of the wizard
   *
   * @ngdoc controller
   * @name TestMailingCtrl
   */
  var TestMailingCtrl = ['$q', 'MailingHelperFactory', 'MailingDetailFactory', 'NotificationFactory', 'WizardStepFactory',
    function ($q, Helper, Mailing, Notification, Wizard) {
      var self = this;

      this.mailing = Mailing.getCurrentMailing();
      this.groups = Helper.getMailingGroups();

      var promises = [];

      var mailingPromise = Mailing.init()
        .then(function () {
          self.mailing = Mailing.getCurrentMailing();
        });

      var mailingGroupsPromise = Helper.initMailingGroups()
        .then(function () {
          self.groups = Helper.getMailingGroups();
        });

      promises.push(mailingPromise, mailingGroupsPromise);

      $q.all(promises)
        .catch(function () {
          Notification.genericError();
        })
        .finally(function () {
          Wizard.init();
        });
    }
  ];

  var ScheduleAndSendCtrl = ['$q', 'MailingDetailFactory', 'NotificationFactory', 'WizardStepFactory',
    function ($q, Mailing, Notification, Wizard) {
      var self = this;

      this.mailing = Mailing.getCurrentMailing();

      var promises = [];

      var mailingPromise = Mailing.init()
        .then(function () {
          self.mailing = Mailing.getCurrentMailing();
        });

      promises.push(mailingPromise);

      $q.all(promises)
        .catch(function () {
          Notification.genericError();
        })
        .finally(function () {
          Wizard.init();
        });
    }
  ];

  /**
   * @ngdoc controller
   * @name WizardStepsCtrl
   */
  var WizardStepsCtrl = ['$routeParams', 'WizardStepFactory',
    /**
     *
     * @param $routeParams
     * @param {WizardStepFactory} Wizard
     */
      function ($routeParams, Wizard) {
      var currentStep = +$routeParams.step;

      Wizard.setCurrentStep(currentStep);

      this.partial = Wizard.getPartialPath();

      this.isInitialised = function () {
        return Wizard.isInitialised();
      };
    }
  ];

  /**
   * Mailing buttons
   */
  var MailingButtonsCtrl = ['MailingDetailFactory', 'WizardStepFactory',
    /**
     *
     * @param {WizardStepFactory} Wizard
     */
      function (Mailing, Wizard) {
      this.showPrevStepLink = Wizard.prevStepAllowed();
      this.showNextStepLink = Wizard.nextStepAllowed();
      this.showSubmitMassEmailLink = !this.showNextStepLink;
      this.canUpdate = Mailing.canUpdate();

      this.isInitialised = function () {
        return Wizard.isInitialised();
      };

      this.prevStep = function () {
        if (Wizard.isInitialised()) Wizard.prevStep();
      };

      this.nextStep = function () {
        if (Wizard.isInitialised()) Wizard.nextStep();
      };

      this.saveAndContinueLater = function () {
        if (Wizard.isInitialised()) Wizard.saveAndContinueLater();
      };

      this.submitMassEmail = function () {
        if (Wizard.isInitialised()) Wizard.submitMassEmail();
      };

      this.cancel = function () {
        Wizard.cancel();
      };

      this.sendTestEmail = function() {
        Wizard.sendTestEmail();
      }
    }];


  angular.module('simpleMail.app.controllers')
    .controller('MailingsController', MailingsController)
    .controller('WizardStepsCtrl', WizardStepsCtrl)
    .controller('CreateMailingCtrl', CreateMailingCtrl)
    .controller('ComposeMailingCtrl', ComposeMailingCtrl)
    .controller('TestMailingCtrl', TestMailingCtrl)
    .controller('ScheduleAndSendCtrl', ScheduleAndSendCtrl)
    .controller('MailingButtonsCtrl', MailingButtonsCtrl)
  ;

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

            if (angular.isArray(newVal) && newVal.length) {
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
      if (!ngModel) return;

      var config = {
        enterMode: CKEDITOR.ENTER_BR,
        toolbarGroups: []
      };

      switch (attributes['smCkEditor']) {
        case 'minimal':
          config.toolbarGroups.push([]);
          break;
        default:
        // break omitted intentionally
        case 'normal':
          config.toolbarGroups.push(
            ['Bold', 'Italic', 'Strike', 'RemoveFormat'],
            ['NumberedList', 'BulletedList'],
            ['Link', 'Unlink'],
            ['Maximize']
          );
      }

      if (attributes.height) {
        config.height = attributes.height
      }

      var ck = CKEDITOR.replace(element[0], config);

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

  /**
   * @ngdoc directive
   * @name smClickOnce
   * @alias smClickOnce
   *
   * @type {*[]}
   */
  var smClickOnceDirective = ['$parse', function ($parse) {
    var link = function (scope, element, attributes) {
      var fn = $parse(attributes['smClickOnce']);
      scope.submitting = false;

      element.on('click', function () {
        scope.$apply(function () {
          if (scope.submitting) return;

          scope.submitting = true;

          fn(scope)
            .finally(function () {
              scope.submitting = false;
            });
        });
      });
    };

    return {
      link: link
    };
  }];

  var smDisabled = [function () {
    var link = function (scope, element, attributes) {
      element.addClass('disabled');

      scope.$watch(attributes['smDisabled'], function (newVal) {
        if (newVal === false) {
          element.removeClass('disabled');
        }
      });
    };

    return {
      link: link
    };
  }];

  var smLoadedDirective = [function () {
    var link = function (scope, element, attributes) {
      element.append('<div class="loading-panel"></div>')

      scope.$watch(attributes['smLoaded'], function (newVal) {
        if (newVal === true) {
          element.find('.loading-panel').addClass('ng-hide');
        }
      });
    };

    return {
      link: link
    };
  }];

  angular.module('simpleMail.directives', [])
    .directive('smImageUploader', smImageUploaderDirective)
    .directive('smImageCarousel', smImageCarouselDirective)
    .directive('smCkEditor', smCkEditorDirective)
    .directive('smEmailPreviewer', smEmailPreviewerDirective)
    .directive('smMailingActionButtons', smMailingActionButtonsDirective)
    .directive('smClickOnce', smClickOnceDirective)
    .directive('smDisabled', smDisabled)
    .directive('smLoaded', smLoadedDirective)
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
   *
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
     * @param {CiviApiFactory} CiviApi
     * @param {NotificationFactory} Notification
     * @returns {object}
     */
      function ($q, $filter, CiviApi, Notification) {
      var constants = {
        entities: {
          MAILING: 'SimpleMail'
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
          CiviApi.remove(constants.entities.MAILING, mailing)
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
            Notification.success('Mailing deleted');
          })
          .catch(function (response) {
            Notification.error('Failed to delete the mailing');
            $log.error('Failed to delete the mailing:', response);

            return $q.reject();
          });
      };

      /**
       * @ngdoc method
       * @name MailingsListingFactory#cancelMailing
       * @param mailing
       */
      var cancelMailing = function (mailing) {
        var deferred = $q.defer();

        var index = mailings.indexOf(mailing);

        if (index !== -1) {
          CiviApi.post(constants.entities.MAILING, mailing, 'cancelmassemail')
            .then(function () {
              mailing.status = 'Canceled';
              deferred.resolve();
            })
            .catch(function (response) {
              deferred.reject(response);
            });
        } else {
          deferred.reject('Mailing to be cancelled was not found in the list of all mailings');
        }

        return deferred.promise
          .then(function () {
            Notification.success('Mailing cancelled');
          })
          .catch(function (response) {
            Notification.error('Failed to cancel the mailing');
            $log.error('Failed to cancel the mailing:', response);

            return $q.reject();
          });
      };

      /**
       * @ngdoc method
       * @name MailingsListingFactory#duplicateMailing
       * @param mailing
       */
      var duplicateMailing = function (mailing) {
        var deferred = $q.defer();

        var index = mailings.indexOf(mailing);

        if (index !== -1) {
          CiviApi.post(constants.entities.MAILING, mailing, 'duplicatemassemail')
            .then(function (response) {
              return CiviApi.get(constants.entities.MAILING, {id: response.data.values[0].id});
            })
            .then(function (response) {
              mailings.push(response.data.values[0]);
              deferred.resolve();
            })
            .catch(function (response) {
              deferred.reject(response);
            });
        } else {
          deferred.reject('Mailing to be duplicated was not found in the list of all mailings');
        }

        return deferred.promise
          .then(function () {
            Notification.success('Mailing duplicated');
          })
          .catch(function (response) {
            Notification.error('Failed to duplicate the mailing', response.data.error_message);
            $log.error('Failed to duplicate the mailing:', response);

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
        return CiviApi.get(constants.entities.MAILING, {}, {error: 'Failed to retrieve mailings'})
          .then(function (response) {
            mailings = response.data.values;
            userId = response.data.userId;
          })
          .catch(function (response) {
            Notification.error(response);
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
        cancelMailing: cancelMailing,
        duplicateMailing: duplicateMailing,
        getMailings: getMailings,
        getUserId: getUserId,
        getCreators: getCreators
      };
    }
  ];

  /**
   * @ngdoc service
   * @name WizardStepFactory
   * @alias WizardStepFactory
   * @type {*[]}
   */
  var WizardStepProvider = ['$location', '$log', '$q', 'CiviApiFactory', 'MailingDetailFactory', 'NotificationFactory', 'paths',
    /**
     *
     * @param $location
     * @param $log
     * @param $q
     * @param {CiviApiFactory} CiviApi
     * @param {MailingDetailFactory} Mailing
     * @param {NotificationFactory} Notification
     * @param paths
     */
      function ($location, $log, $q, CiviApi, Mailing, Notification, paths) {
      var constants = {
        steps: {
          FIRST: 1,
          LAST: 4
        },
        paths: {
          WIZARD_ROOT: '/mailings'
        }
      };

      var currentStep = constants.steps.FIRST;

      var showPrevStepLink = false;
      var showNextStepLink = false;

      ////////////////////
      // Public Methods //
      ////////////////////

      ///**
      //* @ngdoc method
      //* @name WizardStepFactory#init
      //* @returns {IPromise}
      //*/
      //var init = function () {
      //  var deferred = $q.defer();
      //};

      /**
       * @type {boolean}
       */
      var initialised = false;

      /**
       * @ngdoc method
       * @name WizardStepFactory#isInitialised
       * @returns {boolean}
       */
      var isInitialised = function () {
        return initialised;
      };

      /**
       * @ngdoc method
       * @name WizardStepFactory#init
       */
      var init = function () {
        initialised = true;
      };

      /**
       * @ngdoc method
       * @name WizardStepFactory#nextStepAllowed
       * @returns {boolean}
       */
      var nextStepAllowed = function () {
        return getCurrentStep() < constants.steps.LAST;
      };

      /**
       * @ngdoc method
       * @name WizardStepFactory#prevStepAllowed
       * @returns {boolean}
       */
      var prevStepAllowed = function () {
        return getCurrentStep() > constants.steps.FIRST;
      };

      /**
       * @ngdoc method
       * @name WizardStepFactory#nextStep
       * @returns {IPromise}
       */
      var nextStep = function () {
        if (!nextStepAllowed()) return $q.reject('Next step now allowed!');

        return proceedToStep(currentStep + 1);
      };

      /**
       * @ngdoc method
       * @name WizardStepFactory#prevStep
       * @returns {IPromise}
       */
      var prevStep = function () {
        if (!prevStepAllowed()) return $q.reject('Prev step not allowed!');

        return proceedToStep(currentStep - 1);
      };

      /**
       * @ngdoc method
       * @name WizardStepFactory#saveAndContinueLater
       * @returns {ng.IPromise<TResult>|*}
       */
      var saveAndContinueLater = function () {
        return Mailing.saveProgress()
          .then(function () {
            Mailing.clearCurrentMailing();
            redirectToListing();
          });
      };

      /**
       * @ngdoc method
       * @name WizardStepFactory#submitMassEmail
       * @returns {IPromise}
       */
      var submitMassEmail = function () {
        return Mailing.submitMassEmail()
          .then(function () {
            redirectToListing();
          });
      };

      /**
       * @ngdoc method
       * @name WizardStepFactory#sendTestEmail
       * @returns {IPromise}
       */
      var sendTestEmail = function () {
        return Mailing.sendTestEmail();
      };

      /**
       * @ngdoc method
       * @name WizardStepFactory#cancel
       */
      var cancel = function () {
        Mailing.clearCurrentMailing();
        redirectToListing();
      };

      /**
       * @ngdoc method
       * @name WizardStepFactory#getPartialPath
       * @returns {string}
       */
      var getPartialPath = function () {
        return paths.PARTIALS_DIR() + '/wizard/steps/step-' + getCurrentStep() + '.html';
      };

      /**
       * @ngdoc method
       * @name WizardStepFactory#fromSearch
       * @returns {boolean}
       */
      var fromSearch = function () {
        return CiviApi.post('SimpleMail', {}, 'iscreatedfromsearch')
          .then(function (response) {
            return response.data.values[0].created_from_search;
          })
      };

      // Getters and Setters //

      /**
       * @ngdoc method
       * @name WizardStepFactory#getCurrentStep
       * @returns {number}
       */
      var getCurrentStep = function () {
        return currentStep;
      };

      /**
       * @ngdoc method
       * @name WizardStepFactory#setCurrentStep
       * @param step
       */
      var setCurrentStep = function (step) {
        currentStep = step;
      };

      /////////////////////
      // Private Methods //
      /////////////////////

      /**
       * @private
       * @returns {ng.IPromise<TResult>|*}
       */
      var proceedToStep = function (step) {
        return Mailing.saveProgress()
          .then(function () {
            redirectToStep(step);
          })
          .catch(function (response) {
            Notification.error('Failed to proceed to next step');
            $log.error('Failed to proceed to next step', response);
          });
      };

      /**
       * @private
       */
      var redirectToStep = function (step) {
        setCurrentStep(step);
        initialised = false;
        $location.path(getStepUrl(step));
      };

      /**
       * @private
       */
      var redirectToListing = function () {
        $location.path(constants.paths.WIZARD_ROOT);
      };

      /**
       * @private
       * @returns {string}
       */
      var getStepUrl = function (step) {
        return constants.paths.WIZARD_ROOT + '/' + Mailing.getCurrentMailing().id + '/steps/' + step;
      };

      return {
        fromSearch: fromSearch,
        init: init,
        isInitialised: isInitialised,
        getCurrentStep: getCurrentStep,
        setCurrentStep: setCurrentStep,
        nextStep: nextStep,
        prevStep: prevStep,
        nextStepAllowed: nextStepAllowed,
        prevStepAllowed: prevStepAllowed,
        cancel: cancel,
        saveAndContinueLater: saveAndContinueLater,
        sendTestEmail: sendTestEmail,
        submitMassEmail: submitMassEmail,
        getPartialPath: getPartialPath
      };
    }];


  /**
   * @ngdoc service
   * @name HeaderFactory
   */
  var HeaderProvider = ['$q', 'CiviApiFactory',
    /**
     *
     * @param $q
     * @param {CiviApiFactory} CiviApi
     */
      function ($q, CiviApi) {
      var constants = {
        entities: {
          HEADER: 'SimpleMailHeader'
        }
      };

      /**
       * @type {Array}
       */
      var headers = [];

      /**
       * @type {boolean}
       */
      var initialised = false;

      /**
       * @ngdoc method
       * @name HeaderFactory#init
       * @returns {*}
       */
      var init = function () {
        var deferred = $q.defer();

        if (initialised) {
          deferred.resolve()
        } else {
          CiviApi.get('SimpleMailHeader', {withFilters: true}, {cached: true})
            .then(function (response) {
              headers = response.data.values;
              initialised = true;
              deferred.resolve();
            })
            .catch(function () {
              deferred.reject();
            });
        }

        return deferred.promise;
      };

      /**
       * @ngdoc method
       * @name HeaderFactory#getHeaders
       * @returns {Array}
       */
      var getHeaders = function () {
        return headers;
      };

      return {
        init: init,
        getHeaders: getHeaders
      };
    }
  ];

  /**
   * @ngdoc service
   * @name CampaignMessageFactory
   */
  var CampaignMessageProvider = ['$q', 'CiviApiFactory',
    /**
     * @param $q
     * @param {CiviApiFactory} CiviApi
     */
      function ($q, CiviApi) {
      var constants = {
        entities: {
          MESSAGE: 'SimpleMailMessage'
        }
      };

      /**
       * @type {Array}
       */
      var messages = [];

      /**
       * @type {boolean}
       */
      var initialised = false;

      /**
       * @ngdoc method
       * @name CampaignMessageFactory#init
       * @returns {IPromise}
       */
      var init = function () {
        var deferred = $q.defer();

        if (initialised) {
          deferred.resolve();
        } else {
          CiviApi.get(constants.entities.MESSAGE, {is_active: 1}, {cached: true})
            .then(function (response) {
              messages = response.data.values;
              initialised = true;
              deferred.resolve();
            })
            .catch(function () {
              deferred.reject();
            });
        }

        return deferred.promise;
      };

      /**
       * @ngdoc method
       * @name CampaignMessageFactory#getMessages
       * @returns {Array}
       */
      var getMessages = function () {
        return messages;
      };

      return {
        init: init,
        getMessages: getMessages
      };
    }
  ];

  /**
   * @ngdoc service
   * @name MailingHelperFactory
   */
  var MailingHelperProvider = ['$filter', '$q', 'CiviApiFactory',
    /**
     * @param $filter
     * @param {CiviApiFactory} CiviApi
     */
      function ($filter, $q, CiviApi) {
      var constants = {
        entities: {
          OPTION_GROUP: 'OptionGroup',
          OPTION_VALUE: 'OptionValue',
          MAILING_GROUP: 'Group'
        }
      };

      /**
       *
       * @type {Array}
       */
      var mailingGroups = [];

      /**
       *
       * @type {Array}
       */
      var fromEmails = [];

      /**
       * @type {Array}
       */
      var headerFilters = [];

      /**
       * @type {boolean}
       */
      var mailingGroupsInitialised = false;

      /**
       * @type {boolean}
       */
      var fromEmailsInitialised = false;

      /**
       * @type {boolean}
       */
      var headerFiltersInitialised = false;

      ////////////////////
      // Public Methods //
      ////////////////////

      /**
       * @ngdoc method
       * @name MailingHelperFactory#initMailingGroups
       * @returns {IPromise}
       */
      var initMailingGroups = function () {
        var deferred = $q.defer();

        if (mailingGroupsInitialised) {
          deferred.resolve();
        } else {
          CiviApi.get(constants.entities.MAILING_GROUP)
            .then(function (response) {
              // TODO (robin): Move is_hidden filtering to API query
              mailingGroups = $filter('filter')(response.data.values, {is_hidden: 0});
              mailingGroupsInitialised = true;
              deferred.resolve();
            })
            .catch(function () {
              deferred.reject();
            });
        }

        return deferred.promise;
      };

      /**
       * @ngdoc method
       * @name MailingHelperFactory#initFromEmails
       * @returns {*}
       */
      var initFromEmails = function () {
        var deferred = $q.defer();

        if (fromEmailsInitialised) {
          deferred.resolve();
        } else {
          CiviApi.getValue(constants.entities.OPTION_GROUP, {name: 'from_email_address', return: 'id'}, {cached: true})
            .then(function (response) {
              return +response.data.result;
            })
            // Get the option values
            .then(function (groupId) {
              return CiviApi.get('OptionValue', {option_group_id: groupId}, {cached: true})
                .then(function (response) {
                  fromEmails = response.data.values;
                  fromEmailsInitialised = true;
                  deferred.resolve();
                });
            })
            .catch(function () {
              deferred.reject();
            });
        }

        return deferred.promise;
      };

      /**
       * @ngdoc method
       * @name MailingHelperFactory#initHeaderFilters
       * @returns {IPromise}
       */
      var initHeaderFilters = function () {
        var deferred = $q.defer();

        if (headerFiltersInitialised) {
          deferred.resolve();
        } else {
          CiviApi.getValue(constants.entities.OPTION_GROUP, {name: 'sm_header_filter_options', return: 'id'},
            {cached: true})
            .then(function (response) {
              return +response.data.result;
            })
            .then(function (groupId) {
              return CiviApi.get(constants.entities.OPTION_VALUE, {option_group_id: groupId, is_active: '1'},
                {cached: true})
                .then(function (response) {
                  headerFilters = response.data.values;
                  headerFiltersInitialised = true;
                  deferred.resolve();
                });
            })
            .catch(function () {
              deferred.reject();
            });
        }

        return deferred.promise;
      };

      // Getters and Setters //

      /**
       * @ngdoc method
       * @name MailingHelperFactory#getMailingGroups
       * @returns {Array}
       */
      var getMailingGroups = function () {
        return mailingGroups;
      };

      /**
       * @ngdoc method
       * @name MailingHelperFactory#getFromEmails
       * @returns {Array}
       */
      var getFromEmails = function () {
        return fromEmails;
      };

      /**
       * @ngdoc method
       * @name MailingHelperFactory#getHeaderFilters
       * @returns {Array}
       */
      var getHeaderFilters = function () {
        return headerFilters;
      };

      return {
        initMailingGroups: initMailingGroups,
        initFromEmails: initFromEmails,
        initHeaderFilters: initHeaderFilters,
        getMailingGroups: getMailingGroups,
        getFromEmails: getFromEmails,
        getHeaderFilters: getHeaderFilters
      };
    }
  ];

  /**
   * @ngdoc service
   * @name MailingDetailFactory
   * @return {object}
   */
  var MailingDetailProvider = ['$log', '$q', '$routeParams', 'CiviApiFactory', 'NotificationFactory',
    /**
     *
     * @param $log
     * @param $q
     * @param $routeParams
     * @param {CiviApiFactory} CiviApi
     * @param {NotificationFactory} Notification
     */
      function ($log, $q, $routeParams, CiviApi, Notification) {
      var constants = {
        entities: {
          MAILING: 'SimpleMail'
        }
      };

      //var mailingId = null;

      /**
       * @type {object}
       */
      var currentMailing = {};

      /**
       * @type {object}
       */
      var originalCurrentMailing = {};

      /**
       *
       * @type {boolean}
       */
      var initialised = false;

      ////////////////////
      // Public Methods //
      ////////////////////

      /**
       * @ngdoc method
       * @name MailingDetailFactory#init
       * @returns {IPromise}
       */
      var init = function () {
        var deferred = $q.defer();

        if (isInitialised()) {
          deferred.resolve();
        } else {
          initMailing()
            .then(function () {
              initialised = true;
              deferred.resolve();
            })
            .catch(function () {
              deferred.reject();
            });
        }

        return deferred.promise;

        //return initMailing();
      };

      /**
       * @ngdoc method
       * @name MailingDetailFactory#isInitialised
       * @returns {boolean}
       */
      var isInitialised = function () {
        if (initialised) {
          // Un-initialise the mailing in case we are opening another mailing from the listing (or directly from the URL)
          if (shouldReset()) {
            resetCurrentMailing();
          }
        }

        return initialised;
      };

      /**
       * @ngdoc method
       * @name MailingDetailFactory#shouldReset
       * @returns {boolean}
       */
      var shouldReset = function () {
        return getCurrentMailingId() && ( getCurrentMailingId() != getMailingIdFromUrl() );
      };

      /**
       * @ngdoc method
       * @name MailingDetailFactory#resetCurrentMailing
       */
      var resetCurrentMailing = function () {
        setCurrentMailing({}, true);
        initialised = false;
      };

      /**
       * @returns {?number}
       */
      var getCurrentMailingId = function () {
        return +getCurrentMailing().id;
      };

      /**
       * @ngdoc method
       * @name MailingDetailFactory#canUpdate
       * @returns {boolean}
       */
      var canUpdate = function () {
        var mailing = getCurrentMailing();

        return !!mailing.crm_mailing_id && !!mailing.scheduled_date;
      };

      /**
       * @ngdoc method
       * @name MailingDetailFactory#saveProgress
       * @returns {IPromise}
       */
      var saveProgress = function () {
        // Avoid non-initialisation due to race conditions
        return init()
          .then(function () {
            // If nothing changed, just return a resolved promise
            if (!isCurrentMailingDirty()) return;

            // Else, save the changes
            return CiviApi.create(constants.entities.MAILING, getCurrentMailing(), {
              success: 'Mailing saved',
              error: 'Failed to save the mailing'
            })
              .then(function (response) {
                return CiviApi.get(constants.entities.MAILING, {id: response.data.values[0].id})
              })
              .then(function (response) {
                setCurrentMailing(response.data.values[0], true);
              });
          });
      };

      /**
       * @returns {boolean}
       */
      var isCurrentMailingDirty = function () {
        return !angular.equals(getCurrentMailing(), getCurrentMailing(true));
      };

      /**
       * @ngdoc method
       * @name MailingDetailFactory#submitMassEmail
       * @returns {IPromise}
       */
      var submitMassEmail = function () {
        if (currentMailing.send_immediately) {
          currentMailing.scheduled_date = Date.create().format('{yyyy}-{{MM}}-{{dd}} {{HH}}:{{mm}}:{{ss}}');
        }

        return CiviApi.post(constants.entities.MAILING, getCurrentMailing(), 'submitmassemail', {
          success: 'Mailing submitted for mass emailing',
          error: 'Oops! Failed to submit the mailing for mass emailing!'
        });
      };

      /**
       * @ngdoc method
       * @name MailingDetailFactory#sendTestEmail
       *
       * @returns {IPromise}
       */
      var sendTestEmail = function () {
        var mailing = getCurrentMailing();

        Notification.info('Sending test email');

        return CiviApi.post('SimpleMail', {
          crmMailingId: mailing.crm_mailing_id,
          groupId: mailing.testRecipientGroupId
        }, 'sendtestemail')
          .then(function (response) {
            Notification.success('Test email send');
          })
          .catch(function () {
            Notification.error('Failed to send test email');
          });
      };

      // Getters and Setters

      /**
       * @ngdoc method
       * @name MailingDetailFactory#getCurrentMailing
       * @param {boolean=} original
       * @returns {object}
       */
      var getCurrentMailing = function (original) {
        return original ? originalCurrentMailing : currentMailing;
      };

      /**
       * @ngdoc method
       * @name MailingDetailFactory#setCurrentMailing
       * @param {object} mailing
       * @param {boolean=} updateOriginal
       */
      var setCurrentMailing = function (mailing, updateOriginal) {
        currentMailing = mailing;
        if (updateOriginal) originalCurrentMailing = angular.copy(mailing);
      };

      /////////////////////
      // Private Methods //
      /////////////////////

      /**
       * @private
       * @returns {?number|string}
       */
      var getMailingIdFromUrl = function () {
        return $routeParams.mailingId;
      };

      /**
       * @private
       * @returns {boolean}
       */
      var isNewMailing = function () {
        return getMailingIdFromUrl() === 'new';
      };

      /**
       * @private
       * @returns {IPromise}
       */
      var initMailing = function () {
        var deferred = $q.defer();

        var mailingId = getMailingIdFromUrl();

        // The mailing isn't new (i.e. mailing ID exists in the URL) - populate current mailing using the API
        if (!isNewMailing()) {
          CiviApi.get(constants.entities.MAILING, {id: mailingId})
            .then(function (response) {
              setCurrentMailing(response.data.values[0], true);
              $log.debug('Mailing initialised');

              deferred.resolve();
            })
            .catch(function () {
              deferred.reject();
            });
        } else {
          deferred.resolve();
          $log.debug('Mailing initialised a new');
        }

        return deferred.promise;
      };

      return {
        canUpdate: canUpdate,
        clearCurrentMailing: resetCurrentMailing,
        init: init,
        saveProgress: saveProgress,
        sendTestEmail: sendTestEmail,
        submitMassEmail: submitMassEmail,
        //getCurrentMailingId: getCurrentMailingId,
        getCurrentMailing: getCurrentMailing,
        setCurrentMailing: setCurrentMailing,
        isInitialised: isInitialised
      };
    }];

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
       * Create a generic error message
       *
       * @ngdoc method
       * @name NotificationFactory#genericError
       */
      var genericError = function () {
        _createCrmNotification('Oops! Something went wrong.', 'Please refresh the page', constants.notificationTypes.ERROR);
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
        error: error,
        genericError: genericError
      };
    }
  ];

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
       * @returns {IPromise}
       */
      var get = function (entityName, data, options) {
        return post(entityName, data, 'get', options);
      };

      /**
       * Return value corresponding to the given name for the entity
       *
       * @name CiviApiFactory#getValue
       * @param {string} entityName
       * @param {object=} data Optional data to pass in the GET/POST request
       * @param {{success: string=, error: string=}=} options
       * @returns {IPromise}
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
       * @returns {IPromise}
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
       * @returns {IPromise}
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
       * @returns {IPromise}
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
       * @returns {IPromise}
       */
      var post = function (entityName, data, action, options) {
        data = data || {};
        options = options || {};

        var successMessage = options.success || null;
        var errorMessage = options.error || null;
        var cached = options.cached || false;

        return _createPost(entityName, data, action, cached)
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
       * @param {boolean} cached
       * @returns {IHttpPromise|HttpPromise}
       * @private
       */
      var _createPost = function (entityName, data, action, cached) {
        data = data || {};

        data.entity = entityName;
        data.action = action;
        data.sequential = 1;
        data.json = 1;
        data.rowCount = 0;

        // Because data needs to be sent as string for CiviCRM to accept
        var serialisedData = jQuery.param(data);

        // TODO (robin): Move this to config
        var postUrl = '/civicrm/ajax/rest';

        // Set the headers so AngularJS POSTs the data as form data (and not request payload, which CiviCRM doesn't recognise)
        var headers = {'Content-Type': 'application/x-www-form-urlencoded'};

        return $http.post(postUrl, serialisedData, {headers: headers, cached: cached});
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
    .factory('MailingDetailFactory', MailingDetailProvider)
    .factory('HeaderFactory', HeaderProvider)
    .factory('CampaignMessageFactory', CampaignMessageProvider)
    .factory('MailingHelperFactory', MailingHelperProvider)
    .factory('WizardStepFactory', WizardStepProvider)
    .factory('NotificationFactory', NotificationProvider)
    .factory('CiviApiFactory', CiviApiProvider)
  ;
})();