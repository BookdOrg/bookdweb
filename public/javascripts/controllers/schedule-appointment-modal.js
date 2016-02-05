/**
 * Created by Jonfor on 11/28/15.
 */
module.exports = function ($scope, $uibModalInstance, businessFactory, socketService, auth, $state, $rootScope,
                           userFactory, personal, payments, service, notificationFactory, facebookApi, utilService) {

    $scope.facebookApi = facebookApi;
    $scope.service = service;

    utilService.getGooglePlusPhotos($scope.service.employees, 0);

    $scope.stripePrice = $scope.service.price * 100;
    $scope.minDate = $scope.minDate ? null : moment();
    $scope.progressBar = 100;
    $scope.showCount = false;
    $scope.countdown = 600;
    $scope.payments = payments;
    $scope.personal = personal;
    var timeStarted = false;
    $scope.activeTab = 'employees';
    $scope.changeTab = function (tab) {
        $scope.activeTab = tab;
    };
    $scope.externalCustomer = {};
    /**
     * Watch which date is selected on the calendar,
     * each time a new date is selected we need to call the getAvailable times function
     *
     */
    $scope.$watch('selectedDate', function (newVal, oldVal) {
        if (newVal) {
            $scope.selectedDate = newVal;
            if ($scope.selectedIndex !== null) {
                $scope.availableTimes[$scope.selectedIndex].toggled = false;
                socketService.emit('timeDestroyed', $scope.activeTime);
            }
            $scope.selectedIndex = null;
            $scope.activeTime = null;
            $scope.showCount = false;
            $scope.$broadcast('timer-clear');
            $scope.previousDate = moment(oldVal).format('MM/DD/YYYY');
            $scope.dayMessage = false;
            getEmployeeAppts(newVal, $scope.employee._id);
            $scope.appointment = null;
        }
    });
    $scope.back = function () {
        if ($scope.selectedIndex !== null) {
            $scope.availableTimes[$scope.selectedIndex].toggled = false;
            socketService.emit('timeDestroyed', $scope.activeTime);
        }
        $scope.selectedIndex = null;
        $scope.activeTime = null;
        $scope.showCount = false;
        $scope.$broadcast('timer-clear');
        $scope.dayMessage = false;
        $scope.appointment = null;
        $scope.employee = null;
    };
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
        $scope.selectedIndex = null;
        if ($scope.activeTab === 'pay') {
            $scope.activeTab = 'employees';
        }
        if ($scope.appointment) {
            $scope.appointment = null;
        }
        $scope.$apply();
        socketService.emit('timeDestroyed', $scope.activeTime);
    };
    /**
     *
     * @param employee
     */
    $scope.selectEmployee = function (employee) {
        $scope.availableTimes = [];
        $scope.employee = employee;
        $scope.selectedDate = new Date();
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
    var createAvailableTimes = function (employeeAvailability, appointmentsArray, duration) {
        var availableTimes = [];
        var minutes = moment.duration(parseInt(duration), 'minutes');
        var employeeDate = employeeAvailability.date.clone();
        for (var m = employeeAvailability.dayStart; employeeAvailability.dayStart.isBefore(employeeAvailability.dayEnd); m.add(duration, 'minutes')) {

            var availableTimeStart = m.clone();
            availableTimeStart.set('second', '00');
            var startPlusEnd = m.clone();
            startPlusEnd.set('second', '00');
            startPlusEnd.add(minutes);
            var availableTimeEnd = startPlusEnd.clone();
            var availableTimeRange = moment.range(availableTimeStart, availableTimeEnd);

            var timeObj = {
                time: availableTimeStart.format('hh:mm a'),
                end: availableTimeEnd.format('hh:mm a'),
                available: true,
                toggled: false,
                status: false,
                hide: false,
                user: $scope.currentUser._id
            };
            var currentDateTime = moment().set({
                'year': moment(employeeDate).year(),
                'month': moment(employeeDate).month(),
                'date': moment(employeeDate).date(),
                'hour': moment(timeObj.time, 'hh:mm a').hour(),
                'minute': moment(timeObj.time, 'hh:mm a').minute(),
                'second': '00'
            });
            _.forEach(employeeAvailability.gaps, function (gap) {
                var gapStartHour = moment(gap.start, 'hh:mm a').hour();
                var gapStartMinute = moment(gap.start, 'hh:mm a').minute();
                var gapEndHour = moment(gap.end, 'hh:mm a').hour();
                var gapEndMinute = moment(gap.end, 'hh:mm a').minute();
                var gapStart = moment(employeeDate).set({
                    'hour': gapStartHour,
                    'minute': gapStartMinute,
                    'second': '00'
                });
                var gapEnd = moment(employeeDate).set({
                    'hour': gapEndHour,
                    'minute': gapEndMinute,
                    'second': '00'
                });
                var gapRange = moment.range(gapStart, gapEnd);
                var adjustedEnd = m.clone();
                if (gapRange.intersect(availableTimeRange)) {
                    adjustedEnd.add(duration, 'minutes');
                    timeObj.end = adjustedEnd.format('hh:mm a');
                    m.set({'hour': gapEndHour, 'minute': gapEndMinute}).format('hh:mm a');
                    timeObj.time = m.clone().format('hh:mm a');
                } else {
                    adjustedEnd.add(duration, 'minutes');
                    timeObj.end = adjustedEnd.format('hh:mm a');
                }
            });
            _.forEach(appointmentsArray, function (appointmentArray) {
                _.forEach(appointmentArray, function (appointment) {
                    var apptStartHour = moment(appointment.start.time, 'hh:mm a').hour();
                    var apptStartMinute = moment(appointment.start.time, 'hh:mm a').minute();
                    var apptEndHour = moment(appointment.end.time, 'hh:mm a').hour();
                    var apptEndMinute = moment(appointment.end.time, 'hh:mm a').minute();
                    var apptStart = moment(employeeDate).set({
                        'hour': apptStartHour,
                        'minute': apptStartMinute,
                        'second': '00'
                    });
                    var apptEnd = moment(employeeDate).set({
                        'hour': apptEndHour,
                        'minute': apptEndMinute,
                        'second': '00'
                    });
                    var apptRange = moment.range(apptStart, apptEnd);
                    var availableTimeAdjustedEnd = m.clone();
                    var currentAvailableTimeStartHour = moment(timeObj.time, 'hh:mm a').hour();
                    var currentAvailableTimeStartMinute = moment(timeObj.time, 'hh:mm a').minute();
                    var currentAvailableTimeEndHour = moment(timeObj.end, 'hh:mm a').hour();
                    var currentAvailableTimeEndMinute = moment(timeObj.end, 'hh:mm a').minute();

                    var currAvailableStart = moment(employeeDate).set({
                        'minute': currentAvailableTimeStartMinute,
                        'hour': currentAvailableTimeStartHour,
                        'second': '00'
                    });
                    var currAvailableEnd = moment(employeeDate).set({
                        'minute': currentAvailableTimeEndMinute,
                        'hour': currentAvailableTimeEndHour,
                        'second': '00'
                    });
                    var currAvailableRange = moment.range(currAvailableStart, currAvailableEnd);
                    if (apptRange.intersect(currAvailableRange)) {
                        availableTimeAdjustedEnd.add(duration, 'minutes');
                        timeObj.end = availableTimeAdjustedEnd.format('hh:mm a');
                        m.set({'hour': apptEndHour, 'minute': apptEndMinute}).format('hh:mm a');
                        timeObj.time = m.clone().format('hh:mm a');
                    } else {
                        availableTimeAdjustedEnd.add(duration, 'minutes');
                        timeObj.end = availableTimeAdjustedEnd.format('hh:mm a');
                    }

                });
            });
            if (moment(timeObj.time, 'hh:mm a').isBefore(moment())) {
                timeObj.hide = true;
            }
            var timeEnd = moment({
                'date': moment(employeeDate).date(),
                'year': moment(employeeDate).year(),
                'month': moment(employeeDate).month(),
                'hour': moment(timeObj.end, 'hh:mm a').hour(),
                'minutes': moment(timeObj.end, 'hh:mm a').minute(),
                'seconds': 00,
                'milliseconds': 00
            });
            var dayEnd = moment({
                'date': moment(employeeDate).date(),
                'year': moment(employeeDate).year(),
                'month': moment(employeeDate).month(),
                'hour': moment(employeeAvailability.dayEnd).hour(),
                'minutes': moment(employeeAvailability.dayEnd).minute(),
                'seconds': moment(employeeAvailability.dayEnd).second()
            });
            if (timeEnd.isSameOrBefore(dayEnd)) {
                availableTimes.push(timeObj);
            }
        }
        return availableTimes;
    };

    /**
     *
     * @param date - the date selected on the calendar
     * @param employeeId - the employee who's availability we need to check
     */
    function getEmployeeAppts(date, employeeId) {
        $scope.newRoomDate = moment(date).format('MM/DD/YYYY');
        $scope.monthYear = moment(new Date($scope.newRoomDate)).format('MM/YYYY');
        var employeeApptObj = {
            startDate: $scope.newRoomDate,
            previousDate: $scope.previousDate,
            employeeId: employeeId
        };
        if (personal) {
            employeeApptObj.customerId = $rootScope.currentUser._id;
            employeeApptObj.personal = true;
        } else {
            employeeApptObj.customerId = null;
            employeeApptObj.personal = false;
        }
        /**
         * Make a request for both the customer and employee's appointments, returns
         * all appointments on the given selected start date
         */
        userFactory.getAppts(employeeApptObj)
            .then(function (appointmentsArray) {
                $scope.availableTimes = [];
                var employeeAvailability = setEmployeeAvailability(date);
                if (employeeAvailability !== null) {
                    $scope.availableTimes = createAvailableTimes(employeeAvailability, appointmentsArray, service.duration);
                }
                socketService.emit('joinApptRoom', employeeApptObj);
            });
    }

    //If someone books an appointment, update the current users screen
    socketService.on('newRoomAppt', function (appointment) {
        if (appointment) {
            getEmployeeAppts($scope.selectedDate, $scope.employee._id);
        }
    });
    socketService.on('update', function () {
        getEmployeeAppts($scope.selectedDate, $scope.employee._id);
    });
    //When a socket join the appointment room late, we send the list of availabletimes currently being held
    socketService.on('oldHold', function (data) {
        for (var dataIndex = 0; dataIndex < data.length; dataIndex++) {
            if (data[dataIndex].user !== $scope.currentUser._id) {
                calculateHold(data[dataIndex].data);
            } else {
                var indexToReplace = parseInt(_.findKey($scope.availableTimes, {'time': data[dataIndex].data.time}));
                if (indexToReplace !== -1) {
                    $scope.availableTimes[indexToReplace].toggled = true;
                }
            }
        }
    });
    //when some user selects a time other then this one we recieve it and caluclate holds
    socketService.on('newHold', function (data) {
        if (data.user !== $scope.currentUser._id) {
            calculateHold(data);
        }
    });
    //when a user selects a different time or leaves the modal we destroy the held time
    socketService.on('destroyOld', function (data) {
        destroyOld(data);
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

    $scope.selectedIndex = null;
    /**
     *  Create the actual appointment object when a time is selected
     *
     * @param time - the time object from availableTimes that was selected
     * @param index - the index of that time object in the array
     */
    $scope.createAppointmentObj = function (time, index) {
        //Set the activeTime to the time the user selected
        time.roomId = $scope.newRoomDate.toString() + $scope.employee._id;
        $scope.activeTime = time;
        //show the countdown
        $scope.showCount = true;
        socketService.emit('timeTaken', time);
        if (!timeStarted) {
            $scope.timerRunning = true;
            timeStarted = true;
        }
        $scope.$broadcast('timer-reset');
        $scope.$broadcast('timer-start');

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
            time.toggled = !time.toggled;
            $scope.selectedIndex = index;
        }
        time.roomId = $scope.newRoomDate.toString() + $scope.employee._id;

        /**
         *
         * If there is no previously selected time we simply toggle the current time, then
         * set the current index as the selected index.
         */
        if ($scope.selectedIndex == null) {
            time.toggled = !time.toggled;
            $scope.selectedIndex = index;
        }
        $scope.selectedIndex = index;
        //Format the values of the appointment
        var apptDay = moment($scope.selectedDate).format('dddd');
        var apptDate = moment($scope.selectedDate).format('MM/DD/YYYY');
        var apptTime = moment(time.time, 'hh:mm a').format('hh:mm a');
        var endTime = moment(time.time, 'hh:mm a').add($scope.service.duration, 'minutes').format('hh:mm a');

        var customerId;
        if (personal) {
            customerId = $rootScope.currentUser._id;
        } else {
            customerId = null;
        }
        //The actual appointment object that will be sent to the backend
        $scope.appointment = {
            businessId: $scope.service.businessId,
            employee: $scope.employee._id,
            customer: customerId,
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
    };

    //TODO Handle the case where the add appointment callback returns 400 because of overlapping appointments
    //When the user chooses to checkout w/ stripe
    this.checkOut = function (token) {
        //set the stripeToken returned from checkout
        $scope.appointment.stripeToken = token;
        $scope.appointment.price = $scope.stripePrice;
        //send the appointment to the backend
        businessFactory.addAppointment($scope.appointment)
            .then(function (appointment) {
                newNotification(appointment, appointment.customer);
                newNotification(appointment, appointment.employee);
                socketService.emit('timeDestroyed', $scope.activeTime);
                appointment.personal = personal;
                appointment.roomId = $scope.activeTime.roomId;
                //emit that an appointment was booked, sends to relevant sockets
                socketService.emit('apptBooked', appointment);
                //if (personal) {
                //    userFactory.getUserAppts().then(
                //        function (data) {
                //            $rootScope.currentUser.appointments = data;
                //        },
                //        function (errorMessage) {
                //            console.log(errorMessage);
                //        }
                //    );
                //}
                removeAllListeners();
                $uibModalInstance.close(appointment);
            }, function (err) {
                removeAllListeners();
                //TODO Really handle this
                console.log(err);
            });
    };
    //Books the appointment without stripe
    $scope.book = function () {
        businessFactory.addAppointment($scope.appointment)
            .then(function (appointment) {
                newNotification(appointment, appointment.customer);
                newNotification(appointment, appointment.employee);
                socketService.emit('timeDestroyed', $scope.activeTime);
                appointment.personal = personal;
                appointment.roomId = $scope.activeTime.roomId;
                socketService.emit('apptBooked', appointment);

            }, function (error) {
                removeAllListeners();
                $uibModalInstance.dismiss(error);
            });

    };
    //cancel and close the modal
    $scope.cancel = function () {
        if ($scope.activeTime) {
            socketService.emit('timeDestroyed', $scope.activeTime);
        }
        //TODO more testing to see if this is necessary
        //if ($scope.newRoomDate && $scope.employee) {
        //    socketService.emit('leaveApptRoom', $scope.newRoomDate.toString() + $scope.employee._id);
        //}
        $uibModalInstance.dismiss();
    };

    var newNotification = function (appointment, personToNotify) {
        //TODO Move this string to somewhere we can access it globally!
        var notification = 'You have a ' + $scope.service.name + ' ',
            type = 'calendar';
        notificationFactory.addNotification(personToNotify, notification, type, true, appointment.start.full)
            .then(function () {
                var data = {
                    id: personToNotify,
                    notification: notification,
                    type: type
                };
                socketService.emit('newNotifGenerated', data);
                removeAllListeners();
                $uibModalInstance.close(appointment);
            }, function (err) {
                console.log(err);
            });
    };
    var removeAllListeners = function () {
        socketService.removeListener('oldHold');
        socketService.removeListener('destroyOld');
        socketService.removeListener('newHold');
        socketService.removeListener('update');
        socketService.removeListener('newRoomAppt');
    };
    $scope.$on('$destroy', function (event) {
        if ($scope.selectedDate && $scope.employee) {
            var roomId = $scope.newRoomDate.toString() + $scope.employee._id;
            socketService.emit('leaveApptRoom', roomId);
        }
        removeAllListeners();
    });
};
