// TODO (robin): Check code documentation towards the end to fix any inconsistencies due to code updates
// TODO (robin): Update select2 to 3.5.0 in order to fix: Cannot read property 'hasClass' of null

(function () {
  "use strict";

  /**
   * Generic services
   *
   * @type {*|module}
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

  services.factory('mailingServices', ['$location', '$routeParams', '$q', 'civiApiServices', 'paths', 'utilityServices', 'notificationServices',
    function ($location, $routeParams, $q, civiApi, paths, utility, notification) {
      var constants = {
        ENTITY: 'SimpleMail'
      };

      /**
       * Steps for the mailing wizard
       *
       * @enum {number}
       */
      var Steps = {
        FIRST: 1,
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
       * @returns {string}
       */
      var getStepUrl = function (params) {
        return pathRoot + '/' + params.mailingId + '/steps/' + params.step;
      };

      /**
       * Get the partial path for the current step
       *
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
           */
          mailingId: null,

          /**
           * The current mailing object
           */
          mailing: null,

          /**
           * Current step of the wizard, initialised to first step
           */
          step: Steps.FIRST
        },

        /**
         * Initialise a step
         *
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
         * @returns {null|number}
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

        setMailing: function (mailing) {
          this.config.mailing = mailing;
//           this.config.mailing = $q.when(mailing);
        },

        /**
         * Get mailing by ID
         *
         * @param {int} id
         * @returns {*|Object|HttpPromise}
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
          var self = this;

          var date = new Date();

          var year = date.getFullYear(),
            month = String('00' + (1 + date.getMonth())).slice(-2),
            day = String('00' + date.getDate()).slice(-2),
            hours = String('00' + date.getHours()).slice(-2),
            minutes = String('00' + date.getMinutes()).slice(-2),
            seconds = String('00' + date.getSeconds()).slice(-2);

          var now = year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;

          this.getMailing().then(function (response) {
            var mailing = response;

            if (mailing.send_immediately === "1") {
              // If the mailing already has an associated CiviCRM mail, don't do anything
              if ('crm_mailing_id' in mailing) {
                return false;
              } else {
                mailing.send_on = now;
              }
            }

            // Save the mailing
            civiApi.create(constants.ENTITY, mailing)
              .then(function () {
                // Send the API request to submit mass email
                civiApi.post('SimpleMail', {id: self.getMailingId()}, 'submitmassemail')
                  .then(function (response) {
                    if (response.data.is_error) return $q.reject(response);

                    console.log(response);
                    mailing.crm_mailing_id = response.data.crmMailingId;

                    civiApi.create(constants.ENTITY, mailing)
                      .then(function(response) {
                        console.log(response);
                        notification.success('Mailing submitted for mass emailing');

                        redirectToListing();
                      });

                    return true;
                  })
                  .catch(function (response) {
                    console.log('Failed to submit mailing for mass email', response);
                  });
              });
          });
        },

        /**
         * Save progress of the mailing
         *
         * @returns {constants.ENTITY}
         */
        saveProgress: function () {
          var self = this;

          return this.getMailing().then(function (response) {
            var mailing = response;

            return civiApi.create(constants.ENTITY, mailing)
              .then(function (response) {
                if (response.data.is_error) return $q.reject(response);

                console.log('Mailing saved', response);

                if (isNaN(self.getMailingId())) {
                  self.setMailingId(+response.data.values[0].id);
                }
              })
              // Group IDs need to be saved *after* saving mailing as in case of a new mailing there won't be a mailing
              // ID. However, by saving the mailing first, we can get the id of the newly created mailing.
              .then(function () {
                if (self.getStep() === Steps.FIRST) {
                  if (angular.isDefined(mailing.recipientGroupIds) && mailing.recipientGroupIds.length) {
                    self.saveRecipientGroupIds(mailing.recipientGroupIds);
                  }
                }
              });
          });
       },

        /**
         * Save recipient group IDs for the mailing in the linking table. This adds or remove entries from the linking
         * table, depending upon whether groups were added or deleted.
         *
         * @param newGroupIds
         */
        saveRecipientGroupIds: function (newGroupIds) {
          var self = this;

          // TODO (robin): This could probably be optimised to avoid the additional API call
          this.getRecipientGroupIds().then(function (oldGroupIds) {
            console.log('Old groups', oldGroupIds);
            console.log('New groups', newGroupIds);

            var removed = utility.arrayDiff(oldGroupIds, newGroupIds);
            var added = utility.arrayDiff(newGroupIds, oldGroupIds);

            console.log('Removed', removed);
            console.log('Added', added);

            if (removed.length) {
              self.getRecipientGroups()
                .then(function (response) {
                  for (var i = 0, iEnd = removed.length; i < iEnd; i++) {
                    var removeId = null;

                    for (var j = 0, jEnd = response.length; j < jEnd; j++) {
                      if (response[j].entity_id === removed[i]) {
                        removeId = +response[j].id;
                      }
                    }

                    civiApi.remove('SimpleMailRecipientGroup', {id: removeId})
                      .success(function (response) {
                        if (!response.is_error) {
                          console.log('Group deleted', response);
                        } else {
                          console.log('Failed to delete group', response);
                        }
                      })
                      .error(function (response) {
                        console.log('Failed to delete group', response);
                      });
                  }
                });
            }

            if (added.length) {
              for (var i = 0, end = added.length; i < end; i++) {
                var data = {
                  mailing_id: self.getMailingId(),
                  group_type: 'Included',
                  entity_table: 'civicrm_group',
                  entity_id: added[i]
                };

                civiApi.create('SimpleMailRecipientGroup', data)
                  .success(function (response) {
                    if (!response.is_error) {
                      console.log('Group added', response);
                    } else {
                      console.log('Failed to add group', response);
                    }
                  })
                  .error(function (response) {
                    console.log('Failed to add group', response);
                  });
              }
            }
          });
        },

        /**
         * Get the current mailing (as specified by the mailing ID in the URL segment)
         * @deprecated TODO (robin): Remove this as no longer being used
         * @returns {*|Object|HttpPromise}
         */
        getCurrent: function () {
          var mailingId = this.getMailingId();

          return mailingId ? this.get(mailingId) : null;
        },

        getRecipientGroupIds: function () {
          var self = this;

          console.log('Message ID', self.config.scope.mailing.message_id);
          return this.getRecipientGroups()
            .then(function (response) {
              var groupIds = [];
              console.log('Message ID', self.config.scope.mailing.message_id);

              for (var i = 0, end = response.length; i < end; i++) {
                groupIds.push(response[i].entity_id);
              }

              console.log('Group IDs', groupIds);

              return groupIds;
            });
        },

        /**
         * Get all recipient groups for the current mailing
         *
         * @returns {*|Object|HttpPromise|*|Object|HttpPromise}
         */
        getRecipientGroups: function () {
          return civiApi.get('SimpleMailRecipientGroup', {mailing_id: this.getMailingId()})
            .then(function (response) {
              if (response.data.is_error) return $q.reject(response);

              console.log('Recipient groups retrieved', response);
              return response.data.values;
            });
        },

        /**
         * Set the current step. This should be defined at each step in order for next/prev step buttons to work correctly.
         *
         * @param step
         * @returns {*}
         */
        setStep: function (step) {
          this.config.step = step;

          return this;
        },

        /**
         * Go back to the previous step of the mailing wizard
         *
         * @param mailing
         */
        prevStep: function (mailing) {
          var self = this;

          this.saveProgress()
            .then(function () {
              self.redirectToStep(--self.config.step);
            })
            .catch(function (response) {
              console.log('Failed to save progress', response);
            });
        },

        /**
         * Proceed to the next step of the mailing wizard
         *
         * @param mailing
         */
        nextStep: function () {
          var self = this;

          this.saveProgress()
            .then(function () {
              self.redirectToStep(++self.config.step);
            })
            .catch(function (response) {
              console.log('Failed to save progress', response);
            });
        },

        redirectToStep: function (step) {
          $location.path(getStepUrl({
            mailingId: this.getMailingId(),
            step: step
          }));
        },

        cancel: function () {
          $location.path(pathRoot);
        },

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

        setupButtons: function () {
          var self = this;
          var scope = this.getScope();


          // Set whether links to previous/next step be shown
          scope.showPrevStepLink = this.showPrevStepLink();
          scope.showNextStepLink = this.showNextStepLink();

          if (this.getStep() === Steps.LAST) scope.showSubmitMassEmailLink = true;

          // Proceed to next step
          scope.nextStep = function () {
            self.setMailing(scope.mailing);
            self.nextStep();
          };

          // Go back to previous step
          scope.prevStep = function () {
            self.setMailing(scope.mailing);
            self.prevStep();
          }

          scope.submitMassEmail = function() {
            self.setMailing(scope.mailing);
            self.submitMassEmail();
          }

          scope.cancel = function () {
            self.cancel();
          };

          return this;
        }
      }
    }
  ]);

