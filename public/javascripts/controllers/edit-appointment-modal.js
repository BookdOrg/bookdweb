/**
 * Created by khalilbrown on 11/28/15.
 */
module.exports = function ($scope, $uibModalInstance, data, businessFactory, userFactory, socketService, personal,
                           $rootScope, notificationFactory, appointmentsFactory) {
    //The event object from the calendar, passed into the edit modal
    $scope.dateObj = data;
    $scope.showNoEmployee = false;
    $scope.business = data.business;
    if (data.appointment.externalCustomer) {
        $scope.customer = {};
        $scope.customer.name = data.appointment.externalCustomer.name;
        $scope.customer.phone = data.appointment.externalCustomer.phone;
    }
    //Make a request to get the details for the service this appointment was scheduled for.
    businessFactory.serviceDetails($scope.dateObj.appointment.service)
        .then(function (data) {
            //set the service to the $scope property
            $scope.service = data;
            //grab the employee details from the services list of employees based on the appointments employeeID
            if ($scope.dateObj.appointment.employee._id) {
                $scope.employee = _.findWhere($scope.service.employees, {_id: $scope.dateObj.appointment.employee._id});
            } else {
                $scope.employee = _.findWhere($scope.service.employees, {_id: $scope.dateObj.appointment.employee});
            }

            //if there's no employee we set this flag to true
            if (!$scope.employee) {
                $scope.showNoEmployee = true;
            }
            $scope.stripePrice = $scope.service.price * 100;
        });

    //Auto-select the date of the appointment as the date the calendar opens to
    $scope.selectedDate = data.appointment.start.date;
    var dateSelected = moment().set({
        'date': moment(new Date(data.appointment.start.date)).date(),
        'month': moment(new Date(data.appointment.start.date)).month(),
        'year': moment(new Date(data.appointment.start.date)).year(),
        'hour': moment(data.appointment.start.time, 'hh:mm a').hour(),
        'minute': moment(data.appointment.start.time, 'hh:mm a').minute(),
        'second': '00'
    });
    var today = moment();
    $scope.datePassed = false;
    if (dateSelected.isBefore(today, 'minute')) {
        $scope.datePassed = true;
    }
    //How long should the timer when an appointment is selected be
    $scope.countdown = 600;
    //set the minimum date available on the calendar
    $scope.minDate = $scope.minDate ? null : moment();

    //don't show the countdown initially
    $scope.showCount = false;
    //the timer should not be started on controller load
    var timeStarted = false;

    /**
     * Watch which date is selected on the calendar,
     * each time a new date is selected we need to call the getAvailable times function
     *
     */
    $scope.$watch('selectedDate', function (newVal, oldVal) {
        if (newVal) {
            $scope.dayMessage = false;
            if ($scope.selectedIndex) {
                $scope.availableTimes[$scope.selectedIndex].toggled = false;
                socketService.emit('timeDestroyed', $scope.activeTime);
            }
            $scope.selectedIndex = null;
            $scope.activeTime = null;
            $scope.showCount = false;
            $scope.$broadcast('timer-clear');
            $scope.previousDate = moment(new Date(oldVal)).format('MM/DD/YYYY');
            var selectedDate = new Date(newVal);
            //var roomId = moment(selectedDate).format('MM/YYYY') + data.appointment.employee._id._id;
            var employeeId;
            if (angular.isDefined(data.appointment.employee._id)) {
                employeeId = data.appointment.employee._id;
            } else {
                employeeId = data.appointment.employee;
            }
            getAvailableTimes(selectedDate, employeeId);
        }
    });
    /**
     *
     * When the timer is finished we untoggle the actively selected appointment time
     * Hide the countdown
     * Send a message to all other sockets to destroy the held time, making it available
     *
     */
    $scope.timerFinished = function () {
        $scope.activeTime.toggled = !$scope.activeTime.toggled;
        $scope.showCount = false;
        $scope.$apply();
        socketService.emit('timeDestroyed', $scope.activeTime);
    };
    var setEmployeeAvailability = function (dateObj) {
        var weekDay = moment(dateObj).format('dddd');
        var businessIndex = _.findIndex($scope.employee.availabilityArray, {'businessId': $scope.service.businessId});
        var availabilityIndex = _.findIndex($scope.employee.availabilityArray[businessIndex].availability, {'day': weekDay});
        var date = moment(dateObj).get('date');
        var year = moment(dateObj).get('year');
        var month = moment(dateObj).get('month');
        var startHour = moment($scope.employee.availabilityArray[businessIndex].availability[availabilityIndex].start, 'hh:mma').hour();
        var startMinute = moment($scope.employee.availabilityArray[businessIndex].availability[availabilityIndex].start, 'hh:mma').minute();
        var endHour = moment($scope.employee.availabilityArray[businessIndex].availability[availabilityIndex].end, 'hh:mma').hour();
        var endMinute = moment($scope.employee.availabilityArray[businessIndex].availability[availabilityIndex].end, 'hh:mma').minute();
        var employeeAvailability = {};
        if (weekDay === $scope.employee.availabilityArray[businessIndex].availability[availabilityIndex].day &&
            $scope.employee.availabilityArray[businessIndex].availability[availabilityIndex].available === false) {
            $scope.dayMessage = true;
            return null;
        } else {
            employeeAvailability = {
                date: moment().set({
                    'year': year,
                    'date': date,
                    'month': month,
                    'hour': '00',
                    'minute': '00',
                    'second': '00'
                }),
                dayStart: moment().set({
                    'year': year,
                    'date': date,
                    'month': month,
                    'hour': startHour,
                    'minute': startMinute,
                    'second': '00'
                }),
                dayEnd: moment().set({
                    'year': year,
                    'date': date,
                    'month': month,
                    'hour': endHour,
                    'minute': endMinute,
                    'second': '00'
                }),
                gaps: $scope.employee.availabilityArray[businessIndex].availability[availabilityIndex].gaps
            };
            return employeeAvailability;
        }
    };
    /**
     *
     * @param date - the date selected on the calendar
     * @param employeeId - the employee who's availability we need to check
     */
    function getAvailableTimes(date, employeeId) {
        $scope.newRoomDate = moment(new Date(date)).format('MM/DD/YYYY');
        $scope.monthYear = moment(new Date($scope.newRoomDate)).format('MM/YYYY');
        $scope.availableTimes = [];
        var employeeApptObj = {
            startDate: $scope.newRoomDate,
            employeeId: employeeId,
            previousDate: $scope.previousDate
        };
        if (data.appointment.customer !== null) {
            employeeApptObj.customerId = data.appointment.customer._id;
        }
        //If the appointment is being edited by the user who it's for this flag will be true
        if (personal) {
            employeeApptObj.personal = true;
        } else {
            employeeApptObj.personal = false;
        }
        $scope.calculatingAppointments = true;
        //Join the socket room with all the other users who are looking at this date for the given employee.
        socketService.emit('joinApptRoom', employeeApptObj);
        /**
         * Make a request for both the customer and employee's appointments, returns
         * all appointments on the given selected start date
         */
        userFactory.getAppts(employeeApptObj)
            .then(function (appointmentsArray) {
                $scope.availableTimes = [];
                var employeeAvailability = setEmployeeAvailability(date);
                //If an employee has been selected calculate the time slots available for the day
                if (employeeAvailability !== null) {
                    $scope.availableTimes = appointmentsFactory.createAvailableTimes(employeeAvailability, appointmentsArray, $scope.service.duration, $rootScope.currentUser._id);
                    $scope.calculatingAppointments = false;
                }
                /**
                 * Auto-select the current appointments start time if the user/employee
                 * is on the same date as the appointment
                 *
                 * @param element - the time object
                 * @param index - iterator
                 * @param list - NO CLUE
                 */
                var testTime = function (element, index, list) {
                    if (element.time === $scope.dateObj.appointment.start.time && !$scope.activeTime) {
                        $scope.$broadcast('timer-clear');
                        $scope.showCount = false;
                        $scope.availableTimes[index].available = true;
                        $scope.availableTimes[index].status = false;
                        $scope.availableTimes[index].toggled = true;
                        $scope.selectedIndex = index;
                    } else if ($scope.activeTime && element.time === $scope.activeTime.time) {
                        $scope.availableTimes[index].available = true;
                        $scope.availableTimes[index].status = false;
                        $scope.availableTimes[index].toggled = true;
                        $scope.selectedIndex = index;
                    } else if (element.time === $scope.dateObj.appointment.start.time && $scope.activeTime) {
                        $scope.availableTimes[index].available = true;
                        $scope.availableTimes[index].status = false;
                        $scope.availableTimes[index].toggled = true;
                    }
                };
                //if the date selected is the same as the start date of the appointment run that function for each value
                //in available timess
                if ($scope.dateObj.appointment !== 'canceled' && $scope.newRoomDate === $scope.dateObj.appointment.start.date) {
                    _.each($scope.availableTimes, testTime);
                }
            });
    }
    socketService.on('newRoomAppt', function (appointment) {
        if (appointment) {
            getAvailableTimes($scope.selectedDate, data.appointment.employee._id);
        }
    });

    //If someone books an appointment, update the current users screen
    socketService.on('update', function () {
        getAvailableTimes($scope.selectedDate, data.appointment.employee._id);
    });
    //When a socket join the appointment room late, we send the list of available times currently being held
    socketService.on('oldHold', function (data) {
        for (var dataIndex = 0; dataIndex < data.length; dataIndex++) {
            if (data[dataIndex].user !== $scope.currentUser._id) {
                calculateHold(data[dataIndex].data);
            }
        }
    });
    //when some user selects a time other then this one we receive it and calculate holds
    socketService.on('newHold', function (data) {
        if (data.user !== $rootScope.currentUser._id) {
            calculateHold(data);
        }
    });
    //when a user selects a different time or leaves the modal we destroy the held time
    socketService.on('destroyOld', function (data) {
        if (data && data.user !== $rootScope.currentUser._id) {
            destroyOld(data);
        }
    });
    //Calculate what availableTime/how many we should disabled
    var calculateHold = function (timeObj) {
        var startTime = moment(timeObj.time, 'hh:mm a');
        var endTime = moment(timeObj.end, 'hh:mm a');
        var timeRange = moment.range(startTime, endTime);
        _.forEach($scope.availableTimes, function (availableTime) {
            var currentStartTime = moment(availableTime.time, 'hh:mm a');
            var currentEndTime = moment(availableTime.end, 'hh:mm a');
            var currentTimeRange = moment.range(currentStartTime, currentEndTime);

            if (timeRange.intersect(currentTimeRange) || currentTimeRange.intersect(timeRange)) {
                availableTime.status = true;
            }
        });
    };
    //Toggle the held time off
    var destroyOld = function (timeObj) {
        var startTime = moment(timeObj.time, 'hh:mm a');
        var endTime = moment(timeObj.end, 'hh:mm a');
        var timeRange = moment.range(startTime, endTime);
        _.forEach($scope.availableTimes, function (availableTime) {
            var currentStartTime = moment(availableTime.time, 'hh:mm a');
            var currentEndTime = moment(availableTime.end, 'hh:mm a');
            var currentTimeRange = moment.range(currentStartTime, currentEndTime);

            if (timeRange.intersect(currentTimeRange) || currentTimeRange.intersect(timeRange)) {
                availableTime.status = false;
            }
        });
    };

    var checkShowUpdate = function (timeObj) {
        $scope.showUpdate = false;
        if (moment(new Date($scope.selectedDate)).date() !== moment(new Date($scope.dateObj.appointment.start.date)).date()) {
            if (!$scope.datePassed) {
                $scope.showUpdate = true;
            }
        } else if (moment(new Date($scope.selectedDate)).date() === moment(new Date($scope.dateObj.appointment.start.date)).date()) {
            if (timeObj.time !== $scope.dateObj.appointment.start.time && !$scope.datePassed) {
                $scope.showUpdate = true;
            }
        }
    };
    /**
     *  Create the actual appointment object when a time is selected
     *
     * @param time - the time object from availableTimes that was selected
     * @param index - the index of that time object in the array
     */
    $scope.selectedIndex = null;
    $scope.createAppointmentObj = function (timeObj, index) {
        checkShowUpdate(timeObj);
        //Set the activeTime to the time the user selected
        timeObj.roomId = $scope.newRoomDate.toString() + $scope.employee._id;
        //show the countdown
        $scope.showCount = true;
        //if the timer isn't starter, start it
        if (!timeStarted && $scope.dateObj.appointment.start.time !== timeObj.time) {
            $scope.$broadcast('timer-start');
            $scope.timerRunning = true;
            timeStarted = true;
            //if it's already running reset it then start it
        } else if (timeStarted && $scope.dateObj.appointment.start.time !== timeObj.time) {
            $scope.$broadcast('timer-reset');
            $scope.$broadcast('timer-start');
        } else {
            $scope.showCount = false;
            $scope.$broadcast('timer-clear');
        }

        $scope.activeTime = timeObj;
        /**
         *
         * If there is a previously selected time and the previous selected time isn't equal to the current one
         * we toggle the previously selected time to be false; Toggle the current time to be true.
         * Then we set the current index as the selected index
         */
        if ($scope.selectedIndex !== null) {
            $scope.availableTimes[$scope.selectedIndex].toggled = false;
            $scope.availableTimes[$scope.selectedIndex].roomId = $scope.newRoomDate.toString() + $scope.employee._id;
            socketService.emit('timeDestroyed', $scope.availableTimes[$scope.selectedIndex]);
            timeObj.toggled = !timeObj.toggled;
            $scope.selectedIndex = index;
        }
        /**
         * Must emit the new time taken after the old time was destroyed.
         *
         */
        socketService.emit('timeTaken', timeObj);
        /**
         *
         * If there is no previously selected time we simply toggle the current time, then
         * set the current index as the selected index.
         */
        if ($scope.selectedIndex == null) {
            timeObj.toggled = !timeObj.toggled;
            $scope.selectedIndex = index;
        }
        $scope.selectedIndex = index;
        //Format the values of the appointment
        var apptDay = moment(new Date($scope.selectedDate)).format('dddd');
        var apptDate = moment(new Date($scope.selectedDate)).format('MM/DD/YYYY');
        var apptTime = moment(timeObj.time, 'hh:mm a').format('hh:mm a');
        var endTime = moment(timeObj.time, 'hh:mm a').add($scope.service.duration, 'minutes').format('hh:mm a');
        //The actual appointment object that will be sent to the backend
        $scope.appointment = {
            _id: data.appointment._id,
            businessId: data.appointment.businessId,
            employee: data.appointment.employee,
            start: {
                date: apptDate,
                monthYear: $scope.monthYear,
                time: apptTime,
                day: apptDay,
                full: moment(apptDate + ' ' + apptTime, 'MM/DD/YYYY hh:mm a').format()
            },
            end: {
                date: apptDate,
                time: endTime,
                day: apptDay,
                full: moment(apptDate + ' ' + endTime, 'MM/DD/YYYY hh:mm a').format()

            },
            service: $scope.service._id,
            title: $scope.service.name,
            timestamp: moment()
        };
        if (typeof(data.appointment.customer) === 'string') {
            $scope.appointment.customer = data.appointment.customer;
        } else if (data.appointment.customer !== null) {
            $scope.appointment.customer = data.appointment.customer._id
        }
    };
    //If the appointment is being updated
    $scope.update = function (rescheduled) {
        if (!$scope.appointment) {
            $scope.appointment = data.appointment;
        }
        /**
         * Update the appointment, send a message to sockets who need to know
         *
         * Pass the new appointment back to the controller that called this modal.
         *
         */
        businessFactory.updateAppointment($scope.appointment)
            .then(function (appointment) {
                var socketData = {
                    'from': $rootScope.currentUser._id,
                    'appointment': appointment,
                    'roomId': $scope.newRoomDate.toString() + $scope.employee._id
                };
                socketService.emit('apptUpdated', socketData);
                notifyReschedule(appointment, rescheduled);
                if ($scope.activeTime) {
                    socketService.emit('timeDestroyed', $scope.activeTime);
                }
                $scope.dateObj.appointment = appointment;
                $uibModalInstance.close($scope.dateObj);
            });
    };
    //Mark an appointment as paid
    $scope.changeApptStatus = function () {
        $scope.dateObj.appointment.status = 'paid';
        //Update the status in the back-end
        businessFactory.updateStatus($scope.dateObj.appointment)
            .then(function (appointment) {
                $scope.dateObj.appointment = appointment;
                $uibModalInstance.close($scope.dateObj);
            });
    };
    $scope.error = null;
    //Charge the customer via stripe if they entered their card information
    $scope.charge = function (appointment) {
        $scope.charging = true;
        businessFactory.charge(appointment)
            .then(function (response) {
                if (!response.statusCode) {
                    $scope.dateObj.appointment = response;
                    $scope.charging = false;
                    $uibModalInstance.close($scope.dateObj);
                } else {
                    $scope.error = response;
                    $scope.charging = false;
                }
            }, function (err) {
                console.log(err);
            });
    };
    //Cancel the appointment
    $scope.cancel = function () {
        if ($scope.activeTime) {
            socketService.emit('timeDestroyed', $scope.activeTime);
        }
        businessFactory.cancelAppointment($scope.dateObj.appointment)
            .then(function () {
                notifyCancel($scope.dateObj.appointment);
                var socketData = {
                    'from': $rootScope.currentUser._id,
                    'appointment': $scope.dateObj.appointment,
                    'roomId': $scope.newRoomDate.toString() + $scope.employee._id
                };
                socketService.emit('apptCanceled', socketData);
                $scope.dateObj.appointment = 'canceled';
                $uibModalInstance.close($scope.dateObj);
            });
    };
    //close the modal
    $scope.close = function () {
        if ($scope.activeTime) {
            socketService.emit('timeDestroyed', $scope.activeTime);
        }
        $uibModalInstance.close();
    };

    function notifyReschedule(appointment, rescheduled) {
        var customerNotification = 'Your ' + $scope.service.name + ' scheduled for  ' + moment($scope.dateObj.appointment.start.full).format('MMM Do YYYY, h:mm a')
            + ' was rescheduled to ';
        var employeeNotification = 'Your ' + $scope.service.name + ' scheduled for ' + moment($scope.dateObj.appointment.start.full).format('MMM Do YYYY, h:mm a')
            + ' was rescheduled to ';

        if (rescheduled) {
            employeeNotification = 'Your request to reschedule ' + $scope.service.name + ' originally scheduled for ' + moment($scope.dateObj.appointment.start.full).format('MMM Do YYYY, h:mm a')
                + ' was accepted and is now ';
        }

        var type = 'calendar';
        if ($rootScope.currentUser._id === appointment.customer) {
            // Customer rescheduled appointment, inform employee, no email.
            notificationFactory.addNotification(appointment.employee, employeeNotification, type, false, appointment.start.full)
                .then(function () {
                    var data = {
                        id: appointment.employee,
                        notification: employeeNotification,
                        type: type
                    };
                    socketService.emit('newNotifGenerated', data);
                }, function (err) {
                    console.log(err);
                });
        } else if ($rootScope.currentUser._id === appointment.employee) {
            // Employee rescheduled appointment, inform customer, with email.
            notificationFactory.addNotification(appointment.customer, customerNotification, type, true, appointment.start.full)
                .then(function () {
                    var data = {
                        id: appointment.employee,
                        notification: customerNotification,
                        type: type
                    };
                    socketService.emit('newNotifGenerated', data);
                }, function (err) {
                    console.log(err);
                });
        } else {
            // Business owner rescheduled appointment, inform customer and employee, with email.
            notificationFactory.addNotification(appointment.customer, customerNotification, type, true, appointment.start.full)
                .then(function () {
                    var data = {
                        id: appointment.employee,
                        notification: customerNotification,
                        type: type
                    };
                    socketService.emit('newNotifGenerated', data);
                }, function (err) {
                    console.log(err);
                });

            notificationFactory.addNotification(appointment.employee, employeeNotification, type, true, appointment.start.full)
                .then(function () {
                    var data = {
                        id: appointment.employee,
                        notification: employeeNotification,
                        type: type
                    };
                    socketService.emit('newNotifGenerated', data);
                }, function (err) {
                    console.log(err);
                });
        }

        $scope.dateObj.appointment = appointment;
    }

    function notifyCancel(appointment) {
        var notification = 'Your ' + $scope.service.name + ' was canceled. It was originally scheduled for ',
            type = 'calendar';
        if ($rootScope.currentUser._id === appointment.customer) {
            // Customer canceled appointment, inform employee, no email.
            notificationFactory.addNotification(appointment.employee, notification, type, false, appointment.start.full)
                .then(function () {
                    var data = {
                        id: appointment.employee,
                        notification: notification,
                        type: type
                    };
                    socketService.emit('newNotifGenerated', data);
                }, function (err) {
                    console.log(err);
                });
        } else {
            // Employee canceled appointment, inform customer, with email.
            notificationFactory.addNotification(appointment.customer, notification, type, true, appointment.start.full)
                .then(function () {
                    var data = {
                        id: appointment.employee,
                        notification: notification,
                        type: type
                    };
                    socketService.emit('newNotifGenerated', data);
                }, function (err) {
                    console.log(err);
                });
        }
    }
    $scope.$on('$destroy', function (event) {
        if ($scope.selectedDate) {
            var roomId = $scope.newRoomDate.toString() + $scope.employee._id;
            socketService.emit('leaveApptRoom', roomId);
        }
        socketService.removeListener('oldHold');
        socketService.removeListener('destroyOld');
        socketService.removeListener('newHold');
        socketService.removeListener('update');
        socketService.removeListener('newRoomAppt');
    });
};