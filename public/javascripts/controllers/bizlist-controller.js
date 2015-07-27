angular.module('cc.bizlist-controller',[])
.controller('bizlistCtrl', [
'$scope',
'auth',
'$state',
'location',
'yelpService',
'businesses',
'location',
'$rootScope',
function($scope, auth, $state,location,yelpService,businesses,location,$rootScope){
	$scope.businesses = businesses.data.businesses;
	$scope.cat = $scope.businesses[0].categories[0][0];

		for(var i=0; i<$scope.businesses.length; i++){
			if($rootScope.currLocation){
				$scope.businesses[i].distance = location.calculateDistance($scope.businesses[i].location.coordinate.longitude,
				$scope.businesses[i].location.coordinate.latitude, $rootScope.currLocation.lng,$rootScope.currLocation.lat);	
			}else{
				$scope.businesses[i].distance = "N/A";
			}
			
		}

}])