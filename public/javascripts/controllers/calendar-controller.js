/**
 * Created by khalilbrown on 10/5/15.
 */
module.exports = function ($scope, $state, auth, userFactory, $compile, uiCalendarConfig, $uibModal, $timeout, businessFactory) {
    $scope.radioModel = 'Week';
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
    $scope.personalEvents = [];
    $scope.associateEvents = [];
    $scope.pendingEvents = [];
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
                $scope.personalEvents.push(personalTempObj);
            } else {
                $scope.pendingEvents.push(personalTempObj);
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
                $scope.associateEvents.push(businessTempObj);
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
    $scope.eventsPersonalSource = {
        //color:'#00',
        //textColor:'blue',
        events: $scope.personalEvents
    };
    $scope.eventsAssociateSource = {
        color: '#f70',
        //textColor:'blue',
        events: $scope.associateEvents
    };
    $scope.eventsPendingSource = {
        color: '#f00',
        events: $scope.pendingEvents
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
            if (date && date.appointment !== 'canceled') {
                date.start = date.appointment.start.full;
                date.end = date.appointment.end.full;
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
    $scope.openAvailabilityModal = function (size) {
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: '/partials/modals/updateAvailabilityModal.html',
            controller: 'updatedAvailabilityCtrl',
            backdrop: 'static',
            keyboard: false,
            size: size
        });

    };
    /* event source that calls a function on every view switch */
    /* alert on eventClick */
    $scope.alertOnEventClick = function (date, jsEvent, view) {
        $scope.open('lg', date,true);
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
    /* add custom event*/
    $scope.addEvent = function () {
        $scope.events.push({
            title: 'Open Sesame',
            start: new Date(y, m, 28),
            end: new Date(y, m, 29),
            className: ['openSesame']
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
        var fetchedMonthYearArray = localStorage.getItem('monthYearArray');
        if (fetchedMonthYearArray !== '') {
            $scope.monthYearArray = angular.fromJson(fetchedMonthYearArray);
        }
        var monthYear = uiCalendarConfig.calendars['myCalendar1'].fullCalendar('getDate');
        //convert monthYear into the correct format
        $scope.monthYear = moment(monthYear).format('MM/YYYY');
        var previousMonthYear = localStorage['previousPersonalMonthYear'];
        if ($scope.monthYear !== previousMonthYear || !$scope.monthYearArray[$scope.monthYear]) {
            if (!$scope.monthYearArray[$scope.monthYear]) {
                $scope.monthYearArray[$scope.monthYear] = {};
            }
            uiCalendarConfig.calendars['myCalendar1'].fullCalendar('removeEvents');
            userFactory.getUserAppts(null, $scope.monthYear)
                .then(function (data) {
                    $scope.appointments = data;
                    $scope.monthYearArray[$scope.monthYear].appointments = {};
                    $scope.monthYearArray[$scope.monthYear].appointments = data;
                    createEventsSources($scope.monthYearArray[$scope.monthYear].appointments);
                    localStorage.setItem('monthYearArray', angular.toJson($scope.monthYearArray));
                    localStorage['previousPersonalMonthYear'] = $scope.monthYear;

                });
        } else if ($scope.monthYear === previousMonthYear) {
            uiCalendarConfig.calendars['myCalendar1'].fullCalendar('removeEvents');
            createEventsSources($scope.monthYearArray[$scope.monthYear].appointments);
        }
    };
    /* Calendar config object */
    $scope.uiConfig = {
        calendar: {
            height: 700,
            editable: true,
            displayEventEnd:true,
            defaultView: 'agendaWeek',
            header: {
                left: 'title',
                center: '',
                right: 'today prev,next'
            },
            eventClick: $scope.alertOnEventClick,
            eventDrop: $scope.alertOnDrop,
            eventResize: $scope.alertOnResize,
            eventRender: $scope.eventRender,
            viewRender: $scope.viewRender
        }
    };

    $scope.calendars = uiCalendarConfig.calendars;
    //Creates the eventsSources array that the calendar will display, initialize it with the values created earlier
    $scope.eventSources = [$scope.eventsPersonalSource, $scope.eventsAssociateSource, $scope.eventsPendingSource];


};

