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
'$modal',
function($scope, auth, $state,location,$stateParams,business,businessFactory,location,$rootScope,$modal){
	$scope.currentUser = auth.currentUser();
	$scope.business = business.data;



	businessFactory.getBusiness($scope.business.id);
	$scope.lbusiness = businessFactory.business;

	$scope.animationsEnabled = true;

  $scope.open = function (size) {

    var modalInstance = $modal.open({
      animation: $scope.animationsEnabled,
      templateUrl: 'addServiceModal.html',
      controller: 'addServiceModalCtrl',
      size: size
    });
   };
  $scope.toggleAnimation = function () {
    $scope.animationsEnabled = !$scope.animationsEnabled;
  };
	// if($scope.currentUser._id === $scope.lbusiness.owner._id){
	// 	$scope.canEdit = true;
	// }else{
	// 	$scope.canEdit = false;
	// }
}])
.controller('addServiceModalCtrl', function ($scope, $modalInstance) {

  $scope.ok = function () {
    $modalInstance.close();
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
})