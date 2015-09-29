angular.module('cc.main-controller',["google.places"])
.controller('MainCtrl', [
'$scope',
'businessFactory',
function($scope,businessFactory){

//  $scope.categories = businessFactory.categories;
  $scope.businesses = businessFactory.businesses;

  $scope.setBusiness = function(business){
    businessFactory.business = business;
  }

}])
