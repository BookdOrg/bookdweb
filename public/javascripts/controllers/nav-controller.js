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

    /**
     *
     * Watch for when the users location changes, make a call to the google maps api to
     * get information about the users current location.
     *
     * Auto populate that information in the query location object, to be displayed int he navbar.
     *
     */
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

    /**
     *
     * Concatenates the query term and query location entered in the Navbar
     * to create the query string being sent to the Places API on the backend.
     *
     * If the typeOf the queryLocation is a string, (User typed it in) then concatenate
     * query.location with query.term
     *
     * If the typeOf the queryLocation is !string (an Object) then concatenate query.location.vicinity
     * with query.term
     *
     * @param query - Object with term and location properties. Location will either be a string or an object.
     */

    $scope.search = function(query){
        $scope.fetchingQuery = true;
        var formattedQuery;
        if(typeof query.location == "string"){
            formattedQuery = query.term + " " + query.location;
        }else{
            formattedQuery = query.term + " " + query.location.vicinity;
        }

        businessFactory.search(formattedQuery)
            .then(function(data){
                $scope.fetchingQuery = false;
                if(!$state.is('home')){
                    $state.go('home');
                }
            })
    }

}])