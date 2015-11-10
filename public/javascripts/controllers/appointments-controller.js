/**
 * Created by khalilbrown on 10/5/15.
 */
angular.module('cc.appointments-controller', [])
    .controller('appointmentsCtrl', [
        '$scope',
        '$state',
        'auth',
        'user',
        '$compile',
        'uiCalendarConfig',
        function ($scope, $state, auth, user,$compile,uiCalendarConfig) {
            $scope.appointments = user.appointments;

            var date = new Date();
            var d = date.getDate();
            var m = date.getMonth();
            var y = date.getFullYear();

            $scope.changeTo = 'Hungarian';
            /* event source that pulls from google.com */
            /* event source that contains custom events on the scope */

            $scope.events = [];
            for(var appointmentIndex =0; appointmentIndex<$scope.appointments.personalAppointments.length;appointmentIndex++){
                var tempObj = {
                    title:$scope.appointments.personalAppointments[appointmentIndex].title,
                    start:$scope.appointments.personalAppointments[appointmentIndex].start.full,
                    end:$scope.appointments.personalAppointments[appointmentIndex].end.full
                };
                $scope.events.push(tempObj);
            }
            for(var appointmentIndex =0; appointmentIndex<$scope.appointments.businessAppointments.length;appointmentIndex++){
                var tempObj = {
                    title:$scope.appointments.businessAppointments[appointmentIndex].title,
                    start:$scope.appointments.businessAppointments[appointmentIndex].start.full,
                    end:$scope.appointments.businessAppointments[appointmentIndex].end.full
                };
                $scope.events.push(tempObj);
            }
            $scope.eventsSource = {
                //color:'#f00',
                //textColor:'blue',
                events:$scope.events
            };
            /* event source that calls a function on every view switch */
            /* alert on eventClick */
            $scope.alertOnEventClick = function( date, jsEvent, view){
                console.log(date.title)
                $scope.alertMessage = (date.title + ' was clicked ');
            };
            /* alert on Drop */
            $scope.alertOnDrop = function(event, delta, revertFunc, jsEvent, ui, view){
                $scope.alertMessage = ('Event Dropped to make dayDelta ' + delta);
            };
            /* alert on Resize */
            $scope.alertOnResize = function(event, delta, revertFunc, jsEvent, ui, view ){
                $scope.alertMessage = ('Event Resized to make dayDelta ' + delta);
            };
            /* add and removes an event source of choice */
            $scope.addRemoveEventSource = function(sources,source) {
                var canAdd = 0;
                angular.forEach(sources,function(value, key){
                    if(sources[key] === source){
                        sources.splice(key,1);
                        canAdd = 1;
                    }
                });
                if(canAdd === 0){
                    sources.push(source);
                }
            };
            /* add custom event*/
            $scope.addEvent = function() {
                $scope.events.push({
                    title: 'Open Sesame',
                    start: new Date(y, m, 28),
                    end: new Date(y, m, 29),
                    className: ['openSesame']
                });
            };
            $scope.getDate = function(calendar){
              console.log(uiCalendarConfig.calendars[calendar].fullCalendar('getDate'));
                console.log(uiCalendarConfig.calendars[calendar].fullCalendar('getView'));
            };
            /* remove event */
            $scope.remove = function(index) {
                $scope.events.splice(index,1);
            };
            /* Change View */
            $scope.changeView = function(view,calendar) {
                $scope.getDate(calendar);
                uiCalendarConfig.calendars[calendar].fullCalendar('changeView',view);
            };
            /* Change View */
            $scope.renderCalender = function(calendar) {
                $timeout(function() {
                    if(uiCalendarConfig.calendars[calendar]){
                        uiCalendarConfig.calendars[calendar].fullCalendar('render');
                    }
                });
            };
            /* Render Tooltip */
            $scope.eventRender = function( event, element, view ) {
                element.attr({'tooltip': event.title,
                    'tooltip-append-to-body': true});
                $compile(element)($scope);
            };

            $scope.$watch('',function(newVal,oldVal){
               if(newVal){
                   console.log(newVal);
               }
            });
            /* config object */
            $scope.uiConfig = {
                calendar:{
                    height: 450,
                    editable: false,
                    header:{
                        left: 'title',
                        center: 'month,agendaWeek,agendaDay',
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
            $scope.eventSources = [$scope.events];
            $scope.eventSources2 = [$scope.eventsSource];
        }]);
