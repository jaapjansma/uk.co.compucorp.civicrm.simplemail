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
    'ui.select2',
    'ngQuickDate',
    'simpleMail.app.controllers',
    'simpleMail.services',
    'simpleMail.directives',
    'simpleMail.constants',
    'simpleMail.filters'
  ]);

  function partialUrl(url) {
    return '/civicrm_custom/extensions/compucorp/uk.co.compucorp.civicrm.simplemail/partials/wizard/steps/' + url;
  }

  app.config(['$routeProvider', 'paths', 'ngQuickDateDefaultsProvider',
    function ($routeProvider, paths, ngQuickDate) {
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
    }
  ]);
})();
