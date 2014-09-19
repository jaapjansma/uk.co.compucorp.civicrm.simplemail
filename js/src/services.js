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

  services.factory('utilityServices', [
    function () {
      return {
        /**
         * Get elements in array 1 that are not in array 2
         *
         * @param array1
         * @param array2
         */
        arrayDiff: function (array1, array2) {
          var diff = [];

          for (var i = 0, end = array1.length; i < end; i++) {
            if (-1 === array2.indexOf(array1[i])) {
              diff.push(array1[i]);
            }
          }

          return diff;
        }
      }
    }
  ]);

  /**
   * @ngdoc factory
   */
  services.factory('mailingServices', ['$location', '$routeParams', '$q', 'civiApiServices', 'paths', 'utilityServices', 'notificationServices',
    function ($location, $routeParams, $q, civiApi, paths, utility, notification) {
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

  // TODO (robin): use the builtin log service of AngularJS and decorate it with custom behavior rather than this below
  /**
   * @ngdoc factory
   * @name notificationServices
   */
  services.factory("notificationServices", ['loggingServices',
    /**
     * Create a notification
     *
     * @param log
     * @returns {{alert: Function, success: Function, info: Function, error: Function, _createCrmNotication: Function}}
     */
    function (log) {
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
      var notificationTypes = {
        SUCCESS: 'success',
        ERROR: 'error',
        INFO: 'info',
        ALERT: 'alert'
      };

      return {
        /**
         * Create an alert message
         *
         * @param subject
         * @param description
         */
        alert: function (subject, description) {
          this._createCrmNotication(subject, description, notificationTypes.ALERT);
        },

        /**
         * Create a success message
         *
         * @param subject
         * @param description
         */
        success: function (subject, description) {
          this._createCrmNotication(subject, description, notificationTypes.SUCCESS);
        },

        /**
         * Create an informative message
         *
         * @param subject
         * @param description
         */
        info: function (subject, description) {
          this._createCrmNotication(subject, description, notificationTypes.INFO);
        },

        /**
         * Create an error message
         *
         * @param subject
         * @param description
         */
        error: function (subject, description) {
          this._createCrmNotication(subject, description, notificationTypes.ERROR);
        },

        /**
         * Wrapper for creating CiviCRM notifications, and optionally logging them
         *
         * @param subject
         * @param description
         * @param type
         * @private
         */
        _createCrmNotication: function (subject, description, type) {
          if (notificationEnabled) {
            description = description || '';
            CRM.alert(description, subject, type);

            if (logNotifications) log.createLog('(' + type.toUpperCase() + ') ' + subject, description);
          }
        }
      };
    }
  ]);

  /**
   * @ngdoc factory
   * @name loggingServices
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

  services.factory("civiApiServices", ['$http',
    function ($http) {
      return {
        /**
         * Return a list of records for the given entity
         *
         * @param {string} entityName
         * @param {object=} config Optional configuration
         * @returns {*}
         */
        get: function (entityName, config) {
          var data = config || {};
          return this.post(entityName, data, 'get');
        },

        /**
         * Return value corresponding to the given name for the entity
         *
         * @param {string} entityName
         * @param {object=} config Optional configuration
         * @returns {*}
         */
        getValue: function (entityName, config) {
          var data = config || {};
          return this.post(entityName, data, 'getValue');
        },

        /**
         * Create a new record for the given entity
         *
         * @param entityName
         * @param data
         * @returns {*}
         */
        create: function (entityName, data) {
          return this.post(entityName, data, 'create');
        },

        /**
         * Update an existing record for the given entity
         *
         * @param entityName
         * @param data
         * @returns {*}
         */
        update: function (entityName, data) {
          return this.post(entityName, data, 'create');
        },

        /**
         * Delete a record for the given entity
         *
         * @param entityName
         * @param data
         * @returns {*}
         */
        remove: function (entityName, data) {
          return this.post(entityName, data, 'delete')
        },

        /**
         * Wrapper to configure HTTP post request and send it to the CiviCRM API for various actions
         *
         * @param entityName
         * @param data
         * @param action
         * @returns {*}
         */
        post: function (entityName, data, action) {
          data.entity = entityName;
          data.action = action;
          data.sequential = 1;
          data.json = 1;

          // Because data needs to be sent as string for CiviCRM to accept
          var serialisedData = jQuery.param(data);

          return $http({
            method: 'POST',
            url: '/civicrm/ajax/rest',
            data: serialisedData,  // pass in data as strings
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}  // set the headers so AngularJS POSTs the data as form data (and not request payload, which CiviCRM doesn't recognise)
          });
        }
      }
    }
  ]);
})();