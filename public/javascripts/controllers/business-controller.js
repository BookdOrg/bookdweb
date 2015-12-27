module.exports = function ($scope, auth, $state, $stateParams, businessFactory, location, $rootScope, $uibModal, NgMap,
                           $controller, facebookApi) {
    $scope.business = businessFactory.business;
    $scope.employeeError = businessFactory.error;
    $scope.editMode = false;
    $scope.animationsEnabled = true;
    $scope.selectedTab = true;

    $scope.facebookApi = facebookApi;

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
    $scope.scheduleAppointment = function (type, state, service) {
        if (!auth.isLoggedIn()) {
            navViewModel.open(type, state);
        } else {
            $scope.openScheduleAppointmentModal('lg', true, service);
        }

    };
    /**
     * Opens the add service modal
     *
     * @param size - The size of the modal
     *
     * The current business is passed into the modal
     *
     */

    $scope.openAddServiceModal = function (size) {
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
    /**
     *
     * Opens the add employee modal
     *
     * @param business - the current business
     *
     * Resolves the current business
     */
    $scope.openAddEmployeeModal = function (business) {
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
        /**
         * The business ID is returned from the addEmployeemodal
         *
         * We make a request to get the Bookd Business Info for that business,
         * then we update scope
         *
         */
        modalInstance.result.then(function (businessId) {
            businessFactory.getBusinessInfo(businessId)
                .then(function (business) {
                    $scope.business.info = business;
                });
        }, function () {
            //console.log('Modal dismissed at: ' + new Date());
        });
    };
    /**
     * Opens the remove employee Modal
     *
     * @param employee - The employee object to be removed
     * @param business - the Business to remove the employee from
     *
     * We resolve both these objects to be used in the modal
     */
    $scope.openRemoveEmployeeModal = function (employee, business) {
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: '/partials/modals/removeEmployeeModal.html',
            controller: 'removeEmployeeModalCtrl',
            resolve: {
                employee: function () {
                    return employee;
                },
                businessObj: function () {
                    return business;
                }
            }
        });
        /**
         *
         * Once the modal is closed we return the businessID to the modalinstance
         * and use that to make a request for updated businessInfo
         *
         */
        modalInstance.result.then(function (businessId) {
            businessFactory.getBusinessInfo(businessId)
                .then(function (business) {
                    $scope.business.info = business;
                });
        });
    };
    /**
     *
     * Opens the schedule appointment modal
     *
     *
     * @param size - the size of the modal we want to open
     * @param type - is this being schedule for the current user or for another user
     * @param service - the service object
     */
    $scope.openScheduleAppointmentModal = function (size, type, service) {
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: '/partials/modals/scheduleAppointmentModal.html',
            controller: 'scheduleAppointmentModalCtrl as ctrl',
            backdrop: 'static',
            keyboard: false,
            size: size,
            resolve: {
                personal: function () {
                    return type;
                },
                tier: function () {
                    return $scope.business.info.tier;
                },
                service: function () {
                    return service;
                }
            }
        });
        /**
         * Currently doing nothing once the modal has been closed,
         *
         * we could display a message saying the appointment was successfully bookd.
         *
         * Maybe we leave this to the email.
         *
         */
        modalInstance.result.then(function (selectedItem) {

        }, function () {
            //console.log('Modal dismissed at: ' + new Date());
        });
    };
    /**
     * Open a modal to edit a service
     *
     * @param service - Service Object
     * @param serviceIndex - The index of the service to be removed in the business object
     *
     * We resolve the current business to be used in the modal
     */
    $scope.openEditServiceModal = function (service, serviceIndex) {
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
    /**
     *
     * Delete a service from a business
     *
     * @param service - The service object to delete
     * @param index - The index of the service in the business services array
     */
    $scope.openRemoveServiceModal = function (service, index) {
        var serviceObj = {
            serviceId: service._id,
            businessId: $scope.business.info._id
        };
        businessFactory.removeService(serviceObj)
            .then(function (response) {
                $scope.business.info.services.splice(index, 1);
            });
    };

    $scope.center = $scope.business.geometry.location.lat + ',' + $scope.business.geometry.location.lng;
    //NgMap.getMap().then(function (map) {
    //    map.zoom = 9;
    //});
    /**
     * Initialize the map when the user clicks on the tab
     *
     * @param mapId - the html id of the map element
     */
    //$scope.initMap = function(mapId) {
    //    $scope.map = NgMap.initMap(mapId);
    //
    //};


};