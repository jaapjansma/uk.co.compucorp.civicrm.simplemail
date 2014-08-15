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
        templateUrl: paths.TEMPLATES_DIR() + '/image-uploader.html'
      };
    }
  ]);

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

              if (newVal.length && scope.selectedItemId) {
                scope.filteredItems = headersForSelectedFilter(newVal, scope.selectedFilterId);
                var item = itemFromCollection(scope.filteredItems, 'id', scope.selectedItemId, true);
                scope.selectedItem = item.item;
                scope.selectedIndex = item.index;
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

          scope.$watch(function () {
              return element.find('ul').find('img').length;
            },
            function (newVal, oldVal) {
              if (scope.selectedFilterId === 'all') {
                $timeout(function () {
                  scope.setWidth();
                }, 500);
              }
            });

          // Update the selected item's (in order to select the correct header image) index upon changing filter and
          // update the width of the carousel
          scope.$watch(function () {
              return scope.selectedFilterId;
            },
            function (newVal, oldVal) {
              console.log('--- Filter changed ---');

              scope.filteredItems = headersForSelectedFilter(scope.items, scope.selectedFilterId);
              var item = itemFromCollection(scope.filteredItems, 'id', scope.selectedItemId, true);
              if (item) {
                scope.selectedIndex = item.index;
              } else {
                scope.selectedIndex = null;
              }

              if (oldVal !== newVal) {
                $timeout(function () {
                  scope.setWidth();
                }, 500);
              }
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
