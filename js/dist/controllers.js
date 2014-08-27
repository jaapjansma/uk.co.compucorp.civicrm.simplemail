(function () {
  "use strict";

  /**
   * Controllers for the mailing wizard section of the app
   *
   * @type {*|module}
   */
  var controllers = angular.module('simpleMail.app.controllers', []);

  controllers.config(['$httpProvider', function ($httpProvider) {
    // This is needed (Utils/Rest.php::ajax()) for CiviCRM to treat the request as genuine
    $httpProvider.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
  }]);

  /**
   * Listing of mailing wizards
   */
  controllers.controller('MailingsController', [
    '$scope', '$http', '$q', 'civiApiServices', 'loggingServices', 'notificationServices',
    function ($scope, $http, $q, civiApi, log, notification) {

      $scope.constants = {
        ENTITY_NAME: 'SimpleMail'
      };

      $scope.mailingFilters = ['draft', 'scheduled'];

      civiApi.get($scope.constants.ENTITY_NAME)
        .then(function (response) {
          log.createLog('Mailings retrieved', response);
          $scope.mailings = response.data.values;
        })
        .then(function () {
          var now = Date.now();
          var scheduledDate = null;
          var mailing = null;

          for (var i = 0, iEnd = $scope.mailings.length; i < iEnd; i++) {
            var status = 'draft';
            mailing = $scope.mailings[i];

            if (mailing.hasOwnProperty('send_on')) {
              scheduledDate = Date.parse(mailing.send_on);

              if (mailing.crm_mailing_id) {
                if (scheduledDate < now) {
                  status = 'past';
                }
                else {
                  status = 'scheduled';
                }
              }
            }

            mailing.status = status;
          }
        })
        .catch(function (response) {
          console.log('Failed to retrieve mailing', response);
        });


      $scope.toggleFilter = function (filter) {
        var indexOfFilter = $scope.mailingFilters.indexOf(filter);
        
        if (indexOfFilter === -1) {
          $scope.mailingFilters.push(filter);
        } else {
          $scope.mailingFilters.splice(indexOfFilter, 1);
        }
      };

      $scope.deleteMailing = function (index) {
        var mailing = $scope.mailings[index];

        // First delete the corresponding CiviCRM mailing, if one exists
        if ('crm_mailing_id' in mailing) {
          civiApi.post('SimpleMail', {crmMailingId: mailing.crm_mailing_id}, 'deletemassemail')
            .then(function (response) {
              if (response.data.is_error) return $q.reject(response);

              console.log(response);
              return response;
            })
            // Delete the Simple Mail mailing, if the deletion of CiviCRM mailing is successful
            .then(function () {
              civiApi.remove($scope.constants.ENTITY_NAME, mailing)
                .then(function (response) {
                  if (response.data.is_error) return $q.reject(response);

                  console.log(response);

                  notification.success('Mailing deleted');
                  $scope.mailings.splice(index, 1);

                  return response;
                })
                .catch(function (response) {
                  // Forward the rejection
                  $q.reject(response);
                });
            })
            .catch(function (response) {
              notification.error('Failed to delete mailing due to an error');
              console.log('Failed to delete mailing due to an error', response);
            });
        } else {
          civiApi.remove($scope.constants.ENTITY_NAME, mailing)
            .then(function (response) {
              if (response.data.is_error) return $q.reject(response);

              console.log(response);

              notification.success('Mailing deleted');
              $scope.mailings.splice(index, 1);

              return response;
            })
            .catch(function (response) {
              notification.error('Failed to delete mailing due to an error');
              console.log('Failed to delete mailing due to an error', response);
            });
        }
      };
    }
  ]);

  /**
   * Step 1 of the wizard
   */
  controllers.controller('CreateMailingController', [
    '$scope', '$http', '$routeParams', '$location', 'civiApiServices', 'loggingServices', 'notificationServices', 'paths', 'mailingServices',
    function ($scope, $http, $routeParams, $location, civiApi, log, notification, paths, mailing) {
      // Initialise the step
      mailing.initStep({step: 1, scope: $scope});

      $scope.constants = {
        ENTITY_NAME: 'Group'
      };

      // Initialise empty mailing
      $scope.mailing = {};

      mailing.getMailing()
        .then(function (response) {
          $scope.mailing = response;
        })
        // Group IDs are set within 'then' below as, otherwise, $scope.mailing would get overridden by the above 'then',
        // in case group IDs got retrieve before the mailing. Chaining it to promise like done here solves this.
        .then(function () {
          mailing.getRecipientGroupIds().then(function (response) {
            $scope.mailing.recipientGroupIds = response;
          });
        });

      // Get the list of mailing recipient groups
      civiApi.get($scope.constants.ENTITY_NAME)
        .success(function (response) {
          log.createLog('Groups retrieved', response);
          $scope.groups = response.values;
        });
    }
  ]);

  /**
   * Step 2 of the wizard
   */
  controllers.controller('ComposeMailingController', [
    '$scope', '$timeout', '$http', '$routeParams', '$location', '$q', 'civiApiServices', 'loggingServices', 'notificationServices', 'paths', 'mailingServices', 'itemFromCollectionFilter',
    function ($scope, $timeout, $http, $routeParams, $location, $q, civiApi, log, notification, paths, mailing, itemFromCollection) {
      $scope.models = {
        selectedMessage: {},
        headersLoaded: false
      };

      $scope.headers = [];

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
    '$scope', '$http', '$routeParams', '$location', 'civiApiServices', 'loggingServices', 'notificationServices', 'mailingServices',
    function ($scope, $http, $routeParams, $location, civiApi, log, notification, mailing) {
      // Initialise the step
      mailing.initStep({step: 3, scope: $scope});

      $scope.constants = {
        ENTITY_NAME: 'Group'
      };

      // Initialise empty mailing
      $scope.mailing = {};

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
        .success(function (response) {
          log.createLog('Groups retrieved', response);
          $scope.groups = response.values;
        });
    }
  ]);

  /**
   * Step 4 of the wizard
   */
  controllers.controller('ScheduleAndSendController', [
    '$scope', '$http', '$routeParams', '$location', 'civiApiServices', 'loggingServices', 'notificationServices', 'mailingServices',
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
