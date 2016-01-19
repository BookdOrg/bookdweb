module.exports = function ($scope, auth, $state, $stateParams, businessFactory, location, $rootScope, $uibModal, NgMap,
                           $controller, facebookApi, userFactory, Notification, utilService, business) {
    $scope.business = business;
    utilService.getGooglePlusPhotos($scope.business.info.employees, 0);

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
    $scope.rate = 3.5;
    $scope.max = 5;
    $scope.isReadonly = true;
    $scope.$watch('currLocation', function (newVal, oldVal) {
        if (newVal) {
            $scope.center = $rootScope.currLocation.latitude + ',' + $rootScope.currLocation.longitude;
        }
    });
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
     * Opens the schedule appointment modal
     * @param size - the size of the modal we want to open
     * @param type - scheduled for curr user - true, else - false
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

        modalInstance.result.then(function () {
            Notification.success('Successfully booked an appointment!');
        }, function (error) {
            if (error) {
                Notification.error({message: error});
            }
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
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: '/partials/modals/removeServiceModal.html',
            controller: 'removeServiceModalCtrl',
            resolve: {
                serviceIndex: function () {
                    return index;
                },
                service: function () {
                    return angular.copy(service);
                },
                business: function () {
                    return $scope.business.info;
                }
            }
        });

        modalInstance.result.then(function () {
            $scope.business.info.services.splice(index, 1);
        }, function () {

        });
    };


};