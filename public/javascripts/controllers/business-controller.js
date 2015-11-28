module.exports = function ($scope, auth, $state, $stateParams, businessFactory, location, $rootScope, $modal, NgMap) {
    $scope.business = businessFactory.business;
    $scope.employeeError = businessFactory.error;
    $scope.animationsEnabled = true;
    $scope.removeAlert = function () {
        $scope.employeeError.message = null;
    };
    $scope.hoveringOver = function (value) {
        $scope.overStar = value;
        $scope.percent = 100 * (value / $scope.max);
    };
    $scope.max = 5;
    $scope.isReadonly = true;
    $scope.open = function (size) {
        var modalInstance = $modal.open({
            animation: $scope.animationsEnabled,
            templateUrl: 'addServiceModal.html',
            controller: 'addServiceModalCtrl',
            size: size,
            resolve: {
                business: function () {
                    return $scope.business.info;
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

    $scope.removeEmployee = function (employee) {
        var modalInstance = $modal.open({
            animation: $scope.animationsEnabled,
            templateUrl: 'removeEmployeeModal.html',
            controller: 'removeEmployeeModalCtrl',
            resolve: {
                employee: function () {
                    return employee;
                }
            }
        });
    };

    $scope.openService = function (size) {
        var modalInstance = $modal.open({
            animation: $scope.animationsEnabled,
            templateUrl: 'scheduleServiceModal.html',
            controller: 'scheduleServiceModalCtrl as ctrl',
            backdrop: 'static',
            keyboard: false,
            size: size
        });

        modalInstance.result.then(function (selectedItem) {

        }, function () {
            //console.log('Modal dismissed at: ' + new Date());
        });
    };

    $scope.editService = function (service, serviceIndex) {
        var modalInstance = $modal.open({
            animation: $scope.animationsEnabled,
            templateUrl: 'editServiceModal.html',
            controller: 'editServiceModalCtrl',
            resolve: {
                serviceIndex: function () {
                    return serviceIndex;
                },
                service: function () {
                    return angular.copy(service);
                },
                business: function () {
                    return $scope.business.info;
                }
            }
        });
    };

    $scope.setService = function (service) {
        businessFactory.service = service;
    };

    $scope.toggleAnimation = function () {
        $scope.animationsEnabled = !$scope.animationsEnabled;
    };

    $scope.center = [$scope.business.geometry.location.lat, $scope.business.geometry.location.lng];
    NgMap.getMap().then(function (map) {
        map.zoom = 9;
    });
};