angular.module('cc.auth-controller',[])
.controller('AuthCtrl', [
'$scope',
'$state',
'auth',
'user',
'$rootScope',
function($scope, $state, auth,user,$rootScope){
  $scope.user = {};
  /**
   *
   */
  $scope.register = function(){
    auth.register($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('landing');
    });
  };
  /**
   *
   */
  $scope.logIn = function(){
    auth.logIn($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('feed');
    });
  };
}])
