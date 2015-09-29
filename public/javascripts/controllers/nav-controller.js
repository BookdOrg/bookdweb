angular.module('cc.nav-controller',["google.places"])
.controller('NavCtrl', [
'$scope',
'auth',
'$state',
'businessFactory',
'$rootScope',
'$geolocation',
'$http',
'location',
function($scope, auth, $state,businessFactory,$rootScope,$geolocation,$http,location){
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;
  $scope.logOut = auth.logOut;

  $scope.query = {
      location:null,
      term:null
  }
  $scope.autocompleteOptions = {
    componentRestrictions: {country: 'us'},
    types:['(cities)']
  }
    $geolocation.watchPosition({
        timeout: 60000,
        maximumAge: 250,
        enableHighAccuracy: true
    });
    $scope.myPosition = $geolocation.position;
    $scope.$watch('myPosition.coords.latitude',function(newVal,oldVal){
        $scope.loadingLocation = true;
        if(newVal !== oldVal){
            $scope.loadingLocation = false;
            $http.get('http://maps.googleapis.com/maps/api/geocode/json?latlng='+$scope.myPosition.coords.latitude+","
                + $scope.myPosition.coords.longitude+"&sensor=true")
                .success(function(data){
                    $scope.loadingLocation = false;
                    if(data){
                        location.setPosition(data.results);
                        $rootScope.currLocation = location.currPosition;
                        $scope.query.location = $rootScope.currLocation.city;

                    }
                });
        }
    })



  $scope.search = function(query){
    $scope.fetchingQuery = true;
    var formattedQuery = query.term + " " + query.location;
    businessFactory.search(formattedQuery)
        .then(function(data){
            $scope.fetchingQuery = false;
            if(!$state.is('home')){
                $state.go('home');
            }
        })
  }

}])