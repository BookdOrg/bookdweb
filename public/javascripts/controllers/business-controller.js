angular.module('cc.business-controller', [])
    .controller('businessCtrl', [
        '$scope',
        'auth',
        '$state',
        '$stateParams',
        'businessFactory',
        'location',
        '$rootScope',
        '$modal',
        function ($scope, auth, $state, $stateParams, businessFactory, location, $rootScope, $modal) {
            $scope.business = businessFactory.business;
            //if (!businessFactory.business.info) {
            //    businessFactory.getBusinessInfo($stateParams.businessid)
            //        .then(function (data) {
            //            $scope.business = data.data.result;
            //            $scope.business.info = data.data.info;
            //            businessFactory.business = $scope.business;
            //        });
            //}
            $scope.employeeError = businessFactory.error;
            $scope.animationsEnabled = true;
            /**
             *
             */
            $scope.removeAlert = function () {
                $scope.employeeError.message = null;
            };
            $scope.hoveringOver = function (value) {
                $scope.overStar = value;
                $scope.percent = 100 * (value / $scope.max);
            };
            $scope.max = 5;
            $scope.isReadonly = true;
            /**
             *
             * @param size
             */
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
            /**
             *
             * @param size
             */
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
            /**
             *
             * @param employee
             */
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

            /**
             *
             * @param size
             */
            $scope.openService = function (size) {
                var modalIsntance = $modal.open({
                    animation: $scope.animationsEnabled,
                    templateUrl: 'scheduleServiceModal.html',
                    controller: 'scheduleServiceModalCtrl as ctrl',
                    size: size
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
            /**
             *
             * @param service
             */
            $scope.setService = function (service) {
                businessFactory.service = service;
            };
            /**
             *
             */
            $scope.toggleAnimation = function () {
                $scope.animationsEnabled = !$scope.animationsEnabled;
            };
        }])
    .controller('scheduleServiceModalCtrl', function ($scope, $modalInstance, businessFactory, socket, moment, auth, $state, $rootScope, user) {
        $scope.service = businessFactory.service;
        $scope.stripePrice = $scope.service.price * 100;
        $scope.minDate = $scope.minDate ? null : moment();

        // $scope.currentUser = auth.currentUser();
        $scope.$watch('selectedDate', function (newVal, oldVal) {
            if (newVal) {
                getAvailableTimes(newVal, $scope.employee._id);
            }
        });
        /**
         *
         * @param employee
         */
        $scope.selectEmployee = function (employee) {
            $scope.availableTimes = [];
            $scope.employee = employee;
            var day = moment().format('MM/DD/YYYY');
            getAvailableTimes(day,$scope.employee._id);
        };
        /**
         *
         * @param date
         * @param employeeId
         */
        function getAvailableTimes(date, employeeId) {
            var newDate = moment(date).format('MM/DD/YYYY');
            var employeeApptObj = {
                startDate: newDate,
                id: employeeId
            };
            socket.emit('joinApptRoom', employeeApptObj);
            user.getAppts(employeeApptObj).then(function(data){
                calculateAppointments(data);
            });
        }

        /**
         *
         * @param data
         */
        function calculateAppointments(data) {
            var duration = $scope.service.duration;
            var startTime = moment('6:00 am', 'hh:mm a');
            $scope.availableTimes = [];
            var endTime = moment('7:00 pm', 'hh:mm a');

            for (var m = startTime; startTime.isBefore(endTime); m.add(duration, 'minutes')) {
                var timeObj = {
                    time: m.format('hh:mm a'),
                    available: true,
                    toggled: false
                };
                $scope.availableTimes.push(timeObj);
            }
            data.forEach(function (array) {
                for (var availableTimesIndex = 0; availableTimesIndex < $scope.availableTimes.length; availableTimesIndex++) {
                    for (var appointmentsIndex = 0; appointmentsIndex < array.length; appointmentsIndex++) {
                        if (moment($scope.availableTimes[availableTimesIndex].time, 'hh:mm a')
                                .isSame(moment(array[appointmentsIndex].start.time, 'hh:mm a'))) {
                            $scope.availableTimes[availableTimesIndex].available = false;
                        }
                        if (moment($scope.availableTimes[availableTimesIndex].time, 'hh:mm a')
                                .isBetween(moment(array[appointmentsIndex].start.time, 'hh:mm a'),
                                moment(array[appointmentsIndex].end.time, 'hh:mm a'), 'minute')) {
                            $scope.availableTimes[availableTimesIndex].available = false;
                        }
                    }
                }
            });
        }
        socket.on('update',function(){
            getAvailableTimes($scope.selectedDate, $scope.employee._id);
        });
        /**
         *
         * @param time
         * @param index
         */
        $scope.selectedIndex = null;
        $scope.createAppointmentObj = function (time,index) {
            var newDate = moment($scope.selectedDate).format('MM/DD/YYYY');
            var data = {
                customerId: $scope.currentUser._id,
                employeeId: $scope.employee._id,
                date:newDate,
                time:time,
                index:index
            };
            //socket.emit('timeTaken',data);
            /**
             *
             * If there is a previously selected time and the previous selected time isn't equal to the current one
             * we toggle the previously selected time to be false; Toggle the current time to be true.
             * Then we set the current index as the selected index
             */
            if($scope.selectedIndex !== null){
                $scope.availableTimes[$scope.selectedIndex].toggled = false;
                time.toggled = !time.toggled;
                $scope.selectedIndex = index;
            }
            /**
             *
             * If there is no previously selected time we simply toggle the current time, then
             * set the current index as the selected index.
             */
            if($scope.selectedIndex == null){
                time.toggled = !time.toggled;
                $scope.selectedIndex = index;
            }
            $scope.selectedIndex = index;
            var apptDay = moment($scope.selectedDate).format('dddd');
            var apptDate = moment($scope.selectedDate).format('MM/DD/YYYY');
            var apptTime = moment(time.time, 'hh:mm a').format('hh:mm a');
            var endTime = moment(time.time, 'hh:mm a').add($scope.service.duration, 'minutes').format('hh:mm a');

            $scope.appointment = {
                businessid: $scope.service.businessId,
                employee: $scope.employee._id,
                customer: $rootScope.currentUser._id,
                start: {
                    date: apptDate,
                    time: apptTime,
                    day: apptDay
                },
                end: {
                    date: apptDate,
                    time: endTime,
                    day: apptDay
                },
                title: $scope.service.name,
                timestamp: moment()
            };
        };

        /**
         *
         * @param token
         */
        //TODO Handle the case where the add appointment callback returns 400 because of overlapping appointments
        this.checkOut = function (token) {
            $scope.appointment.card = token.card;
            businessFactory.addAppointment($scope.appointment)
                .then(function (data) {
                    $modalInstance.close();
                    $state.go('feed');
                });

        };
        $scope.ok = function () {
            // businessFactory.addAppointment($scope.appointment);
            //   .then(function(data){
            //     $modalInstance.close();
            //   })

        };
        /**
         *
         */
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    })
    .controller('addServiceModalCtrl', function ($scope, $modalInstance, businessFactory, business) {

        $scope.business = business;

        // $scope.service = {
        //   employees: []
        // }
        $scope.serviceEmployees = [];
        $scope.settings = {
            displayProp: 'firstName',
            idProp: '_id',
            externalIdProp: '_id',
            smartButtonMaxItems: 3,
            smartButtonTextConverter: function (itemText, originalItem) {
                return itemText;
            }
        };
        $scope.ok = function (service) {
            service.businessId = business._id;
            service.employees = _.pluck($scope.serviceEmployees, '_id');
            businessFactory.addService(service);
            $modalInstance.close();
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    })
    .controller('editServiceModalCtrl', function ($scope, $modalInstance, businessFactory, service, business, serviceIndex) {

        $scope.editService = service;
        $scope.business = business;

        $scope.serviceEmployees = [];

        for (var employeeIndex = 0; employeeIndex < business.employees.length; employeeIndex++) {
            var tempObject = {
                "_id": business.employees[employeeIndex]._id
            };
            for (var serviceEmployeeIndex = 0; serviceEmployeeIndex < $scope.editService.employees.length; serviceEmployeeIndex++) {
                if ($scope.editService.employees[serviceEmployeeIndex]._id === business.employees[employeeIndex]._id) {
                    $scope.serviceEmployees.push(tempObject);
                }
            }
        }

        $scope.settings = {
            displayProp: 'firstName',
            idProp: '_id',
            externalIdProp: '_id',
            smartButtonMaxItems: 3,
            smartButtonTextConverter: function (itemText, originalItem) {
                return itemText;
            }
        };
        $scope.ok = function (service) {
            service.businessId = business._id;
            service.employees = _.pluck($scope.serviceEmployees, '_id');
            businessFactory.updateService(service)
                .then(function (data) {
                    business.services[serviceIndex] = data;
                });
            $modalInstance.close();
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    })
    .controller('addEmployeeModalCtrl', function ($scope, $modalInstance, businessFactory, user) {

        $scope.create = function (id) {
            var business = businessFactory.business;
            var newEmployee = {
                businessId: business.info._id,
                employeeId: id
            };
            businessFactory.addEmployee(newEmployee);
            $modalInstance.close();
        };

        $scope.findEmployee = function (id) {
            user.search(id);
            $scope.employee = user.user;
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    })
    .controller('removeEmployeeModalCtrl', function ($scope, $modalInstance, businessFactory, employee) {
        $scope.employee = employee;
        $scope.employeeHasService = false;
        $scope.associatedServices = [];

        var business = businessFactory.business;
        var services = business.info.services;

        for (var serviceIndex = 0; serviceIndex < services.length; serviceIndex++) {
            var employees = services[serviceIndex].employees;

            //If a service only has 1 employee, check if the employee being removed is part of the service.
            //If true, cannot remove employee, otherwise, remove employee from business & from services he may be a part of.
            if (employee && employees.length == 1) {
                if (employee._id === employees[0]._id) {
                    $scope.associatedServices.push(services[serviceIndex].name);
                    $scope.employeeHasService = true;
                }
            }
            //for (var employeeIndex = 0; employeeIndex < employees.length; employeeIndex++) {
            //    if (employee._id === employees[employeeIndex]._id) {
            //        $scope.associatedServices.push(services[serviceIndex].name);
            //        $scope.employeeHasService = true;
            //    }
            //}
        }

        $scope.remove = function () {
            var business = businessFactory.business;
            var services = business.info.services;
            var associatedServices = [];

            //When removing employee, go through the list of services
            //Go through each employee of that service
            //If removing employee is part of service, get the serviceId and remove employee from service.
            for (var serviceIndex = 0; serviceIndex < services.length; serviceIndex++) {
                var service = services[serviceIndex];
                var employees = service.employees;
                for (var employeeIndex = 0; employeeIndex < employees.length; employeeIndex++) {
                    if (employee._id === employees[employeeIndex]._id) {
                        associatedServices.push(service._id);
                    }
                }
            }
            var selectedEmployee = {
                businessId: business.info._id,
                employeeId: employee._id,
                serviceList: associatedServices
            };

            businessFactory.removeEmployee(selectedEmployee);
            $modalInstance.close();
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    });