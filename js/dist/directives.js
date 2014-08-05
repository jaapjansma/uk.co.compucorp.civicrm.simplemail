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
      console.log('hello');
      return {
        require: '?ngModel',
        link: function (scope, elm, attr, ngModel) {
          var ck = CKEDITOR.replace(elm[0]);

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

})();
