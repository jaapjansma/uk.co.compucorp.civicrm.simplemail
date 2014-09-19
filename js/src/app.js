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
