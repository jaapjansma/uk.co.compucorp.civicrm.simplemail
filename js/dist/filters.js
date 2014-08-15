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

  filters.filter('headersForSelectedFilter', ['uniqueFilter',
    function (unique) {
      return function (headers, filterId) {
        if (filterId === 'all') {
          return unique(headers, 'id');
        }

        if (!filterId) return headers;

        var filteredHeaders = [];

        angular.forEach(headers, function (value, key) {
          if (value.entity_id === filterId) {
            console.log('Value', value);
            filteredHeaders.push(value);
          }
        });

        return filteredHeaders;
      }
    }
  ]);

  filters.filter('unique', [
    function () {
      return function (items, uniqueKey) {
        var keys = [];
        var uniqueItems = [];
        
        angular.forEach(items, function(value, key) {
          if (keys.indexOf(value[uniqueKey]) === -1) {
            keys.push(value[uniqueKey]);
            uniqueItems.push(value);
          }
        });

        return uniqueItems;
      }
    }
  ]);
})();

