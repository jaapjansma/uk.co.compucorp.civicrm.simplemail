var directives = angular.module('simpleMail.directives', []);

directives.directive('smFileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function(scope, el, attrs) {
            var model = $parse(attrs.smFileModel);
            var modelSetter = model.assign;

            el.on('change', function(){
                console.log('changed');
                scope.$apply(function(){
                    modelSetter(scope, el[0].files[0]);
                });
            });
        }
    };
}]);