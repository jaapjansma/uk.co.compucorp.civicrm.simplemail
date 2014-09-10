(function () {
  "use strict";

  var constants = angular.module('simpleMail.constants', []);

  constants.constant('paths', {
    EXT_DIR: '/civicrm_custom/extensions/uk.co.compucorp.civicrm.simplemail',

    /**
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
})();