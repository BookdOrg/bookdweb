/**
 * Created by khalilbrown on 2/21/16.
 */
module.exports = function(){
    return{
        restrict: 'E',
        link: function(scope, element, attrs, controller){
            scope.$watch(function() {return element.attr('navbar-shrink'); }, function(newValue){
                debugger;
                console.log(newValue);
            });
        }
    }
};