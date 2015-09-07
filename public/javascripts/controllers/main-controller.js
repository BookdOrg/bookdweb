angular.module('cc.main-controller',["google.places"])
.controller('MainCtrl', [
'$scope',
'businessFactory',
'auth',
'$modal',
'$log',
'$geolocation',
'$http',
'location',
'categories',
'$rootScope',
'$window',
function($scope,businessFactory,auth,$modal,$log,$geolocation,$http,location,categories,$rootScope,$window){

  $scope.categories = businessFactory.categories;

  $geolocation.watchPosition({
        timeout: 60000,
        maximumAge: 250,
        enableHighAccuracy: true
      });
  $scope.myPosition = $geolocation.position;

  $scope.$watch('myPosition.coords.latitude',function(newVal,oldVal){
    if(newVal !== oldVal){
        location.setPosition($scope.myPosition.coords);
        $rootScope.currLocation = location.getPosition();
        $scope.loadingLocation = false;
    }
  })

}])
