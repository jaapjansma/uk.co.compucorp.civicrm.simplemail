(function () {
  "use strict";

  /**
   * @type {ng.IModule}
   */
  var filters = angular.module('simpleMail.filters', []);

  /**
   * @ngDoc filter
   * @name itemFromCollection
   * @kind function
   *
   * @description Search for an item by a key in a collection, and return it if found
   *
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

  /**
   * @ngDoc filter
   * @name filterMailings
   * @kind function
   */
  filters.filter('filterMailings', ['$filter',
    function ($filter) {
      return function (mailings, filters) {
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

  /**
   * @ngDoc filter
   * @name filterMailingsByStatus
   */
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

  /**
   * @ngDoc filter
   * @name filterMailingsByCreator
   */
  filters.filter('filterMailingsByCreator', [
    function () {
      return function (mailings, creatorId) {
        if (creatorId === 'all') return mailings;

        var filteredMailings = [];

        var currentMailing = null;
        for (var i = 0, iEnd = mailings.length; i < iEnd; i++) {
          currentMailing = mailings[i];

          if (currentMailing.hasOwnProperty('created_id') && currentMailing.created_id === creatorId) {
            filteredMailings.push(currentMailing);
          }
        }

        return filteredMailings;
      }
    }
  ]);

  /**
   * @ngDoc filter
   */
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

  /**
   * @ngDoc filter
   */
  filters.filter('unique', [
    function () {
      return function (items, uniqueKey) {
        var keys = [];
        var uniqueItems = [];

        uniqueKey = uniqueKey || 0;
        
        angular.forEach(items, function(value) {
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

  /**
   * @ngDoc filter
   */
  filters.filter('extractColumn', [
    function () {
      return function (collection, columns) {
        var extractedColumn = [];

        if (angular.isObject(collection) && angular.isObject(columns)) {
          angular.forEach(collection, function (item) {
            var row = {};

            angular.forEach(columns, function (column, alias) {
              if (angular.isObject(item) && item.hasOwnProperty(column) && item[column]) {
                row[alias] = item[column];
              }
            });

            extractedColumn.push(row);
          });
        }

        return extractedColumn;
      }
    }
  ]);


  /**
   * Get elements in array 1 that are not in array 2
   *
   * @ngdoc filter
   * @name arrayDiff
   *
   * @param {array} array1
   * @param {array} array2
   * @return {array}
   */
  var arrayDiff = [function () {
    return function (array1, array2) {
      var diff = [];

      for (var i = 0, end = array1.length; i < end; i++) {
        if (-1 === array2.indexOf(array1[i])) {
          diff.push(array1[i]);
        }
      }

      return diff;
    }
  }];

  angular.module('simpleMail.filters')
    .filter('arrayDiff', arrayDiff);
})();