// TODO (robin): use the builtin log service of AngularJS and decorate it with custom behavior rather than this below
  services.factory("notificationServices", ['loggingServices',
    function (log) {
      /**
       * Enable or disable all notifications
       *
       * @type {boolean}
       */
      var notificationEnabled = true;

      /**
       * Enable or disable logging of notifications
       * @type {boolean}
       */
      var logNotifications = true;

      /**
       * Notification status constants for passing as argument to CiviCRM notification function
       *
       * @type {{}}
       */
      var notificationTypes = {
        SUCCESS: 'success',
        ERROR: 'error',
        INFO: 'info',
        ALERT: 'alert'
      };

      return {
        alert: function (subject, description) {
          this._createCrmNotication(subject, description, notificationTypes.ALERT);
        },

        success: function (subject, description) {
          this._createCrmNotication(subject, description, notificationTypes.SUCCESS);
        },

        info: function (subject, description) {
          this._createCrmNotication(subject, description, notificationTypes.INFO);
        },

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
        // TODO (robin): this might not be needed/used - remove later
        status: {
          SUCCESS: 'success',
          FAILURE: 'failure'
        },

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
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }  // set the headers so AngularJS POSTs the data as form data (and not request payload, which CiviCRM doesn't recognise)
          });
        }
      }
    }
  ]);
})();