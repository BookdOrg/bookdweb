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
  $scope.cloudinaryBaseUrl = "http://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_100,r_10,w_100/v";
  $scope.cloudinaryDefaultPic = "http://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_100,r_10,w_100/v1432411957/profile/placeholder.jpg";

	businessFactory.getBusiness($stateParams.businessid)
    .then(function(data){
      $scope.business = data.data.result;
      $scope.business.info = data.data.info;
      businessFactory.business = $scope.business;
    })
  $scope.employeeError = businessFactory.error;
	$scope.animationsEnabled = true;
  $scope.removeAlert=function(){
    $scope.employeeError.message = null;
  }
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
  $scope.cloudinaryBaseUrl = "http://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_100,r_10,w_100/v";
  $scope.cloudinaryDefaultPic = "http://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_100,r_10,w_100/v1432411957/profile/placeholder.jpg";

  $scope.create = function (id) {
    var business = businessFactory.business;
    var newEmployee = {
      businessId:business.info._id,
      employeeId:id
    }
  	businessFactory.addEmployee(newEmployee);
    $modalInstance.close();
  };

  $scope.findEmployee = function(id){
    businessFactory.searchEmployee(id)
      .then(function(data){
        $scope.employee = data.data;
      })
  }

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
})