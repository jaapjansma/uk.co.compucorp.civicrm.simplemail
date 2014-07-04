/* Generic Services */
var services = angular.module('simpleMailApp.services', []);

services.factory("notificationServices",
  function() {
    var notificationEnabled = true;

    return {
      alert: function(subject, description ) {
        if (notificationEnabled) {
          description = description || '';
          CRM.alert(description, subject, 'alert');
        }
      },
      success: function(subject, description) {
        if (notificationEnabled) {
          description = description || '';
          CRM.alert(description, subject, 'success');
        }
      },
      info: function(subject, description) {
        if (notificationEnabled) {
          CRM.alert(description, subject, 'info');
        }
      },
      error: function(subject, description) {
        if (notificationEnabled) {
          CRM.alert(description, subject, 'error');
        }
      }
    };    
});

services.factory("loggingServices",
  function() {
    var loggingEnabled = true;

    return {
      createLog: function(subject, data) {
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
       * @param entityName
       * @returns {*}
       */
      get: function (entityName) {
        return $http.post('/civicrm/ajax/rest?json=1&sequential=1&entity=' + entityName + '&action=get');
      },

      /**
       * Create a new record for the given entity
       *
       * @param entityName
       * @param data
       * @returns {*}
       */
      create: function (entityName, data) {
        return $http.post('/civicrm/ajax/rest?json=1&sequential=1&entity=' + entityName + '&action=get', data);
      },

      /**
       * Update an existing record for the given entity
       *
       * @param entityName
       * @param data
       * @returns {*}
       */
      update: function (entityName, data) {
        data.entity = entityName;
        data.action = 'create';
        data.json = 1;

        // Because data needs to be sent as string for CiviCRM to accept
        var serialisedData = jQuery.param(data);

        return $http({
          method: 'POST',
          url: '/civicrm/ajax/rest',
          data: serialisedData,  // pass in data as strings
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }  // set the headers so AngularJS POSTs the data as form data (and not request payload, which CiviCRM doesn't recognise)
        });
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

      post: function (entityName, data, action) {
        data.entity = entityName;
        data.action = action;
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