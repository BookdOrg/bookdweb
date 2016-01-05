/**
 * Created by khalilbrown on 10/5/15.
 */
module.exports = function ($scope, $state, auth, userFactory, $compile, uiCalendarConfig, $uibModal, $timeout,
                           businessFactory, socketService, $rootScope, Notification) {

    //Auto toggles which button-group button will be selected
    $scope.radioModel = 'Month';
    //Enables modal animations
    $scope.animationsEnabled = true;
    var date = new Date();
    var d = date.getDate();
    var m = date.getMonth();
    var y = date.getFullYear();

    /**
     * Define the three types of events that will be displayed on the calendar
     *
     * @type {Array}
     */
    $scope.events = [];
    /**
     *
     * Populate the event types based on the appointments of the current users,
     * loop through each appointment type, personal and business. Push the event object
     * title,start,end,appointment into the correct event type array.
     *
     */
    var createEventsSources = function (appointmentsArray) {
        for (var pappointmentIndex = 0; pappointmentIndex < appointmentsArray.personalAppointments.length; pappointmentIndex++) {
            var personalTempObj = {
                title: appointmentsArray.personalAppointments[pappointmentIndex].title,
                start: appointmentsArray.personalAppointments[pappointmentIndex].start.full,
                end: appointmentsArray.personalAppointments[pappointmentIndex].end.full,
                appointment: appointmentsArray.personalAppointments[pappointmentIndex]
            };
            if (appointmentsArray.personalAppointments[pappointmentIndex].status !== 'pending') {
                $scope.events.push(personalTempObj);
            } else {
                personalTempObj.backgroundColor = '#f00';
                personalTempObj.borderColor = '#f00';
                $scope.events.push(personalTempObj);
            }
        }
        for (var bappointmentIndex = 0; bappointmentIndex < appointmentsArray.businessAppointments.length; bappointmentIndex++) {
            var businessTempObj = {
                title: appointmentsArray.businessAppointments[bappointmentIndex].title,
                start: appointmentsArray.businessAppointments[bappointmentIndex].start.full,
                end: appointmentsArray.businessAppointments[bappointmentIndex].end.full,
                appointment: appointmentsArray.businessAppointments[bappointmentIndex]
            };
            if (appointmentsArray.businessAppointments[bappointmentIndex].status !== 'pending') {
                businessTempObj.backgroundColor = '#f70';
                businessTempObj.borderColor = '#f70';
                $scope.events.push(businessTempObj);
            } else {
                businessTempObj.backgroundColor = '#f00';
                businessTempObj.borderColor = '#f00';
                $scope.events.push(businessTempObj);
            }
        }
    };
    /**
     *
     * The events sources that will be passed to the calendar,
     * configuration for what properties events of each type will have
     * when they are displayed
     *
     * @type {{events: Array}}
     */
    $scope.eventsSource = {
        events: $scope.events
    };

    /**
     * Opens the edit Appointment modal, for editing appointments
     *
     * @param size - String - size of the modal to open
     * @param data - Object - the appointment to be edited
     * @param type - Boolean - is the appointment being edited by the user who's appointment it is or an employee/business owner
     */
    $scope.open = function (size, data,type) {
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: '/partials/modals/editAppointment.html',
            controller: 'editAppointmentModalCtrl',
            backdrop: 'static',
            keyboard: false,
            size: size,
            resolve: {
                data: function () {
                    return data;
                },
                personal:function(){
                    return type;
                }
            }
        });
        /**
         * Once the modal instance as been closed, we remove all events from the calendar
         * and then render the calendar again with the updated events.
         *
         */
        modalInstance.result.then(function (date) {
            //If the updated appointment wasn't canceled we enter this block
            if (date && date.appointment !== 'canceled') {
                //set the new stat and end states according to the updated appointment
                date.start = date.appointment.start.full;
                date.end = date.appointment.end.full;
                //if the appointment is active and the person on the calendar is the customer enter this block, set bgcolor
                if (date.appointment.status === 'active' && date.appointment.customer === $rootScope.currentUser.user._id) {
                    date.backgroundColor = '#3A87BA';
                    date.borderColor = '#3A87BA';
                    //if the appointment is active and the person on the calendar is the employee enter this block, set bgColor
                } else if (date.appointment.status === 'active' && date.appointment.employee == $rootScope.currentUser.user._id) {
                    date.backgroundColor = '#f70';
                    date.borderColor = '#f70';
                    //if the appointment is active and there's no customer we set the bgColor as blue -- THIS MAY BE REDUNDANT (For dashboard)
                } else if (date.appointment.status === 'active' && date.appointment.employee !== $rootScope.currentUser.user._id ||
                    date.appointment.customer !== $rootScope.currentUser.user._id) {
                    date.backgroundColor = '#3A87BA';
                    date.borderColor = '#3A87BA';
                }
                //If the status of the appointment is pending the we set the background color to red
                if (date.appointment.status === 'pending') {
                    date.backgroundColor = '#f00';
                    date.borderColor = '#f00';
                }
                uiCalendarConfig.calendars['myCalendar1'].fullCalendar('updateEvent', date);
            } else if (date && date.appointment === 'canceled') {
                uiCalendarConfig.calendars['myCalendar1'].fullCalendar('removeEvents', [date._id]);
            }
        }, function () {

        });
    };
    /**
     *
     * Opens a modal that allows employees to update their availability.
     *
     * @param size - the size of the modal
     */
    $scope.openAvailabilityModal = function (size,employee) {
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: '/partials/modals/updateAvailabilityModal.html',
            controller: 'updatedAvailabilityCtrl',
            backdrop: 'static',
            keyboard: false,
            size: size,
            resolve:{
                employee:function(){
                    return $rootScope.currentUser.user;
                }
            }
        });

    };
    /* event source that calls a function on every view switch */
    /* alert on eventClick */
    $scope.alertOnEventClick = function (date, jsEvent, view) {
        var personal = false;
        if (date.appointment.customer) {
            personal = true;
        }
        $scope.open('lg', date, personal);
    };
    //TODO when drag and drop finished used the delta to calculate when the new appointment should be and open the update modal
    /* alert on Drop */
    $scope.alertOnDrop = function (event, delta, revertFunc, jsEvent, ui, view) {
        //$scope.alertMessage = ('Event Dropped to make dayDelta ' + delta);
        //console.log(delta);
        //console.log(event);
    };
    /* alert on Resize */
    $scope.alertOnResize = function (event, delta, revertFunc, jsEvent, ui, view) {
        //$scope.alertMessage = ('Event Resized to make dayDelta ' + delta);
    };
    /* add and removes an event source of choice */
    $scope.addRemoveEventSource = function (sources, source) {
        var canAdd = 0;
        angular.forEach(sources, function (value, key) {
            if (sources[key] === source) {
                sources.splice(key, 1);
                canAdd = 1;
            }
        });
        if (canAdd === 0) {
            sources.push(source);
        }
    };
    /* add custom event to the calendar*/
    $scope.addEvent = function (appointment) {
        $scope.events.push({
            title: appointment.title,
            start: appointment.start.full,
            end: appointment.end.full,
            appointment: appointment,
            backgroundColor: '#f70',
            borderColor: '#f70'
        });
    };
    /* remove event */
    $scope.remove = function (index) {
        $scope.events.splice(index, 1);
    };
    /* Change View */
    $scope.changeView = function (view, calendar) {
        uiCalendarConfig.calendars[calendar].fullCalendar('changeView', view);
    };
    /* Change View */
    $scope.renderCalender = function (calendar) {
        $timeout(function () {
            if (uiCalendarConfig.calendars[calendar]) {
                uiCalendarConfig.calendars[calendar].fullCalendar('render');
            }
        });
    };
    /* Render Tooltip */
    $scope.eventRender = function (event, element, view) {
        element.attr({
            'uib-tooltip': event.title,
            'tooltip-append-to-body': true
        });
        $compile(element)($scope);
    };

    /**
     *
     * Refresh the calendar every minute
     *
     */
    var refreshingPromise;
    var isRefreshing = false;
    $scope.startRefreshing = function(){
        if(isRefreshing) return;
        isRefreshing = true;
        (function refreshEvery(){
            userFactory.getUserAppts(null, $scope.monthYear)
                .then(function (data) {
                    $scope.events = [];
                    $scope.appointments = data;
                    //$scope.monthYearArray[$scope.monthYear].appointments = {};
                    //$scope.monthYearArray[$scope.monthYear].appointments = data;
                    createEventsSources($scope.appointments);
                    $scope.lastUpdated = moment().calendar();
                    //localStorage.setItem('monthYearArray', angular.toJson($scope.monthYearArray));
                    localStorage['previousPersonalMonthYear'] = $scope.monthYear;
                    refreshingPromise = $timeout(refreshEvery,60000);
                });
        }());
    };
    /**
     *
     * Renders the view whenever actions on the calendar are taken
     * i.e. switching between days/months. Whenever this happens we make
     * a call for the users appointments.
     *
     * @param view
     * @param element
     */
    //TODO cache the appointments and only make the calls as needed
    $scope.monthYearArray = {};
    $scope.viewRender = function(view,element){
        $scope.lastUpdated = moment().calendar();
        //var fetchedMonthYearArray = localStorage.getItem('monthYearArray');
        //if (fetchedMonthYearArray !== '') {
        //    $scope.monthYearArray = angular.fromJson(fetchedMonthYearArray);
        //}
        var monthYear = uiCalendarConfig.calendars['myCalendar1'].fullCalendar('getDate');
        //convert monthYear into the correct format
        $scope.monthYear = moment(monthYear).format('MM/YYYY');
        var previousMonthYear = localStorage['previousPersonalMonthYear'];
        if ($scope.monthYear !== previousMonthYear || !$scope.appointments) {
            //if (!$scope.monthYearArray[$scope.monthYear]) {
            //    $scope.monthYearArray[$scope.monthYear] = {};
            //}
            uiCalendarConfig.calendars['myCalendar1'].fullCalendar('removeEvents');
            userFactory.getUserAppts(null, $scope.monthYear)
                .then(function (data) {
                    $scope.appointments = data;
                    //$scope.monthYearArray[$scope.monthYear].appointments = {};
                    //$scope.monthYearArray[$scope.monthYear].appointments = data;
                    createEventsSources($scope.appointments);
                    //localStorage.setItem('monthYearArray', angular.toJson($scope.monthYearArray));
                    localStorage['previousPersonalMonthYear'] = $scope.monthYear;
                    $scope.startRefreshing();
                });
        }
        //else if ($scope.monthYear === previousMonthYear) {
        //    uiCalendarConfig.calendars['myCalendar1'].fullCalendar('removeEvents');
        //    createEventsSources($scope.monthYearArray[$scope.monthYear].appointments);
        //}
    };
    /* Calendar config object */
    $scope.uiConfig = {
        calendar: {
            height: 700,
            editable: true,
            displayEventEnd:true,
            defaultView: 'month',
            header: {
                left: 'title',
                center: '',
                right: 'today prev,next'
            },
            eventClick: $scope.alertOnEventClick,
            eventDrop: $scope.alertOnDrop,
            eventResize: $scope.alertOnResize,
            eventRender: $scope.eventRender,
            viewRender: $scope.viewRender,
            addEvent: $scope.addEvent
        }
    };

    $scope.calendars = uiCalendarConfig.calendars;
    //Creates the eventsSources array that the calendar will display, initialize it with the values created earlier
    $scope.eventSources = [$scope.eventsSource];

    socketService.on('newAssociateAppt', function (appointment) {
        Notification.success({message: 'New appointment booked!'});
        $scope.addEvent(appointment);
    });
    socketService.on('updatedAppt', function (data) {
        console.log(data);
        /**
         *
         * If the data comes from the appointments customer, we know that the update is for the Employee.
         *
         * Find the appointment in the events array and then update the appointment for the employee.
         */
        if (data.from === data.appointment.customer) {
            for (var eventIndex = 0; eventIndex < $scope.events.length; eventIndex++) {
                if ($scope.events[eventIndex].appointment._id === data.appointment._id) {
                    $scope.events[eventIndex].start = moment(data.appointment.start.full).format();
                    $scope.events[eventIndex].end = moment(data.appointment.end.full).format();
                    $scope.events[eventIndex].title = data.appointment.title;
                    $scope.events[eventIndex].appointment = data.appointment;
                    $scope.events[eventIndex].backgroundColor = '#f70';
                    $scope.events[eventIndex].borderColor = '#f70';
                    Notification.info({message: 'A customer has re-scheduled an appointment!'});
                    uiCalendarConfig.calendars['myCalendar1'].fullCalendar('updateEvent', $scope.events[eventIndex]);
                }
            }
            /**
             * If the data comes from the employee OR not from the customer, we know that the update is for the customer
             * from the employee or the business.
             *
             * Find the appointment in th events array and then update the appointment for the customer, set the background to
             * the pending color.
             *
             * This appointment should not show up for the employee since it has a status of pending.
             */
        } else if (data.from === data.appointment.employee || data.from !== data.appointment.customer) {
            for (eventIndex = 0; eventIndex < $scope.events.length; eventIndex++) {
                if ($scope.events[eventIndex].appointment._id === data.appointment._id) {
                    $scope.events[eventIndex].start = moment(data.appointment.start.full).format();
                    $scope.events[eventIndex].end = moment(data.appointment.end.full).format();
                    $scope.events[eventIndex].title = data.appointment.title;
                    $scope.events[eventIndex].appointment = data.appointment;
                    $scope.events[eventIndex].backgroundColor = '#f00';
                    $scope.events[eventIndex].borderColor = '#f00';
                    Notification.warning({message: 'An employee has requested to re-schedule an appointment!'});
                    uiCalendarConfig.calendars['myCalendar1'].fullCalendar('updateEvent', $scope.events[eventIndex]);
                }
            }
        }

    });
    /**
     *
     * When the socket sends us an appointment that was canceled we loop through all events
     * once we find the event that has the matching appointment we remove the event from the calendar and show the
     * notification
     *
     */
    socketService.on('canceledAppt', function (data) {
        for (var eventIndex = 0; eventIndex < $scope.events.length; eventIndex++) {
            if ($scope.events[eventIndex].appointment._id === data.appointment._id) {
                uiCalendarConfig.calendars['myCalendar1'].fullCalendar('removeEvents', [$scope.events[eventIndex]._id]);
                Notification.warning({message: 'An appointment has been canceled'});
            }
            //$scope.monthYearArray[data.appointment.start.monthYear].appointments.personalAppointments = _.without($scope.monthYearArray[data.appointment.start.monthYear].appointments.personalAppointments,
            //    _.findWhere($scope.monthYearArray[data.appointment.start.monthYear].appointments.personalAppointments, {'_id': data.appointment._id}));
            //localStorage.setItem('monthYearArray', angular.toJson($scope.monthYearArray));
            //$scope.monthYearArray[data.appointment.start.monthYear].appointments.businessAppointments = _.without($scope.monthYearArray[data.appointment.start.monthYear].appointments.businessAppointments,
            //    _.findWhere($scope.monthYearArray[data.appointment.start.monthYear].appointments.businessAppointments, {'_id': data.appointment._id}));
            //localStorage.setItem('monthYearArray', angular.toJson($scope.monthYearArray));
        }
    });
};

