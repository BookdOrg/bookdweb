module.exports = function ($scope, auth, $state, $stateParams, businessFactory, location, $rootScope, $uibModal, NgMap, $controller) {
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

    var navViewModel = $scope.$new();
    $controller('NavCtrl', {$scope: navViewModel});
    $scope.scheduleAppointment = function (type, state,service) {
        if (!auth.isLoggedIn()) {
            navViewModel.open(type, state);
        } else {
            $scope.openService('lg',true,service);
        }

    };

    $scope.open = function (size) {
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: '/partials/modals/addServiceModal.html',
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
            templateUrl: '/partials/modals/addEmployeeModal.html',
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
            templateUrl: '/partials/modals/removeEmployeeModal.html',
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

    $scope.openService = function (size,type,service) {
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: '/partials/modals/scheduleServiceModal.html',
            controller: 'scheduleServiceModalCtrl as ctrl',
            backdrop: 'static',
            keyboard: false,
            size: size,
            resolve:{
                personal:function(){
                    return type;
                },
                tier:function(){
                    return $scope.business.info.tier;
                },
                service:function(){
                    return service;
                }
            }
        });

        modalInstance.result.then(function (selectedItem) {

        }, function () {
            //console.log('Modal dismissed at: ' + new Date());
        });
    };

    $scope.editService = function (service, serviceIndex) {
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: '/partials/modals/editServiceModal.html',
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

    $scope.removeService = function(service,index){
        $scope.business.info.services.splice(index,1);
        var serviceObj = {
            serviceId:service._id,
            businessId:$scope.business.info._id
        };
        businessFactory.removeService(serviceObj)
            .then(function(response){
            });
    };


    $scope.toggleAnimation = function () {
        $scope.animationsEnabled = !$scope.animationsEnabled;
    };

    $scope.center = $scope.business.geometry.location.lat + ',' + $scope.business.geometry.location.lng;
    NgMap.getMap().then(function (map) {
        map.zoom = 9;
    });
};