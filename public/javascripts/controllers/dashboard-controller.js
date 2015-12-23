module.exports = function ($scope, $state, auth, userFactory, businessFactory, uiCalendarConfig, $compile, $uibModal) {
    $scope.activeBusiness = {
        business: {}
    };
    $scope.animationsEnabled = true;
    if (userFactory.dashboard.length > -1) {
        $scope.businesses = userFactory.dashboard;
        $scope.activeBusiness.business = $scope.businesses[0];
    }
    $scope.pendingEvents = [];
    $scope.activeEvents = [];
    $scope.filteredList = [];
    $scope.filteredList[$scope.activeBusiness.business.name] = {};
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
    $scope.statusFour = {
        open: true
    };
    $scope.statusFive = {
        open: true
    };
    $scope.statusSix = {
        open: true
    };
    $scope.statusCal = {
        open: true
    };
    $scope.calendarEmployees = [];

    $scope.removeService = function(service,index){
        $scope.activeBusiness.business.services.splice(index,1);
        var serviceObj = {
            serviceId:service._id,
            businessId:$scope.activeBusiness.business._id
        };
        businessFactory.removeService(serviceObj)
            .then(function(response){
            });
    };

    $scope.removeEmployee = function (employee, business) {
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: '/partials/modals/removeEmployeeModal.html',
            controller: 'removeEmployeeModalCtrl',
            resolve: {
                employee: function () {
                    return employee;
                },
                businessInfo: function () {
                    return business;
                }
            }
        });

        modalInstance.result.then(function (businessId) {
            businessFactory.getBusinessInfo(businessId)
                .then(function (business) {
                    $scope.activeBusiness.business = business;
                });
        }, function () {
            //console.log('Modal dismissed at: ' + new Date());
        });
    };

    $scope.openEmployee = function (business) {
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: '/partials/modals/addEmployeeModal.html',
            controller: 'addEmployeeModalCtrl',
            resolve: {
                businessInfo: function () {
                    return business;
                }
            }
        });

        modalInstance.result.then(function (businessId) {
            businessFactory.getBusinessInfo(businessId)
                .then(function (business) {
                    $scope.activeBusiness.business = business;
                });
        }, function () {
            //console.log('Modal dismissed at: ' + new Date());
        });
    };

    $scope.open = function () {
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: '/partials/modals/addServiceModal.html',
            controller: 'addServiceModalCtrl',
            resolve: {
                business: function () {
                    return $scope.activeBusiness.business;
                }
            }
        });
        modalInstance.result.then(function (serviceResponse) {
            $scope.activeBusiness.business.services.push(serviceResponse);
        }, function () {

        });
    };
    $scope.editService = function (service, serviceIndex) {
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: '/partials/modals/editServiceModal.html',
            controller: 'editServiceModalCtrl',
            resolve: {
                serviceIndex: function () {
                    return serviceIndex;
                },
                service: function () {
                    return angular.copy(service);
                },
                business: function () {
                    return $scope.activeBusiness.business;
                }
            }
        });
    };

    $scope.customTexts = {
        buttonDefaultText: 'Select Calendars to View'
    };
    $scope.settings = {
        displayProp: 'name',
        idProp: '_id',
        externalIdProp: '_id',
        smartButtonMaxItems: 3,
        enableSearch: true,
        showCheckAll: false,
        showUncheckAll: false,
        smartButtonTextConverter: function (itemText, originalItem) {
            return itemText;
        }
    };
    $scope.switchBusiness = function (business) {
        $scope.activeBusiness.business = business;
        businessFactory.getAllAppointments($scope.activeBusiness.business._id)
            .then(function (response) {
                $scope.appointmentsMaster = response;
                $scope.filteredList[$scope.activeBusiness.business.name] = {};
                $scope.viewRender();
            });
    };
    $scope.dropdownEvents = {
        onItemSelect: function (item) {
            $scope.filteredList[$scope.activeBusiness.business.name][item._id] = $scope.masterList[$scope.activeBusiness.business.name][item._id];
            createEventsSources($scope.filteredList[$scope.activeBusiness.business.name]);
            uiCalendarConfig.calendars['myCalendar1'].fullCalendar('refetchEvents');
        },
        onItemDeselect: function (item) {
            $scope.filteredList[$scope.activeBusiness.business.name][item._id] = {};
            createEventsSources($scope.filteredList[$scope.activeBusiness.business.name]);
            uiCalendarConfig.calendars['myCalendar1'].fullCalendar('refetchEvents');
        },
        onSelectAll: function () {
            uiCalendarConfig.calendars['myCalendar1'].fullCalendar('removeEvents');
            $scope.masterList[$scope.activeBusiness.name] = {};
            createEventsSources($scope.masterList[$scope.activeBusiness.business.name]);
            uiCalendarConfig.calendars['myCalendar1'].fullCalendar('refetchEvents');
        },
        onUnselectAll: function () {
            //$scope.masterList[$scope.activeBusiness.name] = {};
            //createEventsSources($scope.masterList[$scope.activeBusiness.business.name]);
            uiCalendarConfig.calendars['myCalendar1'].fullCalendar('removeEvents');
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
        for (var employeeIndex = 0; employeeIndex < $scope.activeBusiness.business.employees.length; employeeIndex++) {
            if ($scope.activeBusiness.business.employees[employeeIndex]._id == event.appointment.employee) {
                var employeeName = $scope.activeBusiness.business.employees[employeeIndex].name;
            }
        }
        element.attr({
            'uib-tooltip': employeeName,
            'tooltip-append-to-body': true
        });
        $compile(element)($scope);
    };
    $scope.viewRender = function (view, element) {
        var monthYear = uiCalendarConfig.calendars['myCalendar1'].fullCalendar('getDate');
        $scope.monthYear = moment(monthYear).format('MM/YYYY');
        $scope.masterList = {};
        var previousMonthYear = localStorage['monthYear'];
        var previousBusiness = localStorage['previousBusiness'];
        if ($scope.monthYear !== previousMonthYear || !$scope.masterList[previousBusiness]) {
            uiCalendarConfig.calendars['myCalendar1'].fullCalendar('removeEvents');
            businessFactory.getAllAppointments($scope.activeBusiness.business._id, $scope.monthYear)
                .then(function (response) {
                    var masterEntry = createMasterEntry(response);
                    $scope.masterList[$scope.activeBusiness.business.name] = {};
                    $scope.masterList[$scope.activeBusiness.business.name] = masterEntry;
                    createEventsSources($scope.masterList[$scope.activeBusiness.business.name]);
                    localStorage['monthYear'] = $scope.monthYear;
                    localStorage['previousBusiness'] = $scope.activeBusiness.business.name;
                });
        }
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
