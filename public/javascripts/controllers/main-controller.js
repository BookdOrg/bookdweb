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
  $scope.businesses = businessFactory.businesses;

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


  /*
  * Function that will submit a search query to the /query route
  *
  *Takes in 1 paramater
  */

  $scope.search = function(query){
    $scope.fetchingQuery = true;
    var formattedQuery = query.term + " " + query.location;
    businessFactory.search(formattedQuery)
      .then(function(data){
        $scope.fetchingQuery = false;
      })
  }
  $scope.setBusiness = function(business){
    businessFactory.business = business;
  }

}])
