angular.module('cc.business-controller',[])
.controller('businessCtrl', [
'$scope',
'auth',
'$state',
'location',
'$stateParams',
'businessFactory',
'location',
'$rootScope',
'$modal',
function($scope, auth, $state,location,$stateParams,businessFactory,location,$rootScope,$modal){
	$scope.currentUser = auth.currentUser();
	// $scope.business = business.data;


	businessFactory.getBusiness($stateParams.businessid)
    .then(function(data){
      $scope.business = data.data.result;
      $scope.business.info = data.data.info;
    })

	$scope.animationsEnabled = true;

  $scope.open = function (size) {

    var modalInstance = $modal.open({
      animation: $scope.animationsEnabled,
      templateUrl: 'addServiceModal.html',
      controller: 'addServiceModalCtrl',
      size: size,
      resolve:{
      	id: function(){
      		return $scope.business.info._id;
      	}
      }
    });
   };
 	$scope.openEmployee = function (size) {
	    var modalInstance = $modal.open({
	      animation: $scope.animationsEnabled,
	      templateUrl: 'addEmployeeModal.html',
	      controller: 'addEmployeeModalCtrl',
	      size: size
	      // resolve:{
	      // 	id: function(){
	      // 		return $scope.employee.id;
	      // 	}
	      // }
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
.controller('addServiceModalCtrl', function ($scope, $modalInstance, businessFactory,id) {

  $scope.ok = function (service) {
  	service.id = id;
  	businessFactory.addService(service);
    $modalInstance.close();
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
})
.controller('addEmployeeModalCtrl', function ($scope, $modalInstance, businessFactory) {

  $scope.ok = function (employee) {
  	// businessFactory.addEmployee(id);
    $modalInstance.close();
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
})