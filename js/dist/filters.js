(function () {
  "use strict";

  var filters = angular.module('simpleMail.filters', []);

  filters.filter('itemFromCollection', [
    function () {
      return function (collection, searchKey, searchValue, withIndex) {
        withIndex = withIndex || false;

        if (angular.isUndefined(collection)) return null;

        var currentItem = null;

        for (var i = 0, end = collection.length; i < end; i++) {
          currentItem = collection[i];

          if (angular.isArray(currentItem)) {
            if (searchKey in currentItem && currentItem[searchKey] === searchValue) {
              return withIndex ? {item: currentItem, index: i} : currentItem;
            }
          } else if (angular.isObject(currentItem)) {
            if (currentItem.hasOwnProperty(searchKey) && currentItem[searchKey] === searchValue) {
              return withIndex ? {item: currentItem, index: i} : currentItem;
            }
          }
        }

        return null;
      };
    }
  ]);

  filters.filter('mailingsByStatus', [
    function () {
      return function (mailings, filters) {
        if (! angular.isArray(mailings)) return false;

        var currentMailing = null;
        var filteredMailings = [];

        for (var i = 0, iEnd = mailings.length; i < iEnd; i++) {
          currentMailing = mailings[i];

          if (filters.indexOf(currentMailing.status) !== -1) {
            filteredMailings.push(currentMailing);
          }
        }

        return filteredMailings;
      }
    }
  ]);

  filters.filter('headersForSelectedFilter', [
    function () {
      return function (headers, filterId) {
        if (isNaN(filterId) && filterId === 'all') {
          return headers;
        }

        console.log('Selected Filter ID', filterId);

        if (!filterId) return headers;

        var filteredHeaders = [];

        angular.forEach(headers, function (value, key) {
          if (value.entity_id === filterId) {
            console.log('Value', value);
            filteredHeaders.push(value);
          }
        });

        console.log('Filtered headers', filteredHeaders);

        return filteredHeaders;
      }
    }
  ]);
})();
