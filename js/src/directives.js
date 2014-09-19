(function () {
  "use strict";

  /**
   * Directive to create an image uploader, with drag-n-drop support
   *
   * @ngdoc directive
   * @name smImageUploader
   * @alias smImageUploader
   *
   * @restrict AE
   * @element ANY
   *
   * @param {expression} model Model for the image
   * @param {expression} uploader Reference to the image uploader
   * @param {expression} onRemove Action to perform when the remove button is clicked
   * @param {object} config Configuration for the directive
   *
   * @type {*[]}
   */
  var smImageUploaderDirective = ['paths', function (paths) {
    function link(scope) {
      scope.$watch(function () {
          return scope.config.required;
        }, function (newVal) {
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

    return {
      restrict: 'AE',
      scope: {
        model: '=',
        uploader: '=',
        config: '=',
        remove: '&onRemove'
      },
      templateUrl: paths.TEMPLATES_DIR() + '/image-uploader.html',
      link: link
    };
  }];

  /**
   * A directive to create a simple horizontal image carousel
   *
   * @ngdoc directive
   * @name smImageCarousel
   * @alias smImageCarousel
   *
   * @restrict AE
   * @element ANY
   *
   * @param {array} items
   * @param {number} selectedFilterId
   * @param {number} selectedItemId
   * @param {boolean} itemsLoaded
   *
   * @type {*[]}
   */
  var smImageCarouselDirective = ['paths', '$timeout', '$rootScope', 'itemFromCollectionFilter', 'headersForSelectedFilterFilter',
    function (paths, $timeout, $rootScope, itemFromCollection, headersForSelectedFilter) {
      function link(scope, element) {
        scope.selectedIndex = null;
        scope.selectedItem = null;
        scope.filteredItems = [];

        // Setup the index of saved selected image once all headers have been retrieved
        scope.$watchCollection(function () {
            return scope.items;
          },
          function (newVal) {
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
          function (newVal) {
            if (newVal !== null) {
              scope.selectedItemId = scope.filteredItems[scope.selectedIndex].id;
              console.log('Item ID', scope.selectedItemId);
            }
          });

        // This will make sure that, even if selectedItemId was received late, the selectedIndex is set correctly
        scope.$watch(function () {
            return scope.selectedItemId;
          },
          function (newVal) {
            if (newVal) {
              scope.updateSelection();
            }
          }
        );

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
          function () {
            console.log('--- Filter changed ---');

            scope.filterItems();
            scope.updateSelection();
          }, true);

        // Filter items based on the currently selected filter and update the carousel width
        scope.filterItems = function () {
          scope.filteredItems = headersForSelectedFilter(scope.items, scope.selectedFilterId);

          $timeout(function () {
            scope.setWidth();
          }, 200);
        };

        /**
         * Select an image when it is clicked
         *
         * @param {number} index
         */
        scope.selectImage = function (index) {
          console.log('Image selected with index', index);
          scope.selectedIndex = index;
        };

        // Update the index of the selected item to the item's relative position in the currently filtered list
        // This will make sure that correct image is highlighted as selected even when the list is filtered
        scope.updateSelection = function () {
          var item = itemFromCollection(scope.filteredItems, 'id', scope.selectedItemId);

          scope.selectedIndex = item.index;
        };

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

      return {
        restrict: 'AE',
        scope: {
          items: '=',
          selectedFilterId: '=',
          selectedItemId: '=',
          itemsLoaded: '='
        },
        templateUrl: paths.TEMPLATES_DIR() + '/simple-image-carousel.html',
        link: link
      }
    }];

  /**
   * A directive to make the CK Editor work in AngularJS app
   *
   * @ngdoc directive
   * @name smCkEditor
   * @alias smCkEditor
   *
   * @restrict A
   * @element textarea
   *
   * @param {ngModel} ngModel The text to be edited in the CK Editor
   *
   * @type {*[]}
   */
  var smCkEditorDirective = [function () {
    function link(scope, element, attributes, ngModel) {
      var ck = CKEDITOR.replace(element[0], {
        enterMode: CKEDITOR.ENTER_BR
      });

      if (!ngModel) return;

      ck.on('pasteState', function () {
        scope.$apply(function () {
          ngModel.$setViewValue(ck.getData());
        });
      });

      ngModel.$render = function () {
        ck.setData(ngModel.$viewValue);
      };
    }

    return {
      require: '?ngModel',
      restrict: 'A',
      link: link
    }
  }];


  /**
   * A directive to embed a preview of email HTML
   *
   * @ngdoc directive
   * @name smEmailPreviewer
   * @alias smEmailPreviewer
   *
   * @restrict A
   * @element iframe
   *
   * @param {string} emailContent The HTML content of the email
   *
   * @type {*[]}
   */
  var smEmailPreviewerDirective = [function () {
    function link(scope, element, attributes) {
      scope.$watch(attributes.emailContent, function (oldVal, newVal) {
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
      restrict: 'A',
      link: link
    }
  }];

  /**
   * A directive to create action buttons next to each mailing on the listing of mailings
   *
   * @ngdoc directive
   * @name smMailingActionButtons
   * @alias smMailingActionButtons
   *
   * @restrict AE
   * @element ANY
   *
   * @param {object} mailing The mailing object
   * @param {object} status-constants An object containing mailing status constants
   * @param {string} onDelete Action to perform on clicking on the delete button
   * @param {string} onCancel Action to perform on clicking of the cancel button
   *
   * @type {*[]}
   */
  var smMailingActionButtonsDirective = ['paths', function (paths) {
    return {
      restrict: 'AE',
      scope: {
        mailing: '=',
        constants: '=statusConstants',
        duplicate: '&onDuplicate',
        delete: '&onDelete',
        cancel: '&onCancel'
      },
      templateUrl: paths.TEMPLATES_DIR() + '/action-buttons.html'
    }
  }];

  angular.module('simpleMail.directives', [])
    .directive('smImageUploader', smImageUploaderDirective)
    .directive('smImageCarousel', smImageCarouselDirective)
    .directive('smCkEditor', smCkEditorDirective)
    .directive('smEmailPreviewer', smEmailPreviewerDirective)
    .directive('smMailingActionButtons', smMailingActionButtonsDirective)
  ;

})();