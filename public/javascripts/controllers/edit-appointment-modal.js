/**
 * Created by khalilbrown on 11/28/15.
 */
module.exports = function ($scope, $uibModalInstance, data, businessFactory, userFactory, socketService, personal, $rootScope) {
    //The event object from the calendar, passed into the edit modal
    $scope.dateObj = data;
    $scope.showNoEmployee = false;
    $scope.business = data.business;
    //Make a request to get the details for the service this appointment was scheduled for.
    businessFactory.serviceDetails($scope.dateObj.appointment.service)
        .then(function (data) {
            //set the service to the $scope property
            $scope.service = data;
            //grab the employee details from the services list of employees based on the appointments employeeID
            $scope.employee = _.findWhere($scope.service.employees, {_id: $scope.dateObj.appointment.employee});
            //if there's no employee we set this flag to true
            if (!$scope.employee) {
                $scope.showNoEmployee = true;
            }
            $scope.stripePrice = $scope.service.price * 100;
        });

    //Auto-select the date of the appointment as the date the calendar opens to
    $scope.selectedDate = data.appointment.start.date;
    var dateSelected = moment($scope.selectedDate).format();
    var today = moment().format();
    $scope.previousDate =false;
    if(moment(dateSelected).isBefore(today,'hour')){
        $scope.previousDate = true;
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
            var selectedDate = new Date(newVal);
            getAvailableTimes(selectedDate, data.appointment.employee);
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
     * @param date - the date selected on the calendar
     * @param employeeId - the employee who's availability we need to check
     */
    function getAvailableTimes(date, employeeId) {
        var newDate = moment(date).format('MM/DD/YYYY');
        $scope.monthYear = moment(newDate).format('MM/YYYY');

        var employeeApptObj = {};
        //If the appointment is being edited by the user who it's for this flag will be true
        if(personal){
            employeeApptObj = {
                startDate: newDate,
                employeeId: employeeId,
                customerId: data.appointment.customer,
                personal:true
            };
        }else{
            employeeApptObj = {
                startDate: newDate,
                employeeId: employeeId,
                customerId: data.appointment.customer,
                personal:false
            };
        }
        /**
         * Make a request for both the customer and employee's appointments, returns
         * all appointments on the given selected start date
         */
        userFactory.getAppts(employeeApptObj)
            .then(function (data) {
                //If an employee has been selected calculate the time slots available for the day
                if ($scope.employee) {
                    calculateAppointments(data);
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
                    if (element.time === $scope.dateObj.appointment.start.time) {
                        $scope.availableTimes[index].available = true;
                        $scope.availableTimes[index].status = false;
                        $scope.availableTimes[index].toggled = true;
                        $scope.selectedIndex = index;
                        //TODO Remove this $apply in favor of the correct way to get the view to update, current fixes the issue though
                        //$scope.$apply();
                    }
                };
                //if the date selected is the same as the start date of the appointment run that function for each value
                //in available timess
                if (newDate === $scope.dateObj.appointment.start.date) {
                    _.each($scope.availableTimes, testTime);
                }
                //Join the socket room with all the other users who are looking at this date for the given employee.
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
        //Duration - how long does the service last
        var duration = $scope.service.duration;
        //Which day of the week is currently selected
        var weekDay = moment($scope.selectedDate).format('dddd');
        $scope.availableTimes = [];
        //Loop through the employees availability object, each Index being a day of the week
        for (var dayOfWeek = 0; dayOfWeek < $scope.employee.availability.length; dayOfWeek++) {
            //if that weekDay is in the employees availability format the hours that he/she works based on
            //the start/end times
            if (weekDay == $scope.employee.availability[dayOfWeek].day) {
                var formatStart = moment($scope.employee.availability[dayOfWeek].start).format('hh:mm a');
                var formatEnd = moment($scope.employee.availability[dayOfWeek].end).format('hh:mm a');
                var startTime = moment(formatStart, 'hh:mm a');
                var endTime = moment(formatEnd, 'hh:mm a');
            }
            //If the employee is not available on that given day set the dayMessage to true, show the user
            //that they cannot book with that employee
            if (weekDay == $scope.employee.availability[dayOfWeek].day && $scope.employee.availability[dayOfWeek].available === false) {
                $scope.dayMessage = true;
                return;
            }

        }
        //Create available time objects by adding the length of the service over and over from the
        //employees start time in the morning until their end time. Push them into an array
        for (var m = startTime; startTime.isBefore(endTime); m.add(duration, 'minutes')) {
            var timeObj = {
                time: m.format('hh:mm a'),
                end: moment(startTime).add(duration, 'minutes').format('hh:mm a'),
                available: true,
                toggled: false,
                status: false,
                user: $rootScope.currentUser.user._id
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
                    //Format
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
                //Loop through the gaps for that day (Breaks the employee has added)
                for (var gapsInDayIndex = 0; gapsInDayIndex < $scope.employee.availability[availableDaysIndex].gaps.length; gapsInDayIndex++) {
                    //same as above
                    var formattedStart = moment($scope.employee.availability[availableDaysIndex].gaps[gapsInDayIndex].start).format('hh:mm a');
                    var formattedEnd = moment($scope.employee.availability[availableDaysIndex].gaps[gapsInDayIndex].end).format('hh:mm a');
                    //the available Time
                    var availableTime = moment($scope.availableTimes[availableTimesIndex].time, 'hh:mm a');
                    //start time of the break
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

    //If someone books an appointment, update the current users screen
    socketService.on('update', function () {
        getAvailableTimes($scope.selectedDate, data.appointment.employee);
    });
    //When a socket join the appointment room late, we send the list of availabletimes currently being held
    socketService.on('oldHold', function (data) {
        for (var dataIndex = 0; dataIndex < data.length; dataIndex++) {
            calculateHold(data[dataIndex].data);
        }
    });
    //when some user selects a time other then this one we recieve it and caluclate holds
    socketService.on('newHold', function (data) {
        if (data.user !== $rootScope.currentUser.user._id) {
            calculateHold(data);
        }
    });
    //when a user selects a different time or leaves the modal we destroy the held time
    socketService.on('destroyOld', function (data) {
        if (data && data.user !== $rootScope.currentUser.user._id) {
            destroyOld(data);
        }
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
    /**
     *  Create the actual appointment object when a time is selected
     *
     * @param time - the time object from availableTimes that was selected
     * @param index - the index of that time object in the array
     */
    $scope.selectedIndex = null;
    $scope.createAppointmentObj = function (timeObj, index) {
        //Set the activeTime to the time the user selected
        $scope.activeTime = timeObj;
        //show the countdown
        $scope.showCount = true;
        //if the timer isn't starter, start it
        if (!timeStarted) {
            $scope.$broadcast('timer-start');
            $scope.timerRunning = true;
            timeStarted = true;
            //if it's already running reset it then start it
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
        //Format the values of the appointment
        var apptDay = moment($scope.selectedDate).format('dddd');
        var apptDate = moment($scope.selectedDate).format('MM/DD/YYYY');
        var apptTime = moment(timeObj.time, 'hh:mm a').format('hh:mm a');
        var endTime = moment(timeObj.time, 'hh:mm a').add($scope.service.duration, 'minutes').format('hh:mm a');
        //The actual appointment object that will be sent to the backend
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
    //If the appointment is being updated
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
        /**
         * Update the appointment, send a message to sockets who need to know
         *
         * Pass the new appointment back to the controller that called this modal.
         *
         */
        businessFactory.updateAppointment($scope.appointment)
            .then(function (appointment) {
                var socketData = {
                    'from': $rootScope.currentUser.user._id,
                    'appointment': appointment
                };
                socketService.emit('timeDestroyed', $scope.activeTime);
                socketService.emit('apptUpdated', socketData);
                $scope.dateObj.appointment = {};
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
                $scope.dateObj.appointment = {};
                $scope.dateObj.appointment = appointment;
                $uibModalInstance.close($scope.dateObj);
            });
    };
    //Charge the customer via stripe if they entered their card information
    $scope.charge = function (appointment) {
        businessFactory.charge(appointment)
            .then(function (appointment) {
                $scope.dateObj.appointment = {};
                $scope.dateObj.appointment = appointment;
                $uibModalInstance.close($scope.dateObj);
            });
    };
    //Cancel the appointment
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
    //close the modal
    $scope.close = function () {
        if ($scope.activeTime) {
            socketService.emit('timeDestroyed', $scope.activeTime);
        }
        $uibModalInstance.close();
    };
};