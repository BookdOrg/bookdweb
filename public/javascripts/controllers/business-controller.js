angular.module('cc.business-controller',[])
.controller('businessCtrl', [
'$scope',
'auth',
'$state',
'location',
'$stateParams',
'business',
'businessFactory',
'location',
'$rootScope',
function($scope, auth, $state,location,$stateParams,business,businessFactory,location,$rootScope){
	$scope.currentUser = auth.currentUser();
	$scope.business = business.data;



	businessFactory.getBusiness($scope.business.id);
	$scope.lbusiness = businessFactory.business;

	// if($scope.currentUser._id === $scope.lbusiness.owner._id){
	// 	$scope.canEdit = true;
	// }else{
	// 	$scope.canEdit = false;
	// }
}])