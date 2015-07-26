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
function($scope, auth, $state,location,$stateParams,yelpService,businesses,location){
	$scope.cat = $stateParams.cat;
	$scope.businesses = businesses.data.businesses;
	$scope.currLocation = location.getPosition();

	for(var i=0; i<$scope.businesses.length; i++){
		$scope.businesses[i].distance = location.calculateDistance($scope.businesses[i].location.coordinate.longitude,
			$scope.businesses[i].location.coordinate.latitude, $scope.currLocation.lng,$scope.currLocation.lat);
	}

}])