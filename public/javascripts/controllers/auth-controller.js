angular.module('cc.auth-controller',[])
.controller('AuthCtrl', [
'$scope',
'$state',
'auth',
'$geolocation',
function($scope, $state, auth, $geolocation){
  $scope.user = {};
  /**
   *
   */
  $scope.register = function(){
    auth.register($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };
  /**
   *
   */
  $scope.logIn = function(){
    auth.logIn($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };
}])
