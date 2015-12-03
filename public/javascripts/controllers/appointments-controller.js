/**
 * Created by khalilbrown on 10/5/15.
 */
module.exports = function ($scope, $state, auth, userFactory, $compile, uiCalendarConfig, $uibModal, $timeout) {
    $scope.appointments = userFactory.appointments;
            $scope.animationsEnabled = true;
            var date = new Date();
            var d = date.getDate();
            var m = date.getMonth();
            var y = date.getFullYear();

            $scope.changeTo = 'Hungarian';
            /* event source that pulls from google.com */
            /* event source that contains custom events on the scope */

            $scope.personalEvents = [];
            $scope.associateEvents = [];
            $scope.pendingEvents = [];
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
            createEventsSources();
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

            $scope.open = function (size, data) {
                var modalInstance = $uibModal.open({
                    animation: $scope.animationsEnabled,
                    templateUrl: 'editAppointment.html',
                    controller: 'editAppointmentModalCtrl',
                    backdrop: 'static',
                    keyboard: false,
                    size: size,
                    resolve: {
                        data: function () {
                            return data;
                        }
                    }
                });
                //TODO FIGURE OUT HOW TO MAKE THE CALENDAR RELOAD WITHOUT RELOADING THE PAGE :( WON'T WORK NOW
                modalInstance.result.then(function () {
                    $state.reload();
                }, function () {

                });
            };
            /* event source that calls a function on every view switch */
            /* alert on eventClick */
            $scope.alertOnEventClick = function (date, jsEvent, view) {
                $scope.open('lg', date);
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
                    'tooltip': event.title,
                    'tooltip-append-to-body': true
                });
                $compile(element)($scope);
            };

            /* config object */
            $scope.uiConfig = {
                calendar: {
                    height: 500,
                    editable: true,
                    header: {
                        left: 'title',
                        center: '',
                        right: 'today prev,next'
                    },
                    eventClick: $scope.alertOnEventClick,
                    eventDrop: $scope.alertOnDrop,
                    eventResize: $scope.alertOnResize,
                    eventRender: $scope.eventRender
                }
            };

            $scope.calendars = uiCalendarConfig.calendars;

            //$scope.changeLang = function() {
            //    if($scope.changeTo === 'Hungarian'){
            //        $scope.uiConfig.calendar.dayNames = ["Vasárnap", "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat"];
            //        $scope.uiConfig.calendar.dayNamesShort = ["Vas", "Hét", "Kedd", "Sze", "Csüt", "Pén", "Szo"];
            //        $scope.changeTo= 'English';
            //    } else {
            //        $scope.uiConfig.calendar.dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            //        $scope.uiConfig.calendar.dayNamesShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            //        $scope.changeTo = 'Hungarian';
            //    }
            //};
            /* event sources array*/
            $scope.eventSources = [$scope.eventsPersonalSource, $scope.eventsAssociateSource, $scope.eventsPendingSource];

            $scope.addBreak = function (day) {
                var gap = {
                    start: moment().hour(12).minute(0).format(),
                    end: moment().hour(13).minute(0).format()
                };
                day.gaps.push(gap);
            };

            $scope.hstep = 1;
            $scope.mstep = 15;
            $scope.ismeridian = true;
            $scope.toggleMode = function () {
                $scope.ismeridian = !$scope.ismeridian;
            };

            $scope.showDone = false;
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

