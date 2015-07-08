angular.module('cc.business-controller',[])
.controller('businessCtrl', [
'$scope',
'auth',
'$state',
'location',
'$stateParams',
'business',
function($scope, auth, $state,location,$stateParams,business){
	$scope.business = business.data;
}])