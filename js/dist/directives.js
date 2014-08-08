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
