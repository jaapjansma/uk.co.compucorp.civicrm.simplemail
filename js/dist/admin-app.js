(function () {
  "use strict";

  /**
   * Simple Mail admin app
   *
   * @name simpleMail.adminApp
   * @type {ng.IModule}
   */
  var app = angular.module('simpleMail.adminApp', [
    'ngRoute',
    'ngAnimate',
    'ui.select',
    'simpleMail.adminApp.controllers',
    'simpleMail.services',
    'simpleMail.directives',
    'simpleMail.constants',
    'angularFileUpload'
  ]);

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
        });
    }
  ]);
})();
