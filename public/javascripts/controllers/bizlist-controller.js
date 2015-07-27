angular.module('cc.bizlist-controller',[])
.controller('bizlistCtrl', [
'$scope',
'auth',
'$state',
'location',
'yelpService',
'$stateParams',
'businesses',
'location',
'$rootScope',
function($scope, auth, $state,location,$stateParams,yelpService,businesses,location,$rootScope){
	$scope.cat = $stateParams.cat;
	$scope.businesses = businesses.data.businesses;
	
	for(var i=0; i<$scope.businesses.length; i++){
		$scope.businesses[i].distance = location.calculateDistance($scope.businesses[i].location.coordinate.longitude,
			$scope.businesses[i].location.coordinate.latitude, $rootScope.currLocation.lng,$rootScope.currLocation.lat);
	}

}])