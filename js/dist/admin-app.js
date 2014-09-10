(function () {
  "use strict";

// Structure:
//
// simpleMail.adminApp
// simpleMail.adminApp.controllers
//
// simpleMail.app
// simpleMail.app.controllers
//
// simpleMail.services
// simpleMail.filters
// simpleMail.directives
// simpleMail.constants

  /**
   * Simple Mail admin app
   *
   * @type {*}
   */
  var app = angular.module('simpleMail.adminApp', [
    'ngRoute',
    'ngAnimate',
    'ui.select2',
    'simpleMail.adminApp.controllers',
    'simpleMail.services',
    'simpleMail.directives',
    'simpleMail.constants',
    'angularFileUpload'
  ]);

  // TODO (robin): Remove this and use path constants
  function partialUrl(url) {
    return '/civicrm_custom/extensions/compucorp/uk.co.compucorp.civicrm.simplemail/partials/admin/' + url;
  }

  app.config(['$routeProvider', 'paths',
    function ($routeProvider, paths) {
      $routeProvider
        // TODO (robin): add resolvers to listing controllers in order to not render view until API has returned data
        .when('/headers', {
          templateUrl: paths.PARTIALS_DIR() + '/admin/listHeaders.html',
          controller: 'HeadersAdminController'
        })
        .when('/headers/:headerId/edit', {
          templateUrl: paths.PARTIALS_DIR() + '/admin/editHeader.html',
          controller: 'HeaderAdminController'
        })
        .when('/headers/new', {
          templateUrl: paths.PARTIALS_DIR() + '/admin/editHeader.html',
          controller: 'HeaderAdminController'
        })
        .when('/messages', {
          templateUrl: paths.PARTIALS_DIR() + '/admin/listMessages.html',
          controller: 'MessagesAdminController'
        })
        .otherwise({
          redirectTo: '/'
        })
    }
  ]);
})();
