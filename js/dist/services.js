/* Generic Services */
var services = angular.module('simpleMail.services', []);

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
      // todo: this might not be needed/used - remove later
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
        var data = config ? config : {};
//        var data = id ? {id: id} : {};
        return this._post(entityName, data, 'get');
      },

      /**
       * Create a new record for the given entity
       *
       * @param entityName
       * @param data
       * @returns {*}
       */
      create: function (entityName, data) {
        return this._post(entityName, data, 'create');
      },

      /**
       * Update an existing record for the given entity
       *
       * @param entityName
       * @param data
       * @returns {*}
       */
      update: function (entityName, data) {
        return this._post(entityName, data, 'create');
      },

      /**
       * Delete a record for the given entity
       *
       * @param entityName
       * @param data
       * @returns {*}
       */
      remove: function (entityName, data) {
        return this._post(entityName, data, 'delete')
      },

      /**
       * Wrapper to configure HTTP post request and send it to the CiviCRM API for various actions
       *
       * @param entityName
       * @param data
       * @param action
       * @returns {*}
       */
      _post: function (entityName, data, action) {
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