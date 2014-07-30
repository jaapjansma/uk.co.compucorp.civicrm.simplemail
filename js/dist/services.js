/**
 * Generic services
 *
 * @type {*|module}
 */
var services = angular.module('simpleMail.services', []);

services.factory('mailingServices', ['$location', '$routeParams', 'civiApiServices', 'paths',
  function ($location, $routeParams, civiApi, paths) {
    var constants = {
      ENTITY: 'SimpleMail'
    };

    /**
     * The ID of the current mailing
     * @type {$scope.mailingId|*}
     */
    var mailingId = $routeParams.mailingId || null;

    /**
     * First step of the mailing wizard
     *
     * @type {number}
     */
    var firstStep = 1;

    /**
     * Last step of the mailing wizard
     *
     * @type {number}
     */
    var lastStep = 4;

    /**
     * Current step of the wizard, initialised to first step
     *
     * @type {number}
     */
    var currentStep = firstStep;

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
    var getStepUrl = function () {
      return pathRoot + '/' + mailingId + '/steps/' + currentStep;
    };

    return {
      /**
       * Get mailing by ID
       *
       * @param id
       * @returns {*|Object|HttpPromise}
       */
      get: function (id) {
        return civiApi.get(constants.ENTITY, {id: id});
      },

      /**
       * Save progress of the mailing
       *
       * @param mailing
       * @returns {constants.ENTITY}
       */
      saveProgress: function (mailing) {
        if (currentStep === firstStep) {
          if (angular.isDefined(mailing.recipientGroupIds) && mailing.recipientGroupIds.length) {
            this.saveRecipientGroupIds(mailing.recipientGroupIds);
          }
        }

        return civiApi.create(constants.ENTITY, mailing);
      },


      saveRecipientGroupIds: function (groups) {
//        civiApi.get('SimpleMailRecipientGroup', {mailing_id: mailingId})
        this.getRecipientGroups()
          .success(function (response) {
            console.log('Existing Groups', response.values);
            console.log('Current Groups', groups);

            if (response.values.length) {
              console.log('More than 1');

            } else {
              console.log('Nothing found, adding');
              for (var i = 0, end = groups.length; i < end; i++) {
                var data = {
                  mailing_id: mailingId,
                  group_type: 'Included',
                  entity_table: 'civicrm_group',
                  entity_id: groups[i]
                };

                civiApi.create('SimpleMailRecipientGroup', data)
                  .success(function (response) {
                    console.log('Added', response);
                  })
                  .error(function (response) {
                    console.log('Failed to add', response);
                  });
              }
            }

          })
          .error(function (response) {

          });
      },

      /**
       * Get the current mailing (as specified by the mailing ID in the URL segment)
       *
       * @returns {*|Object|HttpPromise}
       */
      getCurrent: function () {
        return mailingId ? this.get(mailingId) : null;
      },

      /**
       * Get all recipient groups for the current mailing
       *
       * @returns {*|Object|HttpPromise|*|Object|HttpPromise}
       */
      getRecipientGroups: function () {
        return civiApi.get('SimpleMailRecipientGroup', {mailing_id: mailingId});
      },

      /**
       * Set the current step. This should be defined at each step in order for next/prev step buttons to work correctly.
       *
       * @param step
       */
      setCurrentStep: function (step) {
        currentStep = step;
      },

      /**
       * Proceed to the next step of the mailing wizard
       *
       * @param mailing
       */
      nextStep: function (mailing) {
        this.saveProgress(mailing)
          .success(function (response) {
            console.log('Save progress response', response);

            currentStep++;
            $location.path(getStepUrl());
          });
      },

      /**
       * Go back to the previous step of the mailing wizard
       *
       * @param mailing
       */
      prevStep: function (mailing) {
        this.saveProgress(mailing)
          .success(function (response) {
            console.log('Save progress response', response);

            currentStep--;
            $location.path(getStepUrl());
          });
      },

      /**
       * Get the partial path for the current step
       *
       * @returns {string}
       */
      getStepPartialPath: function () {
        return paths.PARTIALS_DIR() + '/wizard/steps/step-' + currentStep + '.html';
      },

      /**
       * Whether the link to previous step be shown
       *
       * @returns {boolean}
       */
      showPrevStepLink: function () {
        return currentStep !== firstStep;
      },

      /**
       * Whether the link to next step be shown
       *
       * @returns {boolean}
       */
      showNextStepLink: function () {
        return currentStep !== lastStep;
      }
    }
  }
]);

services.factory("pathServices", [
  function () {
    return {
      getPartialUrl: function(file) {
        return this._getPartialsRootDir() + '/' + file;
      },
      _getPartialsRootDir: function () {
        return '/civicrm_custom/extensions/compucorp/uk.co.compucorp.civicrm.simplemail/partials';
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
       * @param entityName
       * @returns {*}
       */
      get: function (entityName, config) {
        var data = config || {};
        return this.post(entityName, data, 'get');
      },

      /**
       * Return value corresponding to the given name for the entity
       *
       * @param entityName
       * @param config
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