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
          civiApi.post(constants.entities.MAILING_ENTITY, mailing, 'cancelmassemail')
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
            notification.success('Mailing cancelled');
          })
          .catch(function (response) {
            notification.error('Failed to cancel the mailing');
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
          civiApi.post(constants.entities.MAILING_ENTITY, mailing, 'duplicatemassemail')
            .then(function (response) {
              return civiApi.get(constants.entities.MAILING_ENTITY, {id: response.data.values[0].id});
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
            notification.success('Mailing duplicated');
          })
          .catch(function (response) {
            notification.error('Failed to duplicate the mailing', response.data.error_message);
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
        cancelMailing: cancelMailing,
        duplicateMailing: duplicateMailing,
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
        init: function (params) {
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
       * @returns {HttpPromise}
       * @private
       */
      var _createPost = function (entityName, data, action, cached) {
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
    .factory('NotificationFactory', NotificationProvider)
    .factory('CiviApiFactory', CiviApiProvider)
  ;
})();