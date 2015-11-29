// Please note that $modalInstance represents a modal window (instance) dependency.
// It is not the same as the $modal service used above.

module.exports = function ($scope, $uibModalInstance, message, $state, info) {

    $scope.business = message.data;
    $scope.status = message.status;
    $scope.business.info = info;

    $scope.ok = function () {
        $uibModalInstance.close();
        $state.go('feed');
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

};
