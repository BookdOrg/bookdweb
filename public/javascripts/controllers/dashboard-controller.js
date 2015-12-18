module.exports = function ($scope, $state, auth, userFactory, businessFactory, uiCalendarConfig, $compile) {
    $scope.activeBusiness = {
        business: {}
    };
    if (userFactory.dashboard.length > -1) {
        $scope.businesses = userFactory.dashboard;
        $scope.activeBusiness.business = $scope.businesses[0];
    }
    $scope.pendingEvents = [];
    $scope.activeEvents = [];
    var createEventsSources = function (businessArray) {
        _.forEach(businessArray, function (appointments, key) {
            _.forEach(appointments, function (appointment, key) {
                for (var appointmentIndex = 0; appointmentIndex < appointment.length; appointmentIndex++) {
                    var tempObj = {
                        title: appointment[appointmentIndex].title,
                        start: appointment[appointmentIndex].start.full,
                        end: appointment[appointmentIndex].end.full,
                        appointment: appointment[appointmentIndex]
                    };
                    if (appointment[appointmentIndex].status !== 'pending') {
                        $scope.activeEvents.push(tempObj);
                    } else {
                        $scope.pendingEvents.push(tempObj);
                    }
                }
            });

        });
    };
    $scope.statusOne = {
        open: true
    };
    $scope.statusTwo = {
        open: true
    };
    $scope.statusThree = {
        open: true
    };
    $scope.statusCal = {
        open: true
    };
    $scope.calendarEmployees = [];
    $scope.customTexts = {
        buttonDefaultText: 'Select Calendars to View'
    };
    $scope.settings = {
        displayProp: 'name',
        idProp: '_id',
        externalIdProp: '_id',
        smartButtonMaxItems: 3,
        enableSearch: true,
        smartButtonTextConverter: function (itemText, originalItem) {
            return itemText;
        }
    };
    $scope.switchBusiness = function () {
        businessFactory.getAllAppointments($scope.activeBusiness.business._id)
            .then(function (response) {
                $scope.appointmentsMaster = response;
            });
    };
    $scope.dropdownEvents = {
        onItemSelect: function (item) {
            //userFactory.getUserAppts(item._id)
            //    .then(function (response) {
            //        console.log(response);
            //    });
            //make a call to get the users appointments based on item._id
        }
    };
    var date = new Date();
    var d = date.getDate();
    var m = date.getMonth();
    var y = date.getFullYear();

    $scope.eventsPersonalSource = {
        //color:'#00',
        //textColor:'blue',
        events: $scope.activeEvents
    };
    $scope.eventsAssociateSource = {
        color: '#f70',
        //textColor:'blue',
        events: $scope.pendingEvents
    };
    /* alert on eventClick */
    $scope.alertOnEventClick = function (date, jsEvent, view) {
        $scope.alertMessage = (date.title + ' was clicked ');
    };
    /* alert on Drop */
    $scope.alertOnDrop = function (event, delta, revertFunc, jsEvent, ui, view) {
        $scope.alertMessage = ('Event Droped to make dayDelta ' + delta);
    };
    /* alert on Resize */
    $scope.alertOnResize = function (event, delta, revertFunc, jsEvent, ui, view) {
        $scope.alertMessage = ('Event Resized to make dayDelta ' + delta);
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
        if (uiCalendarConfig.calendars[calendar]) {
            uiCalendarConfig.calendars[calendar].fullCalendar('render');
        }
    };
    /* Render Tooltip */
    $scope.eventRender = function (event, element, view) {
        element.attr({
            'tooltip': event.title,
            'tooltip-append-to-body': true
        });
        $compile(element)($scope);
    };
    $scope.viewRender = function (view, element) {
        var monthYear = uiCalendarConfig.calendars['myCalendar1'].fullCalendar('getDate');
        $scope.monthYear = moment(monthYear).format('MM/YYYY');
        $scope.masterList = {};
        businessFactory.getAllAppointments($scope.activeBusiness.business._id, $scope.monthYear)
            .then(function (response) {
                var masterEntry = createMasterEntry(response);
                $scope.masterList[$scope.activeBusiness.business.name] = {};
                $scope.masterList[$scope.activeBusiness.business.name] = masterEntry;
                createEventsSources($scope.masterList[$scope.activeBusiness.business.name]);
            });

    };

    var createMasterEntry = function (appointmentArray) {
        var responseArray = {};
        for (var appointmentArrayIndex = 0; appointmentArrayIndex < appointmentArray.length; appointmentArrayIndex++) {
            if (!responseArray[appointmentArray[appointmentArrayIndex].employee]) {
                responseArray[appointmentArray[appointmentArrayIndex].employee] = {};
                responseArray[appointmentArray[appointmentArrayIndex].employee].appointments = [];
                responseArray[appointmentArray[appointmentArrayIndex].employee].appointments.push(appointmentArray[appointmentArrayIndex]);
            } else {
                responseArray[appointmentArray[appointmentArrayIndex].employee].appointments.push(appointmentArray[appointmentArrayIndex]);
            }
        }
        return responseArray;
    };
    /* config object */
    $scope.uiConfig = {
        calendar: {
            height: 450,
            editable: true,
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
    /* event sources array*/
    $scope.eventSources = [$scope.pendingEvents, $scope.activeEvents];
};
