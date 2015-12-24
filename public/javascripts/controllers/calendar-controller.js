/**
 * Created by khalilbrown on 10/5/15.
 */
module.exports = function ($scope, $state, auth, userFactory, $compile, uiCalendarConfig, $uibModal, $timeout) {
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
    var createEventsSources = function () {
        for (var appointmentIndex = 0; appointmentIndex < $scope.appointments.personalAppointments.length; appointmentIndex++) {
            var tempObj = {
                title: $scope.appointments.personalAppointments[appointmentIndex].title,
                start: $scope.appointments.personalAppointments[appointmentIndex].start.full,
                end: $scope.appointments.personalAppointments[appointmentIndex].end.full,
                appointment: $scope.appointments.personalAppointments[appointmentIndex]
            };
            if ($scope.appointments.personalAppointments[appointmentIndex].status !== 'pending') {
                $scope.personalEvents.push(tempObj);
            } else {
                $scope.pendingEvents.push(tempObj);
            }
        }
        for (var appointmentIndex = 0; appointmentIndex < $scope.appointments.businessAppointments.length; appointmentIndex++) {
            var tempObj = {
                title: $scope.appointments.businessAppointments[appointmentIndex].title,
                start: $scope.appointments.businessAppointments[appointmentIndex].start.full,
                end: $scope.appointments.businessAppointments[appointmentIndex].end.full,
                appointment: $scope.appointments.businessAppointments[appointmentIndex]
            };
            if ($scope.appointments.businessAppointments[appointmentIndex].status !== 'pending') {
                $scope.associateEvents.push(tempObj);
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
        modalInstance.result.then(function () {
            uiCalendarConfig.calendars['myCalendar1'].fullCalendar('removeEvents');
            $scope.viewRender();
        }, function () {

        });
    };
    /* event source that calls a function on every view switch */
    /* alert on eventClick */
    $scope.alertOnEventClick = function (date, jsEvent, view) {
        $scope.open('lg', date,true);
        $scope.alertMessage = (date.title + ' was clicked ');
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
    $scope.viewRender = function(view,element){
        userFactory.getUserAppts()
            .then(function(data){
                $scope.appointments = data;
                createEventsSources();
            });

    };
    /* Calendar config object */
    $scope.uiConfig = {
        calendar: {
            height: 500,
            editable: true,
            displayEventEnd:true,
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
    /**
     * Allows employee to add a break on a given day
     *
     * @param day - the day of the week that the day should be created on
     */
    $scope.addBreak = function (day) {
        var gap = {
            start: moment().hour(12).minute(0).format(),
            end: moment().hour(13).minute(0).format()
        };
        day.gaps.push(gap);
    };
    /**
     *
     * Configuration for the time picker object in the employee schedule section.
     *
     * @type {number}
     */
    $scope.hstep = 1;
    $scope.mstep = 15;
    $scope.ismeridian = true;
    $scope.toggleMode = function () {
        $scope.ismeridian = !$scope.ismeridian;
    };
    /**
     * Flag for the update availability spinner
     * @type {boolean}
     */
    $scope.showDone = false;

    /**
     * Send the availability object to the backend so the users available times can be updated.
     *
     * @param availability - Object containing the hours for a given employee for each day of the week and for breaks
     */
    $scope.updateAvailability = function (availability) {
        $scope.showLoading = true;
        userFactory.updateAvailability(availability)
            .then(function (data) {
                auth.saveToken(data.token);
                $scope.showLoading = false;
                $scope.showDone = true;
            });
    };

};

