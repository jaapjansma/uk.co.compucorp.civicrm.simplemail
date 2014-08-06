(function () {
  "use strict";

  var filters = angular.module('simpleMail.filters', []);

  filters.filter('itemFromCollection', [
    function () {
      return function (collection, searchKey, searchValue) {
        if (angular.isUndefined(collection)) return null;

        for (var i = 0, end = collection.length; i < end; i++) {
          if (searchKey in collection[i] && collection[i][searchKey] === searchValue) {

            return collection[i];
          }
        }

        return null;
      };
    }
  ]);
})();
