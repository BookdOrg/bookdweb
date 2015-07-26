angular.module('cc.claim-controller',[])
.controller('claimController', [
'$scope',
'auth',
'$state',
'location',
'$stateParams',
function($scope, auth, $state,location,$stateParams){
	$scope.currentUser = auth.currentUser();
	$scope.business = $stateParams.business;
}])