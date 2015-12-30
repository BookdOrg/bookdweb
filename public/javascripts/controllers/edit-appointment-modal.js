/**
 * Created by khalilbrown on 11/28/15.
 */
module.exports = function ($scope, $uibModalInstance, data, businessFactory, userFactory, socketService, personal, $rootScope) {
    $scope.dateObj = data;
    $scope.showNoEmployee = false;
    $scope.business = data.business;
    businessFactory.serviceDetails($scope.dateObj.appointment.service)
        .then(function (data) {
            $scope.service = businessFactory.service;
            $scope.employee = _.findWhere($scope.service.employees, {_id: $scope.dateObj.appointment.employee});
            if (!$scope.employee) {
                $scope.showNoEmployee = true;
            }
            $scope.stripePrice = $scope.service.price * 100;
        });
    $scope.selectedDate = data.appointment.start.date;
    $scope.countdown = 600;

    $scope.minDate = $scope.minDate ? null : moment();

    $scope.showCount = false;
    var timeStarted = false;

    $scope.$watch('selectedDate', function (newVal, oldVal) {
        if (newVal) {
            $scope.dayMessage = false;
            var selectedDate = new Date(newVal);
            getAvailableTimes(selectedDate, data.appointment.employee);
        }
    });

    $scope.timerFinished = function () {
        $scope.activeTime.toggled = !$scope.activeTime.toggled;
        $scope.showCount = false;
        $scope.$apply();
        socketService.emit('timeDestroyed', $scope.activeTime);
    };
    /**
     *
     * @param date
     * @param employeeId
     */
    function getAvailableTimes(date, employeeId) {
        var newDate = moment(date).format('MM/DD/YYYY');
        $scope.monthYear = moment(newDate).format('MM/YYYY');
        var employeeApptObj = {};
        if(personal){
            employeeApptObj = {
                startDate: newDate,
                id: employeeId,
                personal:true
            };
        }else{
            employeeApptObj = {
                startDate: newDate,
                id: employeeId,
                personal:false
            };
        }

        userFactory.getAppts(employeeApptObj)
            .then(function (data) {
                if ($scope.employee) {
                    calculateAppointments(data);
                }
                var testTime = function (element, index, list) {
                    if (element.time === $scope.dateObj.appointment.start.time) {
                        $scope.availableTimes[index].available = true;
                        $scope.availableTimes[index].status = false;
                        $scope.availableTimes[index].toggled = true;
                        $scope.selectedIndex = index;
                        //TODO Remove this $apply in favor of the correct way to get the view to update, current fixes the issue though
                        //$scope.$apply();
                    }
                };
                if (newDate === $scope.dateObj.appointment.start.date) {
                    _.each($scope.availableTimes, testTime);
                }
                socketService.emit('joinApptRoom', employeeApptObj);
            });
    }

    /**
     *
     * @param data
     */
    function calculateAppointments(data) {
        var duration = $scope.service.duration;
        var weekDay = moment($scope.selectedDate).format('dddd');
        $scope.availableTimes = [];
        for (var dayOfWeek = 0; dayOfWeek < $scope.employee.availability.length; dayOfWeek++) {
            if (weekDay == $scope.employee.availability[dayOfWeek].day) {
                var formatStart = moment($scope.employee.availability[dayOfWeek].start).format('hh:mm a');
                var formatEnd = moment($scope.employee.availability[dayOfWeek].end).format('hh:mm a');
                var startTime = moment(formatStart, 'hh:mm a');
                var endTime = moment(formatEnd, 'hh:mm a');
            }
            if (weekDay == $scope.employee.availability[dayOfWeek].day && $scope.employee.availability[dayOfWeek].available === false) {
                $scope.dayMessage = true;
                return;
            }

        }
        for (var m = startTime; startTime.isBefore(endTime); m.add(duration, 'minutes')) {
            var timeObj = {
                time: m.format('hh:mm a'),
                end: moment(startTime).add(duration, 'minutes').format('hh:mm a'),
                available: true,
                toggled: false,
                status: false,
                user: $scope.currentUser.user._id
            };
            $scope.availableTimes.push(timeObj);
        }

        data.forEach(function (array) {
            for (var availableTimesIndex = 0; availableTimesIndex < $scope.availableTimes.length; availableTimesIndex++) {
                for (var appointmentsIndex = 0; appointmentsIndex < array.length; appointmentsIndex++) {
                    var availableTime = moment($scope.availableTimes[availableTimesIndex].time, 'hh:mm a');
                    var startTime = moment(array[appointmentsIndex].start.time, 'hh:mm a');

                    var decreasedTime = moment($scope.availableTimes[availableTimesIndex].time, 'hh:mm a');

                    var endTime = moment(array[appointmentsIndex].end.time, 'hh:mm a');
                    var subtractedTime = decreasedTime.subtract(duration / 2, 'minutes');


                    if (availableTime.isSame(startTime)) {
                        $scope.availableTimes[availableTimesIndex].available = false;
                    }
                    if (availableTime.isBetween(startTime, endTime, 'minute')) {
                        $scope.availableTimes[availableTimesIndex].available = false;
                    }

                    if (startTime.isSame(subtractedTime)) {
                        $scope.availableTimes[availableTimesIndex - 1].available = false;
                    }
                }
            }
        });
        for (var availableTimesIndex = 0; availableTimesIndex < $scope.availableTimes.length; availableTimesIndex++) {
            for (var availableDaysIndex = 0; availableDaysIndex < $scope.employee.availability.length; availableDaysIndex++) {
                for (var gapsInDayIndex = 0; gapsInDayIndex < $scope.employee.availability[availableDaysIndex].gaps.length; gapsInDayIndex++) {

                    var formattedStart = moment($scope.employee.availability[availableDaysIndex].gaps[gapsInDayIndex].start).format('hh:mm a');
                    var formattedEnd = moment($scope.employee.availability[availableDaysIndex].gaps[gapsInDayIndex].end).format('hh:mm a');

                    var availableTime = moment($scope.availableTimes[availableTimesIndex].time, 'hh:mm a');
                    var gapStartTime = moment(formattedStart, 'hh:mm a');

                    var decreasedTime = moment(formattedEnd, 'hh:mm a');

                    var gapEndTime = moment(formattedEnd, 'hh:mm a');
                    var subtractedTime = decreasedTime.subtract(duration / 2, 'minutes');

                    if (availableTime.isSame(gapStartTime)) {
                        $scope.availableTimes[availableTimesIndex].available = false;
                    }
                    if (availableTime.isBetween(gapStartTime, gapEndTime, 'minute')) {
                        $scope.availableTimes[availableTimesIndex].available = false;
                    }

                    if (gapStartTime.isSame(subtractedTime)) {
                        $scope.availableTimes[availableTimesIndex - 1].available = false;
                    }
                }
            }
        }
    }

    socketService.on('update', function () {
        getAvailableTimes($scope.selectedDate, data.appointment.employee);
    });

    socketService.on('oldHold', function (data) {
        for (var dataIndex = 0; dataIndex < data.length; dataIndex++) {
            calculateHold(data[dataIndex].data);
        }
    });
    socketService.on('newHold', function (data) {
        if (data.user !== $scope.currentUser.user._id) {
            calculateHold(data);
        }
    });
    socketService.on('destroyOld', function (data) {
        if (data.user !== $scope.currentUser.user._id) {
            destroyOld(data);
        }
    });
    var calculateHold = function (timeObj) {
        var indexToReplace = parseInt(_.findKey($scope.availableTimes, {'time': timeObj.time}));
        var startTime = moment(timeObj.time, 'hh:mm a');
        var endTime = moment(timeObj.end, 'hh:mm a');
        var calculatedDuration = $scope.service.duration;
        for (var m = startTime; startTime.isBefore(endTime); m.add(calculatedDuration, 'minutes')) {
            $scope.availableTimes[indexToReplace].status = true;
            indexToReplace += 1;
        }
    };
    var destroyOld = function (timeObj) {
        var indexToReplace = parseInt(_.findKey($scope.availableTimes, {'time': timeObj.time}));
        var startTime = moment(timeObj.time, 'hh:mm a');
        var endTime = moment(timeObj.end, 'hh:mm a');
        var destroyDuration = $scope.service.duration;

        for (var m = startTime; startTime.isBefore(endTime); m.add(destroyDuration, 'minutes')) {
            $scope.availableTimes[indexToReplace].status = false;
            indexToReplace += 1;
        }
    };
    /**
     *
     * @param time
     * @param index
     */
    $scope.selectedIndex = null;
    $scope.createAppointmentObj = function (timeObj, index) {
        $scope.activeTime = timeObj;
        $scope.showCount = true;

        if (!timeStarted) {
            $scope.$broadcast('timer-start');
            $scope.timerRunning = true;
            timeStarted = true;
        } else if (timeStarted) {
            $scope.$broadcast('timer-reset');
            $scope.$broadcast('timer-start');
        }

        /**
         *
         * If there is a previously selected time and the previous selected time isn't equal to the current one
         * we toggle the previously selected time to be false; Toggle the current time to be true.
         * Then we set the current index as the selected index
         */
        if ($scope.selectedIndex !== null) {
            $scope.availableTimes[$scope.selectedIndex].toggled = false;
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
        var apptDay = moment($scope.selectedDate).format('dddd');
        var apptDate = moment($scope.selectedDate).format('MM/DD/YYYY');
        var apptTime = moment(timeObj.time, 'hh:mm a').format('hh:mm a');
        var endTime = moment(timeObj.time, 'hh:mm a').add($scope.service.duration, 'minutes').format('hh:mm a');

        $scope.appointment = {
            _id: data.appointment._id,
            businessId: data.appointment.businessId,
            employee: data.appointment.employee,
            customer: data.appointment.customer,
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

    $scope.update = function () {
        if (!$scope.appointment) {
            $scope.appointment = {
                _id: data.appointment._id,
                businessId: data.appointment.businessId,
                employee: data.appointment.employee,
                customer: data.appointment.customer,
                start: {
                    date: data.appointment.start.date,
                    monthYear: $scope.monthYear,
                    time: data.appointment.start.time,
                    day: data.appointment.start.day,
                    full: data.appointment.start.full
                },
                end: {
                    date: data.appointment.end.date,
                    time: data.appointment.end.time,
                    day: data.appointment.end.day,
                    full: data.appointment.end.full

                },
                service: $scope.service._id,
                title: $scope.service.name,
                timestamp: moment()
            };
        }
        socketService.emit('timeDestroyed', $scope.activeTime);
        businessFactory.updateAppointment($scope.appointment)
            .then(function (appointment) {
                var socketData = {
                    'from': $rootScope.currentUser.user._id,
                    'appointment': $scope.dateObj.appointment
                };
                socketService.emit('apptUpdated', socketData);
                $scope.dateObj.appointment = {};
                $scope.dateObj.appointment = appointment;
                $uibModalInstance.close($scope.dateObj);
            });
    };
    $scope.changeApptStatus = function () {
        $scope.dateObj.appointment.status = 'paid';
        businessFactory.updateStatus($scope.dateObj.appointment)
            .then(function (appointment) {
                $scope.dateObj.appointment = {};
                $scope.dateObj.appointment = appointment;
                $uibModalInstance.close($scope.dateObj);
            });
    };
    $scope.charge = function (appointment) {
        businessFactory.charge(appointment)
            .then(function (appointment) {
                $scope.dateObj.appointment = {};
                $scope.dateObj.appointment = appointment;
                $uibModalInstance.close($scope.dateObj);
            });
    };
    $scope.cancel = function () {
        if ($scope.activeTime) {
            socketService.emit('timeDestroyed', $scope.activeTime);
        }
        businessFactory.cancelAppointment($scope.dateObj.appointment)
            .then(function () {
                var socketData = {
                    'from': $rootScope.currentUser.user._id,
                    'appointment': $scope.dateObj.appointment
                };
                socketService.emit('apptCanceled', socketData);
                $scope.dateObj.appointment = {};
                $scope.dateObj.appointment = 'canceled';
                $uibModalInstance.close($scope.dateObj);
            });
    };
    $scope.close = function () {
        if ($scope.activeTime) {
            socketService.emit('timeDestroyed', $scope.activeTime);
        }
        $uibModalInstance.close();
    };
};