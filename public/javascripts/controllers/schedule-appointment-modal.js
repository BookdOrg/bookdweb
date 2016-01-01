/**
 * Created by Jonfor on 11/28/15.
 */
module.exports = function ($scope, $uibModalInstance, businessFactory, socketService, auth, $state, $rootScope,
                           userFactory, personal, tier, service, notificationFactory, facebookApi, utilService) {

    $scope.facebookApi = facebookApi;
    $scope.service = service;

    utilService.getGooglePlusPhotos($scope.service.employees, 0);

    $scope.stripePrice = $scope.service.price * 100;
    $scope.minDate = $scope.minDate ? null : moment();
    $scope.progressBar = 100;
    $scope.showCount = false;
    $scope.countdown = 600;
    $scope.tier = tier;
    var timeStarted = false;
    /**
     * Watch which date is selected on the calendar,
     * each time a new date is selected we need to call the getAvailable times function
     *
     */
    $scope.$watch('selectedDate', function (newVal, oldVal) {
        if (newVal) {
            $scope.dayMessage = false;
            getAvailableTimes(newVal, $scope.employee._id);
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
    /**
     *
     * @param employee
     */
    $scope.selectEmployee = function (employee) {
        $scope.availableTimes = [];
        $scope.employee = employee;
        var day = new Date();
        getAvailableTimes(day, $scope.employee._id);
    };

    /**
     *
     * @param date - the date selected on the calendar
     * @param employeeId - the employee who's availability we need to check
     */
    function getAvailableTimes(date, employeeId) {
        var newDate = moment(date).format('MM/DD/YYYY');
        $scope.monthYear = moment(newDate).format('MM/YYYY');
        var employeeApptObj = {};
        if (personal) {
            employeeApptObj = {
                startDate: newDate,
                employeeId: employeeId,
                customerId: $rootScope.currentUser.user._id,
                personal: true
            };
        } else {
            employeeApptObj = {
                startDate: newDate,
                employeeId: employeeId,
                customerId: null,
                personal: false
            };
        }
        /**
         * Make a request for both the customer and employee's appointments, returns
         * all appointments on the given selected start date
         */
        userFactory.getAppts(employeeApptObj)
            .then(function (data) {
                calculateAppointments(data);
                socketService.emit('joinApptRoom', employeeApptObj);
            });
    }

    /**
     *  Calculate the availability for both the customer and the employee, based on their scheduled appointments
     *  and indicated breaks during the day
     *
     * @param data - array containing all the customer and employees personal and business appointments
     */
    function calculateAppointments(data) {
        $scope.dayMessage = false;
        //Which day of the week is currently selected
        var weekDay = moment($scope.selectedDate).format('dddd');
        $scope.availableTimes = [];
        //Loop through the employees availability object, each Index being a day of the week
        for (var dayOfWeek = 0; dayOfWeek < $scope.employee.availability.length; dayOfWeek++) {
            //if that weekDay is in the employees availability format the hours that he/she works based on
            //the start/end times
            if (weekDay === $scope.employee.availability[dayOfWeek].day) {
                var formatStart = moment($scope.employee.availability[dayOfWeek].start).format('hh:mm a');
                var formatEnd = moment($scope.employee.availability[dayOfWeek].end).format('hh:mm a');
                var startTime = moment(formatStart, 'hh:mm a');
                var endTime = moment(formatEnd, 'hh:mm a');
            }
            //If the employee is not available on that given day set the dayMessage to true, show the user
            //that they cannot book with that employee
            if (weekDay === $scope.employee.availability[dayOfWeek].day && $scope.employee.availability[dayOfWeek].available === false) {
                $scope.dayMessage = true;
                return;
            }

        }
        //Duration - how long does the service last
        var duration = $scope.service.duration;
        //Create available time objects by adding the length of the service over and over from the
        //employees start time in the morning until their end time. Push them into an array
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
        /**
         * For each of the appointment arrays, at max 4. - Customer Peronsl and Business. Employee Personal and Business
         */
        data.forEach(function (array) {
            /**
             * Loop through each of the available time slots that were created based on the employees day
             */
            for (var availableTimesIndex = 0; availableTimesIndex < $scope.availableTimes.length; availableTimesIndex++) {
                //Loop through the current array of appointments
                for (var appointmentsIndex = 0; appointmentsIndex < array.length; appointmentsIndex++) {
                    //Format the current available time and the start time of the appointment
                    var availableTime = moment($scope.availableTimes[availableTimesIndex].time, 'hh:mm a');
                    var startTime = moment(array[appointmentsIndex].start.time, 'hh:mm a');

                    var decreasedTime = moment($scope.availableTimes[availableTimesIndex].time, 'hh:mm a');
                    //Format the time the appointment ends
                    var endTime = moment(array[appointmentsIndex].end.time, 'hh:mm a');
                    //We subtract half the duration of the service from the available time
                    var subtractedTime = decreasedTime.subtract(duration / 2, 'minutes');

                    //If the availableTime is the same as the appointment start time, the available time isn't available
                    if (availableTime.isSame(startTime)) {
                        $scope.availableTimes[availableTimesIndex].available = false;
                    }
                    //if the available time is between the start and end time, it's not available
                    if (availableTime.isBetween(startTime, endTime, 'minute')) {
                        $scope.availableTimes[availableTimesIndex].available = false;
                    }
                    //if the start time of an available time is the same as half the duration, it's not available
                    if (startTime.isSame(subtractedTime)) {
                        $scope.availableTimes[availableTimesIndex - 1].available = false;
                    }
                }
            }
        });
        //Loop through the available times again
        for (var availableTimesIndex = 0; availableTimesIndex < $scope.availableTimes.length; availableTimesIndex++) {
            //Loop through the employees available days, from his/her availability
            for (var availableDaysIndex = 0; availableDaysIndex < $scope.employee.availability.length; availableDaysIndex++) {
                if (weekDay == $scope.employee.availability[availableDaysIndex].day) {
                    //Loop through the gaps for that day (Breaks the employee has added)
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
    }

    //If someone books an appointment, update the current users screen
    socketService.on('update', function () {
        getAvailableTimes($scope.selectedDate, $scope.employee._id);
    });
    //When a socket join the appointment room late, we send the list of availabletimes currently being held
    socketService.on('oldHold', function (data) {
        for (var dataIndex = 0; dataIndex < data.length; dataIndex++) {
            calculateHold(data[dataIndex].data);
        }
    });
    //when some user selects a time other then this one we recieve it and caluclate holds
    socketService.on('newHold', function (data) {
        if (data.user !== $scope.currentUser.user._id) {
            calculateHold(data);
        }
    });
    //when a user selects a different time or leaves the modal we destroy the held time
    socketService.on('destroyOld', function (data) {
        destroyOld(data);
    });
    //Calculate what availableTime/how many we should disabled
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
    //Toggle the held time off
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

    $scope.selectedIndex = null;
    /**
     *  Create the actual appointment object when a time is selected
     *
     * @param time - the time object from availableTimes that was selected
     * @param index - the index of that time object in the array
     */
    $scope.createAppointmentObj = function (time, index) {
        //Set the activeTime to the time the user selected
        $scope.activeTime = time;
        //show the countdown
        $scope.showCount = true;
        socketService.emit('timeTaken', time);
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
            time.toggled = !time.toggled;
            $scope.selectedIndex = index;
        }
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
            customerId = $rootScope.currentUser.user._id;
        } else {
            customerId = '';
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
                socketService.emit('timeDestroyed', $scope.activeTime);
                $scope.appointment.personal = personal;
                //emit that an appointment was booked, sends to relevant sockets
                socketService.emit('apptBooked', appointment);
                if (personal) {
                    userFactory.getUserAppts().then(
                        function (data) {
                            $rootScope.currentUser.user.appointments = data;
                        },
                        function (errorMessage) {
                            console.log(errorMessage);
                        }
                    );
                }
                $uibModalInstance.close(appointment);
            }, function (err) {
                //TODO Really handle this
                console.log(err);
            });
    };
    //Books the appointment without stripe
    $scope.book = function () {
        businessFactory.addAppointment($scope.appointment)
            .then(function (appointment) {
                socketService.emit('timeDestroyed', $scope.activeTime);
                $scope.appointment.personal = personal;
                socketService.emit('apptBooked', appointment);
                $uibModalInstance.close(appointment);
            }, function (error) {
                $uibModalInstance.dismiss(error);
            });

    };
    //cancel and close the modal
    $scope.cancel = function () {
        if ($scope.activeTime) {
            socketService.emit('timeDestroyed', $scope.activeTime);
        }
        $uibModalInstance.dismiss('Appointment Booking Canceled');
    };

    $scope.newNotification = function (appointment, personToNotify) {
        //TODO Move this string to somewhere we can access it globally!
        notificationFactory.addNotification(personToNotify,
                'You have a ' + $scope.service.name + ' on ' + appointment.start.date + ' at ' + appointment.start.time
                + '.', 'alert', false)
            .then(function () {

            }, function (err) {
                console.log(err);
            });
    };
};
