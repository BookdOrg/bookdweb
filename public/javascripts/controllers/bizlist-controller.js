angular.module('cc.bizlist-controller',[])
.controller('bizlistCtrl', [
'$scope',
'auth',
'$state',
'location',
'yelpService',
'$stateParams',
'businesses',
function($scope, auth, $state,location,$stateParams,yelpService,businesses){
	$scope.cat = $stateParams.cat;
	$scope.businesses = businesses.data.businesses;
}])