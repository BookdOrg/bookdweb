angular.module('cc.nav-controller',["google.places"])
.controller('NavCtrl', [
'$scope',
'auth',
'$state',
 'businessFactory',
function($scope, auth, $state,businessFactory){
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;
  $scope.logOut = auth.logOut;

  $scope.autocompleteOptions = {
    componentRestrictions: {country: 'us'},
    types:['geocode']
  }
//  $rootScope.query = $scope.query;
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