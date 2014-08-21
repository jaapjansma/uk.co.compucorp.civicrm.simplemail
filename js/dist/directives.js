(function () {
  "use strict";

  var directives = angular.module('simpleMail.directives', []);

  directives.directive('smImageUploader', ['paths',
    function (paths) {
      return {
        restrict: 'A',
        scope: {
          model: '=',
          uploader: '=',
          form: '=',
          config: '=',
          remove: '&onRemove'
        },
        templateUrl: paths.TEMPLATES_DIR() + '/image-uploader.html',
        link: function (scope) {
          scope.$watch(function () {
              return scope.config.required;
            }, function (newVal, oldVal) {
              if (['0', '1'].indexOf(newVal) !== -1) {
                scope.isRequired = +newVal ? true : false;
              }
              else if (['false', 'true'].indexOf(newVal) !== -1) {
                scope.isRequired = newVal === 'true';
              } else {
                scope.isRequired = newVal;
              }
            }
          );
        }
      };
    }
  ]);

  /**
   * @ngdoc directive
   */
  directives.directive('smSimpleImageCarousel', ['paths', '$timeout', '$rootScope', 'itemFromCollectionFilter', 'headersForSelectedFilterFilter',
    function (paths, $timeout, $rootScope, itemFromCollection, headersForSelectedFilter) {
      return {
        scope: {
          items: '=',
          selectedFilterId: '=',
          selectedItemId: '=',
          itemsLoaded: '='
        },
        templateUrl: paths.TEMPLATES_DIR() + '/simple-image-carousel.html',
        link: function (scope, element, attr) {
          scope.selectedIndex = null;
          scope.selectedItem = null;
          scope.filteredItems = [];

          scope.selectImage = function (index) {
            console.log('Image selected with index', index);
            scope.selectedIndex = index;
          };

          // Setup the index of saved selected image once all headers have been retrieved
          scope.$watchCollection(function () {
              return scope.items;
            },
            function (newVal, oldVal) {
              console.log(newVal);

              if (newVal.length) {
                scope.selectedFilterId = 'all';

                console.log('Selected item', scope.selectedItem);
              }
            });

          // Update selected header ID according to the image selected (clicked)
          scope.$watch(function () {
              return scope.selectedIndex;
            },
            function (newVal, oldVal) {
              if (newVal !== null) {
                scope.selectedItemId = scope.filteredItems[scope.selectedIndex].id;
                console.log('Item ID', scope.selectedItemId);
              }
            });

          // TODO (robin): This might not be needed anymore - delete in the future if things keep working as expected
//          scope.$watch(function () {
//              return element.find('ul').find('img').length;
//            },
//            function (newVal, oldVal) {
//              if (scope.selectedFilterId === 'all') {
//                $timeout(function () {
//                  scope.setWidth();
//                }, 500);
//              }
//            });

          scope.filterItems = function () {
            scope.filteredItems = headersForSelectedFilter(scope.items, scope.selectedFilterId);

            $timeout(function () {
              scope.setWidth();
            }, 200);
          };

          scope.updateSelection = function () {
            var item = itemFromCollection(scope.filteredItems, 'id', scope.selectedItemId);

            scope.selectedIndex = item.index;
          };

          /*
           Upon change of filter:
           1. change in filter will be detected, which will filter items using the new filter id (upon change of filter by the user)
           3. after filtering, update width

           Upon initial page load:
           1. change filter id (set it to 'all')
           2. change in filter will be detected, which will filter items using the new filter id
           3. after filtering, update width
           */

          // Update the selected item's (in order to select the correct header image) index upon changing filter and
          // update the width of the carousel
          scope.$watch(function () {
              return scope.selectedFilterId;
            },
            function (newVal, oldVal) {
              console.log('--- Filter changed ---');

              scope.filterItems();
              scope.updateSelection();
            }, true);

          scope.resetWidth = function () {
            element.find('ul').width('100%');
          };

          scope.setWidth = function () {
            var listElements = element.find('ul').find('img');
            var totalLength = 0;
            var currentLength = 0;

            if (listElements.length) {
              for (var i = 0; i < listElements.length; i++) {
                currentLength = $(listElements[i]).outerWidth(true);
                totalLength += currentLength;
                console.log(currentLength);
              }

              totalLength += totalLength * 0.005;
            } else {
              totalLength = '100%';
            }

            console.log('Total length', totalLength);

            element.find('ul').width(totalLength);
          }
        }
      }
    }
  ]);

  directives.directive('smCkEditor', [
    function () {
      return {
        require: '?ngModel',
        link: function (scope, element, attr, ngModel) {
          var ck = CKEDITOR.replace(element[0], {
            enterMode: CKEDITOR.ENTER_BR
          });

          if (!ngModel) return;

          ck.on('pasteState', function () {
            scope.$apply(function () {
              ngModel.$setViewValue(ck.getData());
            });
          });

          ngModel.$render = function (value) {
            ck.setData(ngModel.$viewValue);
          };
        }
      };
    }
  ]);

  directives.directive('smEmailPreviewer', [
    function () {
      function link(scope, element, attrs) {
        scope.$watch(attrs.emailContent, function (oldVal, newVal) {
          var content = oldVal ? oldVal : newVal;
          if (content) {
            var iframe = element[0];
            var doc = null;

            if (iframe.contentDocument) {
              doc = iframe.contentDocument;
            } else if (iframe.contentWindow) {
              doc = iframe.contentWindow.document;
            }

            // Write email contents into the iframe
            doc.open();
            doc.writeln(content);
            doc.close();
          }
        });
      }

      return {
        link: link
      };
    }
  ]);
})();
