module.exports = function ($scope, $state, auth, userFactory, businessFactory, uiCalendarConfig, $compile,
                           $uibModal, socketService, $rootScope, Notification, $interval, $timeout) {
    $scope.radioModel = 'Week';
    /**
     * The business currently selected by the Bookd Associate
     * @type {{business: {}}}
     */
    $scope.activeBusiness = {
        business: {}
    };

    $scope.animationsEnabled = true;
    $scope.calendarEmployees = [];
    /**
     * If the business owner has dashboards, store the data is businesses,
     * pre-select the first business in the array as the active business
     *
     */
    if (businessFactory.dashboard.length > -1) {
        $scope.businesses = businessFactory.dashboard;
        $scope.activeBusiness.business = $scope.businesses[0];
        if ($scope.activeBusiness.business.customers.length > 0) {
            $scope.customer = $scope.activeBusiness.business.customers[0];
            businessFactory.getCustomerAppointments($scope.customer._id, $scope.activeBusiness.business._id)
                .then(function (results) {
                    $scope.customer.appointments = results;
                });
        }
        socketService.emit('joinDashboardRoom', $scope.activeBusiness.business._id);
        businessFactory.getStripeAccount($scope.activeBusiness.business.stripeId)
            .then(function (data) {
                if (data.statusCode !== 401) {
                    $scope.activeBusiness.business.stripeAccount = data;
                } else {
                    $scope.activeBusiness.business.stripeError = data.message;
                }
            }, function (error) {
                console.log(error);
            });
    }

    /**
     *
     * The arrays of events that will be passed to the eventsSources for the calender
     *
     * @type {Array}
     */
    $scope.events = [];

    /**
     * The filtered list is the list of employees who's calendars we want to view,
     * stored based on which business they are associated with.
     *
     * @type {Array}
     */
    $scope.filteredList = [];
    $scope.filteredList[$scope.activeBusiness.business.name] = {};

    /**
     *
     *
     * @type {{}}
     */
    $scope.masterList = {};
    /**
     *
     * Defines the eventsSources for the calendar.
     *
     * @type {{events: Array}}
     */

    /**
     *
     *  These are toggles for each accordion group
     *
     *
     * @type {{open: boolean}}
     */
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
    $scope.updatedBankAccount = {};
    $scope.updatedStripeAccount = {};
    $scope.createPaymentsAccount = function (bankAccount, stripeAccount) {
        $scope.updatingPayments = true;
        stripeAccount.type = bankAccount.type;
        var updateObj = {
            businessId: $scope.activeBusiness.business._id,
            bankAccount: bankAccount,
            stripeAccount: stripeAccount
        };
        $scope.stripeError = null;
        businessFactory.createPaymentsAccount(updateObj)
            .then(function (data) {
                $scope.updatingPayments = false;
                if (data.statusCode === 400) {
                    $scope.activeBusiness.business.stripeError = data.message;
                } else {
                    $scope.activeBusiness.business.stripeAccount = data;
                    $scope.stripeUpdateSuccess = true;
                }
            });
    };
    $scope.activeTab = 'calendar';
    $scope.switchTab = function (tab) {
        $scope.activeTab = tab;
    };
    /**
     *
     * Removes a service from the business
     *
     * @param service - the service object
     * @param index - the index of the service object in the active business
     *
     * business - resolves the active business, send it into the modal
     */
    $scope.openRemoveServiceModal = function (service, index) {
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: '/partials/modals/removeServiceModal.html',
            controller: 'removeServiceModalCtrl',
            resolve: {
                serviceIndex: function () {
                    return index;
                },
                service: function () {
                    return service;
                },
                business: function () {
                    return $scope.activeBusiness.business;
                }
            }
        });

        modalInstance.result.then(function () {
            //when the modal returns the successful promise, we remove the service from the active business
            $scope.activeBusiness.business.services.splice(index, 1);
        }, function () {

        });
    };

    /**
     *
     * Opens the remove employee modal
     *
     *
     * @param employee - employee object
     * @param business - the active business to remove the employee from
     */
    $scope.removeEmployee = function (employee, business) {
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: '/partials/modals/removeEmployeeModal.html',
            controller: 'removeEmployeeModalCtrl',
            resolve: {
                employee: function () {
                    return employee;
                },
                businessObj: function () {
                    return business;
                }
            }
        });

        /**
         *
         * After the modal closes get the updated Business from the back-end
         * then update the active business to the business returned
         */
        modalInstance.result.then(function (businessId) {
            var stripeAccount = $scope.activeBusiness.business.stripeAccount;
            businessFactory.getBusinessInfo(businessId)
                .then(function (business) {
                    $scope.activeBusiness.business = business;
                    $scope.activeBusiness.business.stripeAccount = stripeAccount;
                });
        });
    };
    /**
     *
     * Opens a modal to add an employee to a business
     *
     *
     * @param business - the business object
     */
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
        /**
         *
         * After the modal closes get the updated Business from the back-end,
         * then update the active business to the business returned
         *
         */
        modalInstance.result.then(function (businessId) {
            var stripeAccount = $scope.activeBusiness.business.stripeAccount;
            businessFactory.getBusinessInfo(businessId)
                .then(function (business) {
                    $scope.activeBusiness.business = business;
                    $scope.activeBusiness.business.stripeAccount = stripeAccount;
                });
        }, function () {
            //console.log('Modal dismissed at: ' + new Date());
        });
    };
    /**
     *
     * Opens a modal to create a new service.
     *
     *
     */
    $scope.newService = function () {
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
        /**
         *
         * Once the modal is closed we push the new service into the array of
         * services the active business has
         *
         */
        modalInstance.result.then(function (serviceResponse) {
            $scope.activeBusiness.business.services.push(serviceResponse);
        }, function () {

        });
    };
    /**
     * Open a modal to edit a service
     *
     * @param service - Service Object
     * @param serviceIndex - The index of the service to be removed in the business object
     *
     * We resolve the current business to be used in the modal
     */
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
                    return employee;
                },
                business: function () {
                    return $scope.activeBusiness.business
                }
            }
        });

    };
    /**
     *
     * @param customer
     */
    $scope.setCustomer = function (customer) {
        $scope.customer = angular.copy(customer);
        businessFactory.getCustomerAppointments(customer._id, $scope.activeBusiness.business._id)
            .then(function (results) {
                $scope.customer.appointments = results;
            });

    };
    /**
     * The default text that the select employee multi-select dropdown should show
     *
     * @type {{buttonDefaultText: string}}
     */
    $scope.customTexts = {
        buttonDefaultText: 'Filter by Employees'
    };

    /**
     *
     * Settings for the dropdown multiselect
     *
     * @type {{displayProp: string, idProp: string, externalIdProp: string, smartButtonMaxItems: number, enableSearch: boolean, showCheckAll: boolean, showUncheckAll: boolean, smartButtonTextConverter: Function}}
     */
    $scope.settings = {
        displayProp: 'name',
        idProp: '_id',
        externalIdProp: '_id',
        smartButtonMaxItems: 3,
        enableSearch: true,
        showCheckAll: false,
        showUncheckAll: false,
        smartButtonTextConverter: function (itemText, originalItem) {
            return originalItem.firstName;
        }
    };

    /**
     *
     * Function fired when the Associate changes the active business,
     * switch the activeBusiness and then make a request for that businesses
     * appointments
     *
     * @param business
     */
    $scope.switchBusiness = function (business) {
        if (business._id !== $scope.activeBusiness._id) {
            socketService.emit('leaveDashboardRoom', $scope.activeBusiness.business._id);
            $scope.activeBusiness.business = business;
            socketService.emit('joinDashboardRoom', $scope.activeBusiness.business._id);
            $scope.filteredList[$scope.activeBusiness.business.name] = {};
            $scope.events = [];
            $scope.calendarEmployees = [];
            uiCalendarConfig.calendars['myCalendar1'].fullCalendar('removeEvents');
            uiCalendarConfig.calendars['myCalendar1'].fullCalendar('refetchEvents');
            businessFactory.getStripeAccount(business.stripeId)
                .then(function (data) {
                    if (data.statusCode !== 401) {
                        $scope.activeBusiness.business.stripeAccount = data;
                    } else {
                        $scope.activeBusiness.business.stripeError = data.message;
                    }
                });
        }

    };
    var createFilteredSource = function (filteredList, select) {
        _.forEach(filteredList, function (value, key) {
            if (value.length > 0 && select) {
                uiCalendarConfig.calendars['myCalendar1'].fullCalendar('addEventSource', filteredList[key]);
            }
            //if(value.length > 0 && !select){
            //    uiCalendarConfig.calendars['myCalendar1'].fullCalendar('removeEventSource',filteredList[key]);
            //}
        });
    };
    var removeFilteredSources = function (filteredList) {
        _.forEach(filteredList, function (value, key) {
            uiCalendarConfig.calendars['myCalendar1'].fullCalendar('removeEventSource', filteredList[key]);
        });
    };
    /**
     *
     * Define which actions to take when employees are selected on the multi-select dropdown.
     *
     * @type {{onItemSelect: Function, onItemDeselect: Function, onSelectAll: Function, onUnselectAll: Function}}
     */
    $scope.dropdownEvents = {
        onItemSelect: function (item) {
            var employeeEvents = [];
            for (var eventIndex = 0; eventIndex < $scope.events.length; eventIndex++) {
                if ($scope.events[eventIndex].appointment.employee._id === item._id) {
                    employeeEvents.push($scope.events[eventIndex]);
                }
            }
            uiCalendarConfig.calendars['myCalendar1'].fullCalendar('removeEvents');
            if (!$scope.filteredList[$scope.activeBusiness.business.name][item._id]) {
                $scope.filteredList[$scope.activeBusiness.business.name][item._id] = employeeEvents;
                createFilteredSource($scope.filteredList[$scope.activeBusiness.business.name], true);
            } else {
                $scope.filteredList[$scope.activeBusiness.business.name][item._id] = employeeEvents;
                createFilteredSource($scope.filteredList[$scope.activeBusiness.business.name], true);
            }
        },
        onItemDeselect: function (item) {
            uiCalendarConfig.calendars['myCalendar1'].fullCalendar('removeEventSource', $scope.filteredList[$scope.activeBusiness.business.name][item._id]);
            $scope.filteredList[$scope.activeBusiness.business.name][item._id] = {};
        },
        onSelectAll: function () {
        },
        onUnselectAll: function () {
            //createFilteredSource($scope.filteredList[$scope.activeBusiness.business.name],false);
            //uiCalendarConfig.calendars['myCalendar1'].fullCalendar('removeEvents');
        }
    };
    var date = new Date();
    var d = date.getDate();
    var m = date.getMonth();
    var y = date.getFullYear();

    /**
     *
     * Events for the calendar
     *
     */
    $scope.alertOnEventHover = function (event, jsEvent, view) {
        $scope.activeEvent = event;
    };
    /* alert on eventClick */
    $scope.alertOnEventClick = function (date, jsEvent, view) {
        var personal = false;
        if (date.appointment.customer !== null) {
            personal = true;
        }
        $scope.open('lg', date, personal);
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

    /* remove event */
    $scope.remove = function (index) {
        $scope.events.splice(index, 1);
    };
    /* Change View */
    $scope.changeView = function (view, calendar) {
        uiCalendarConfig.calendars[calendar].fullCalendar('changeView', view);
    };
    /* Change View */
    var render = true;
    $scope.renderCalender = function (calendar) {
        if (render) {
            $scope.loadingCal = true;
            $timeout(function () {
                $scope.loadingCal = false;
                uiCalendarConfig.calendars['myCalendar1'].fullCalendar('render');
                if ($scope.activeTab === 'calendar') {
                    uiCalendarConfig.calendars['myCalendar1'].fullCalendar('refetchEvents');
                }
            }, 0);
        }
    };
    /* Render Tooltip */
    $scope.eventRender = function (event, element, view) {
        element.attr({
            'uib-popover-template': "'mydashPopoverTemplate.html'",
            'popover-append-to-body': 'true',
            'popover-placement': "left",
            'popover-trigger': 'mouseenter',
            'popover-title': 'Service - ' + event.title
        });
        $compile(element)($scope);
    };

    /**
     *
     *  Creates the events array that will be used to display events on the calendar
     *
     * @param businessArray - The array of businesses an employee owns,
     */
    var createEventsSources = function (businessArray) {
        var events = [];
        _.forEach(businessArray, function (employeesArray, key) {
            _.forEach(employeesArray, function (appointmentsArray, key) {
                for (var appointmentIndex = 0; appointmentIndex < appointmentsArray.length; appointmentIndex++) {
                    var tempObj = {
                        _id: appointmentsArray[appointmentIndex]._id,
                        title: appointmentsArray[appointmentIndex].title,
                        start: appointmentsArray[appointmentIndex].start.full,
                        end: appointmentsArray[appointmentIndex].end.full,
                        appointment: appointmentsArray[appointmentIndex]
                    };
                    if (appointmentsArray[appointmentIndex].status === 'pending') {
                        tempObj.backgroundColor = '#f00';
                        tempObj.borderColor = '#f00';
                        events.push(tempObj);

                    } else if (appointmentsArray[appointmentIndex].status === 'paid') {
                        tempObj.backgroundColor = '#2a4';
                        tempObj.borderColor = '#2a4';
                        events.push(tempObj);
                    } else {
                        events.push(tempObj);
                    }
                }
            });

        });
        return events;
    };
    /**
     * All appointments for the business, this function sorts them by employee
     *
     * If there are no appointments we create the empty employee arrays and appointments so
     * the business can receive new appointments from sockets
     *
     * @param appointmentArray - All appointments for the business
     * @returns {{}}
     */
    var createMasterEntry = function (appointmentArray) {
        var responseArray = {};
        if(appointmentArray.length > 0){
            for (var appointmentArrayIndex = 0; appointmentArrayIndex < appointmentArray.length; appointmentArrayIndex++) {
                if (!responseArray[appointmentArray[appointmentArrayIndex].employee._id]) {
                    responseArray[appointmentArray[appointmentArrayIndex].employee._id] = {};
                    responseArray[appointmentArray[appointmentArrayIndex].employee._id].appointments = [];
                    responseArray[appointmentArray[appointmentArrayIndex].employee._id].appointments.push(appointmentArray[appointmentArrayIndex]);
                } else {
                    responseArray[appointmentArray[appointmentArrayIndex].employee._id].appointments.push(appointmentArray[appointmentArrayIndex]);
                }
            }
        }else{
            for(var employeeIndex = 0; employeeIndex<$scope.activeBusiness.business.employees.length;employeeIndex++){
                responseArray[$scope.activeBusiness.business.employees[employeeIndex]._id] = {};
                responseArray[$scope.activeBusiness.business.employees[employeeIndex]._id].appointments = [];
            }
        }

        return responseArray;
    };

    $scope.getEvents = function (start, end, timezone, callback) {
        var calStart = moment(start).format('YYYY-MM-DD');
        var calEnd = moment(end).format('YYYY-MM-DD');
        businessFactory.getAllAppointments($scope.activeBusiness.business._id, calStart, calEnd)
            .then(function (response) {
                removeFilteredSources($scope.filteredList[$scope.activeBusiness.business.name]);
                $scope.calendarEmployees = [];
                $scope.filteredList[$scope.activeBusiness.business.name] = {};
                //take the array of appointments returned and add them to our master entry of appointments for each employee
                var masterEntry = createMasterEntry(response);
                $scope.masterList[$scope.activeBusiness.business.name] = {};
                $scope.masterList[$scope.activeBusiness.business.name] = masterEntry;
                //create events arrays with the appointments for the business in our masterList of businesses
                $scope.events = [];
                var events = createEventsSources($scope.masterList[$scope.activeBusiness.business.name]);
                //$scope.eventSources.push($scope.events);
                $scope.lastUpdatedView = moment().calendar();
                $scope.lastUpdated = moment();
                //add our monthYear and business to localStorage
                localStorage['previousBusiness'] = $scope.activeBusiness.business.name;
                $scope.events = events;
                callback(events);
            });
    };
    /* config object for UI Calendar*/
    $scope.uiConfig = {
        calendar: {
            height: 700,
            editable: false,
            displayEventEnd: true,
            eventLimit: true,
            defaultView: 'agendaWeek',
            header: {
                left: 'title',
                center: '',
                right: 'today prev,next'
            },
            views: {
                month: {
                    eventLimit: 10
                },
                week: {
                    eventLimit: 15
                }
            },
            //events: $scope.getEvents,
            eventClick: $scope.alertOnEventClick,
            eventDrop: $scope.alertOnDrop,
            eventResize: $scope.alertOnResize,
            eventRender: $scope.eventRender,
            eventMouseover: $scope.alertOnEventHover,
            addEvent: $scope.addEvent
        }
    };
    /* event sources array for ui-calendar*/
    $scope.eventSources = [$scope.getEvents];

    /**
     * Opens the edit Appointment modal, for editing appointments
     *
     * @param size - String - size of the modal to open
     * @param data - Object - the appointment to be edited
     * @param type - Boolean - is the appointment being edited by the user who's appointment it is or an employee/business owner
     */
    $scope.open = function (size, data, type) {
        data.business = $scope.activeBusiness.business;
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
                personal: function () {
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
                if (date.appointment.status == 'paid') {
                    date.backgroundColor = '#2a4';
                    date.borderColor = '#2a4';
                }
                if (date.appointment.status == 'pending') {
                    date.backgroundColor = '#f00';
                    date.borderColor = '#f00';
                }
                date.start = moment(date.appointment.start.full);
                date.end = moment(date.appointment.end.full);
                uiCalendarConfig.calendars['myCalendar1'].fullCalendar('updateEvent', date);
            } else if (date && date.appointment === 'canceled') {
                uiCalendarConfig.calendars['myCalendar1'].fullCalendar('removeEvents', [date._id]);
            }
        }, function (error) {
            console.log(error);
        });
    };
    /* add custom event*/
    $scope.addEvent = function (appointment) {
        var event = {
            _id:appointment._id,
            title: appointment.title,
            start: appointment.start.full,
            end: appointment.end.full,
            appointment: appointment
        };
        uiCalendarConfig.calendars['myCalendar1'].fullCalendar('renderEvent', event);
        $scope.events.push(event);

    };
    /**
     * Block for manually scheduling appointments
     *
     * @param size - size of the modal
     * @param type - type of appointment, personal or not
     * @param service - the service the appointment is for
     */
    $scope.openService = function (size, type, service) {
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: '/partials/modals/dashboard-scheduleAppt.html',
            controller: 'scheduleAppointmentModalCtrl as ctrl',
            backdrop: 'static',
            keyboard: false,
            size: size,
            resolve: {
                personal: function () {
                    return type;
                },
                payments: function () {
                    return $scope.activeBusiness.business.payments;
                },
                service: function () {
                    return service;
                },
                customers: function () {
                    return $scope.activeBusiness.business.customers;
                }
            }
        });
        /**
         *
         * Once the appointment has been scheduled and the modal closed we want to
         * update the calendar.
         *
         */
        modalInstance.result.then(function (appointment) {
            var event = {
                _id: appointment._id,
                title: appointment.title,
                start: appointment.start.full,
                end: appointment.end.full,
                appointment: appointment
            };
            if (event) {
                $scope.events.push(event);
                if (angular.isDefined($scope.masterList[$scope.activeBusiness.business.name][event.appointment.employee])) {
                    $scope.masterList[$scope.activeBusiness.business.name][event.appointment.employee].appointments.push(event.appointment);
                } else {
                    $scope.masterList[$scope.activeBusiness.business.name][event.appointment.employee] = {};
                    $scope.masterList[$scope.activeBusiness.business.name][event.appointment.employee].appointments = [];
                    $scope.masterList[$scope.activeBusiness.business.name][event.appointment.employee].appointments.push(event.appointment);
                }
                //uiCalendarConfig.calendars['myCalendar1'].fullCalendar('renderEvent', event);
            }
            businessFactory.getBusinessCustomers($scope.activeBusiness.business._id)
                .then(function (customers) {
                    $scope.activeBusiness.business.customers = customers;
                });

        }, function () {

        });
    };
    /**
     *
     * Socket returns any updates made to appointments by employee's or customers,
     * we look for the appointment's event object on the calendar and then update the event
     *
     * Currently update results in an error being thrown, can't read undefined property of clone()
     * we'll need to resolve this eventually
     *
     */
    socketService.on('updatedAppt', function (data) {
        if (data.from !== $rootScope.currentUser._id) {
            var eventIndex = _.findIndex($scope.events, function (event) {
                return event._id === data.appointment._id;
            });
            if (eventIndex !== -1) {
                if ($scope.events[eventIndex]._id === data.appointment._id && data.appointment.status !== 'pending') {
                    var event = uiCalendarConfig.calendars['myCalendar1'].fullCalendar('clientEvents', [$scope.events[eventIndex]._id]);
                    if (event.length > 0) {
                        $scope.lastUpdatedView = moment().calendar();
                        $scope.lastUpdated = moment();
                        event[0].start = moment(data.appointment.start.full);
                        event[0].end = moment(data.appointment.end.full);
                        event[0].appointment = data.appointment;
                        event[0].backgroundColor = null;
                        event[0].borderColor = null;
                        $scope.events[eventIndex].start = data.appointment.start.full;
                        $scope.events[eventIndex].end = data.appointment.end.full;
                        $scope.events[eventIndex].appointment = data.appointment;
                        $scope.events[eventIndex].backgroundColor = null;
                        $scope.events[eventIndex].borderColor = null;
                        $scope.masterList[$scope.activeBusiness.business.name][data.appointment.employee._id].appointments[eventIndex] = data.appointment;
                        if (data.from !== $rootScope.currentUser._id && data.appointment.customer._id !== null) {
                            uiCalendarConfig.calendars['myCalendar1'].fullCalendar('updateEvent', event[0]);
                            Notification.info({message: 'A customer has re-scheduled an appointment!'});
                        } else if (data.from !== $rootScope.currentUser._id && data.appointment.customer._id === null) {
                            uiCalendarConfig.calendars['myCalendar1'].fullCalendar('updateEvent', event[0]);
                            Notification.info({message: 'An employee has re-scheduled an appointment!'});
                        } else {
                            Notification.info({message: 'You have re-scheduled an appointment!'});
                        }
                    } else {
                        var newEvent = {
                            title: data.appointment.title,
                            start: data.appointment.start.full,
                            end: data.appointment.end.full,
                            appointment: data.appointment
                        };
                        $scope.events[eventIndex].start = data.appointment.start.full;
                        $scope.events[eventIndex].end = data.appointment.end.full;
                        $scope.events[eventIndex].appointment = data.appointment;
                        $scope.events[eventIndex].backgroundColor = null;
                        $scope.events[eventIndex].borderColor = null;
                        $scope.masterList[$scope.activeBusiness.business.name][data.appointment.employee._id].appointments[eventIndex] = data.appointment;
                        uiCalendarConfig.calendars['myCalendar1'].fullCalendar('renderEvent', newEvent);
                        Notification.info({message: 'A customer has accepted a re-scheduled appointment'});
                    }
                } else if (data.appointment.status === 'pending') {
                    Notification.info({
                        message: 'An employee has re-scheduled an appointment, ' +
                        'it is pending and will be updated when the customer accepts.'
                    });
                    var pendingEvent = uiCalendarConfig.calendars['myCalendar1'].fullCalendar('clientEvents', [data.appointment._id]);
                    $scope.events[eventIndex].start = data.appointment.start.full;
                    $scope.events[eventIndex].end = data.appointment.end.full;
                    $scope.events[eventIndex].appointment = data.appointment;
                    $scope.events[eventIndex].backgroundColor = '#f00';
                    $scope.events[eventIndex].borderColor = '#f00';
                    pendingEvent[0].start = data.appointment.start.full;
                    pendingEvent[0].end = data.appointment.end.full;
                    pendingEvent[0].appointment = data.appointment;
                    pendingEvent[0].backgroundColor = '#f00';
                    pendingEvent[0].borderColor = '#f00';
                    $scope.masterList[$scope.activeBusiness.business.name][data.appointment.employee._id].appointments[eventIndex] = data.appointment;
                    uiCalendarConfig.calendars['myCalendar1'].fullCalendar('updateEvent', pendingEvent[0]);
                }
            } else {
                Notification.info({message: 'A customer has accepted a re-scheduled appointment!'});
                $scope.addEvent(data.appointment);
            }
        }
    });
    /**
     *
     * Socket return a new appointment to add to the business calendar
     *
     */
    socketService.on('newAppt', function (appointment) {
            $scope.addEvent(appointment);
            Notification.success({message: 'New appointment booked!'});
            if ($scope.masterList[$scope.activeBusiness.business.name][appointment.employee._id]) {
                $scope.masterList[$scope.activeBusiness.business.name][appointment.employee._id].appointments.push(appointment);
            } else {
                $scope.masterList[$scope.activeBusiness.business.name][appointment.employee._id] = {};
                $scope.masterList[$scope.activeBusiness.business.name][appointment.employee._id].appointments = [];
                $scope.masterList[$scope.activeBusiness.business.name][appointment.employee._id].appointments.push(appointment);
            }

            $scope.lastUpdatedView = moment().calendar();
            $scope.lastUpdated = moment();
    });
    /**
     *
     * When an appointment get's canceled we look for it in the event array, if it exists we remove it from
     * the calendar, notify the user.
     *
     */
    socketService.on('canceledAppt', function (data) {
        if (data.from !== $rootScope.currentUser._id) {
            var eventId;
            var employeeAppointments = $scope.masterList[$scope.activeBusiness.business.name][data.appointment.employee._id].appointments;
          employeeAppointments = _.without(employeeAppointments, _.find(employeeAppointments, {'_id': data.appointment._id}));
            $scope.masterList[$scope.activeBusiness.business.name][data.appointment.employee._id].appointments = employeeAppointments;
            for (var eventIndex = 0; eventIndex < $scope.events.length; eventIndex++) {
                if ($scope.events[eventIndex].appointment._id === data.appointment._id) {
                    eventId = $scope.events[eventIndex]._id;
                    Notification.warning({message: 'An appointment has been canceled'});
                    uiCalendarConfig.calendars['myCalendar1'].fullCalendar('removeEvents', [eventId]);
                }
            }
            $scope.lastUpdatedView = moment().calendar();
            $scope.lastUpdated = moment();
        }
    });

    $scope.$on('$destroy', function () {
        socketService.emit('leaveDashboardRoom', $scope.activeBusiness.business._id);
        socketService.removeListener('newAppt');
        socketService.removeListener('canceledAppt');
        socketService.removeListener('updatedAppt');
    });
};
