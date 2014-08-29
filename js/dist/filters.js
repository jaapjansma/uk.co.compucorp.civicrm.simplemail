(function () {
  "use strict";

  var filters = angular.module('simpleMail.filters', []);

  /**
   * Search for an item by a key in a collection, and return it if found
   *
   * @ngdoc filter
   * @name itemFromCollection
   * @param collection An array of objects or arrays
   * @param searchKey
   * @param searchValue
   * @returns object An object consisting of the item found (or null is not found) and its associated index (or
   * null if not found) in the collection
   */
  filters.filter('itemFromCollection', [
    function () {
      return function (collection, searchKey, searchValue) {
        var foundItem = {item: null, index: null};

        if (angular.isUndefined(collection) || angular.isUndefined(searchValue)) return foundItem;

        var currentItem = null;

        for (var i = 0, end = collection.length; i < end; i++) {
          currentItem = collection[i];

          // For both arrays and objects (since arrays are basically objects)
          if (angular.isObject(currentItem) && currentItem.hasOwnProperty(searchKey) && currentItem[searchKey] === searchValue) {
            foundItem.item = currentItem;
            foundItem.index = i;
          }
        }

        return foundItem;
      }
    }
  ]);

  filters.filter('filterMailings', ['$filter',
    function ($filter) {
      return function (mailings, filters) {
        // TODO (robin): Uncomment this - for testing only
        return mailings;
        if (! angular.isArray(mailings)) return false;

        if( ! angular.isObject(filters)) return mailings;

        var filteredMailings = mailings;

        if (filters.hasOwnProperty('status') && filters.status) {
          filteredMailings = $filter('filterMailingsByStatus')(mailings, filters.status);
        }

        if (filters.hasOwnProperty('creator') && filters.creator) {
          filteredMailings = $filter('filterMailingsByCreator')(filteredMailings, filters.creator);
        }

        return filteredMailings;
      }
    }
  ]);

  filters.filter('filterMailingsByStatus', [
    function () {
      return function (mailings, filters) {

        var activeFilters = [];

        angular.forEach(filters, function (value, key) {
          if (value) activeFilters.push(key);
        });

        var currentMailing = null;
        var filteredMailings = [];

        for (var i = 0, iEnd = mailings.length; i < iEnd; i++) {
          currentMailing = mailings[i];

          if (currentMailing.hasOwnProperty('status') && activeFilters.indexOf(currentMailing.status) !== -1) {
            filteredMailings.push(currentMailing);
          }
        }

        return filteredMailings;
      }
    }
  ]);

  filters.filter('filterMailingsByCreator', [
    function () {
      return function (mailings, creator) {
        if (angular.lowercase(creator) === 'all') return mailings;

        var currentMailing = null;
        var filteredMailings = [];

        for (var i = 0, iEnd = mailings.length; i < iEnd; i++) {
          currentMailing = mailings[i];

          if (currentMailing.hasOwnProperty('sort_name') && currentMailing.sort_name === creator) {
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

        uniqueKey = uniqueKey || 0;
        
        angular.forEach(items, function(value, key) {
          var candidate = null;
          if (angular.isObject(value) && value.hasOwnProperty(uniqueKey)) {
            candidate = value[uniqueKey];
          } else if (angular.isString(value)) {
            candidate = value;
          }

          if (keys.indexOf(candidate) === -1) {
            keys.push(candidate);
            uniqueItems.push(value);
          }

        });

        return uniqueItems;
      }
    }
  ]);

  filters.filter('extractColumn', [
    function () {
      return function (collection, column) {
        var extractedColumn = [];

        angular.forEach(collection, function (value, key) {
          if (angular.isObject(value) && value.hasOwnProperty(column) && value[column]) {
            extractedColumn.push(value[column]);
          }
        });

        return extractedColumn;
      }
    }
  ])
})();

