angular.module('cc.main-controller',["google.places"])
.controller('MainCtrl', [
'$scope',
'businessFactory',
'$controller',
function($scope,businessFactory,$controller){

  $scope.businesses = businessFactory.businesses;
  var navViewModel = $scope.$new();
  $controller('NavCtrl',{$scope : navViewModel });

  navViewModel.showSearch(true);


}])
