(function () {
  "use strict";

  var constants = angular.module('simpleMail.constants', []);

  constants.constant('paths', {
    // TODO (robin): Make this dynamic
    EXT_DIR: '/sites/all/extensions/uk.co.compucorp.civicrm.simplemail',

    /**
     * TODO (robin): This could potentially be refactor so that the interface for using this could become more consistent and be like constants.TEMPLATE_DIR, instead of constants.TEMPLATE_DIR() - this can be achieved by returning a reference to a function. e.g. TEMPLATE_DIR: _getTemplatesDir()
     * @return {string}
     */
    TEMPLATES_DIR: function () {
      return this.EXT_DIR + '/js/dist/templates'
    },
    /**
     * @return {string}
     */
    PARTIALS_DIR: function () {
      return this.EXT_DIR + '/partials'
    }
  });

  constants.constant('config', {
    /**
     * Disable this to globally disable ALL methods of $log service within the application
     */
    LOGGING_ENABLED: true,

    // Fine grained control over $log methods
    LOG_LOG: true,
    LOG_INFO: true,
    LOG_WARNING: true,
    LOG_ERROR: true,
    LOG_DEBUG: true
  });
})();