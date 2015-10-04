angular.module('cc.main-controller',["google.places"])
.controller('MainCtrl', [
'$scope',
'businessFactory',
function($scope,businessFactory){

  $scope.businesses = businessFactory.businesses;

}])
