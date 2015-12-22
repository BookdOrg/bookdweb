module.exports = function ($scope, auth, $state, $stateParams, businessFactory, location, $rootScope, $uibModal, NgMap) {
    $scope.business = businessFactory.business;
    $scope.employeeError = businessFactory.error;
    $scope.editMode = false;
    $scope.animationsEnabled = true;

    $scope.toggleEdit = function () {
        $scope.editMode = !$scope.editMode;
    };
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
        var modalInstance = $uibModal.open({
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
        modalInstance.result.then(function (serviceResponse) {
            $scope.business.info.services.push(serviceResponse);
        }, function () {

        });
    };

    $scope.openEmployee = function (business) {
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: '/partials/addEmployeeModal.html',
            controller: 'addEmployeeModalCtrl',
            resolve: {
                businessInfo: function () {
                    return business;
                }
            }
        });

        modalInstance.result.then(function (businessId) {
            businessFactory.getBusinessInfo(businessId)
                .then(function (business) {
                    $scope.business.info = business;
                });
        }, function () {
            //console.log('Modal dismissed at: ' + new Date());
        });
    };

    $scope.removeEmployee = function (employee, business) {
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: '/partials/removeEmployeeModal.html',
            controller: 'removeEmployeeModalCtrl',
            resolve: {
                employee: function () {
                    return employee;
                },
                businessInfo: function () {
                    return business;
                }
            }
        });
        modalInstance.result.then(function (businessId) {
            businessFactory.getBusinessInfo(businessId)
                .then(function (business) {
                    $scope.business.info = business;
                });
        });
    };

    $scope.openService = function (size) {
        var modalInstance = $uibModal.open({
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
        var modalInstance = $uibModal.open({
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

    $scope.center = $scope.business.geometry.location.lat + ',' + $scope.business.geometry.location.lng;
    NgMap.getMap().then(function (map) {
        map.zoom = 9;
    });
};