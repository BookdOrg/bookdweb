angular.module('cc.landing-controller',[])
    .controller('landingCtrl', [
      '$scope',
      function($scope){
        $scope.focus = function() {
          //$('#shop-search').focus();
          angular.element('#shop-search').focus();
        }
      }]);