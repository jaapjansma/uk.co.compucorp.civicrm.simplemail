// TODO (robin): Check code documentation towards the end to fix any inconsistencies due to code updates
// TODO (robin): Update select2 to 3.5.0 in order to fix: Cannot read property 'hasClass' of null

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

services.factory('mailingServices', ['$location', '$routeParams', 'civiApiServices', 'paths', 'utilityServices',
  function ($location, $routeParams, civiApi, paths, utility) {
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
        this.setStep(params.step);
        this.setScope(params.scope);

        this.setupMailing();
        this.setupButtons();
        this.setupPartials();

        return this;
      },

      /**
       * Setup and initialise the current mailing
       */
      setupMailing: function () {
        this.setMailingId($routeParams.mailingId);
      },


      /**
       * Set the scope for the mailing
       *
       * @param scope
       */
      setScope: function (scope) {
        this.config.scope = scope;
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

      /**
       * Get mailing by ID
       *
       * @param {int} id
       * @returns {*|Object|HttpPromise}
       */
      get: function (id) {
        // TODO (robin): Returning HTTP Promises throughout the services could be replaced with returning a generic promise and performing various validation and repetitive tasks in the service, rather that duplicating it in the controllers (e.g. generic implementation of success() and error() could be done within the service to improve re-usability, and a generic promise could be returned back so that every call to an HTTP service doesn't require boilerplate implementation of success() and error() repetitively
        return civiApi.get(constants.ENTITY, {id: id});
      },

      /**
       * Save progress of the mailing
       *
       * @param mailing
       * @returns {constants.ENTITY}
       */
      saveProgress: function (mailing) {
        if (this.getStep() === Steps.FIRST) {
          if (angular.isDefined(mailing.recipientGroupIds) && mailing.recipientGroupIds.length) {
            this.saveRecipientGroupIds(mailing.recipientGroupIds);
          }
        }

        return civiApi.create(constants.ENTITY, mailing);
      },


      saveRecipientGroupIds: function (newGroupIds) {
        var self = this;
        // TODO (robin): This could probably be optimised to avoid another API call
        this.getRecipientGroupIds().then(function (oldGroupIds) {
          console.log('Old groups', oldGroupIds);
          console.log('New groups', newGroupIds);

          var removed = utility.arrayDiff(oldGroupIds, newGroupIds);
          var added = utility.arrayDiff(newGroupIds, oldGroupIds);

          console.log('Removed', removed);
          console.log('Added', added);

          if (removed.length) {
            self.getRecipientGroups()
              .success(function (response) {
                var groups = response.values;

                for (var i = 0, end = removed.length; i < end; i++) {
                  var removeId = null;

                  angular.forEach(groups, function (value, key) {

                    if (value.entity_id === removed[i]) {
                      removeId = value.id;
                    }
                  });

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
            for (i = 0, end = added.length; i < end; i++) {
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
       *
       * @returns {*|Object|HttpPromise}
       */
      getCurrent: function () {
        var mailingId = this.getMailingId();

        return mailingId ? this.get(mailingId) : null;
      },

      getRecipientGroupIds: function () {
        return this.getRecipientGroups()
          .then(function (response) {
            var groupIds = [];

            if (!response.data.is_error) {
              var groups = response.data.values;

              for (var i = 0, end = groups.length; i < end; i++) {
                groupIds.push(groups[i].entity_id);
              }
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
        return civiApi.get('SimpleMailRecipientGroup', {mailing_id: this.getMailingId()});
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
       * Proceed to the next step of the mailing wizard
       *
       * @param mailing
       */
      nextStep: function (mailing) {
        var self = this;

        this.saveProgress(mailing)
          .success(function (response) {
            console.log('Save progress response', response);

            self.redirectToStep(++self.config.step);
          });
      },

      redirectToStep: function (step) {
        $location.path(getStepUrl({
          mailingId: this.getMailingId(),
          step: step
        }));
      },

      /**
       * Go back to the previous step of the mailing wizard
       *
       * @param mailing
       */
      prevStep: function (mailing) {
        var self = this;

        this.saveProgress(mailing)
          .success(function (response) {
            console.log('Save progress response', response);

            self.redirectToStep(--self.config.step);
          });
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

      getMailing: function () {
        return this.config.mailing;
      },

      setupButtons: function () {
        var self = this;
        var scope = this.getScope();
        var mailing = this.getMailing();

        // Set whether links to previous/next step be shown
        scope.showPrevStepLink = this.showPrevStepLink();
        scope.showNextStepLink = this.showNextStepLink();

        // Proceed to next step
        scope.nextStep = function () {
          self.nextStep(scope.mailing);
        };

        // Go back to previous step
        scope.prevStep = function () {
          self.prevStep(scope.mailing);
        }

        scope.cancel = function () {
          self.cancel();
        };

        return this;
      }
    }
  }
])
;

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