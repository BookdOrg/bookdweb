// Please note that $modalInstance represents a modal window (instance) dependency.
// It is not the same as the $modal service used above.

angular.module('cc.modalInstance',[])
.controller('ModalInstanceCtrl', function ($scope, $modalInstance,message,$state,info) {

  $scope.business = message.data;
  $scope.status = message.status;
  $scope.business.info = info;

  $scope.ok = function () {
    $modalInstance.close();
    $state.go('home');
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };

});
