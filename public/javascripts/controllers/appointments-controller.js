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
        '$modal',
        '$timeout',
        '$state',
        function ($scope, $state, auth, user,$compile,uiCalendarConfig,$modal,$timeout,$state) {
            $scope.appointments = user.appointments;
            $scope.animationsEnabled = true;
            var date = new Date();
            var d = date.getDate();
            var m = date.getMonth();
            var y = date.getFullYear();

            $scope.changeTo = 'Hungarian';
            /* event source that pulls from google.com */
            /* event source that contains custom events on the scope */


            var createEventsSources = function(){
                $scope.personalEvents = [];
                $scope.associateEvents = [];
                for(var appointmentIndex =0; appointmentIndex<$scope.appointments.personalAppointments.length;appointmentIndex++){
                    var tempObj = {
                        title:$scope.appointments.personalAppointments[appointmentIndex].title,
                        start:$scope.appointments.personalAppointments[appointmentIndex].start.full,
                        end:$scope.appointments.personalAppointments[appointmentIndex].end.full,
                        appointment:$scope.appointments.personalAppointments[appointmentIndex]
                    };
                    $scope.personalEvents.push(tempObj);
                }
                for(var appointmentIndex =0; appointmentIndex<$scope.appointments.businessAppointments.length;appointmentIndex++){
                    var tempObj = {
                        title:$scope.appointments.businessAppointments[appointmentIndex].title,
                        start:$scope.appointments.businessAppointments[appointmentIndex].start.full,
                        end:$scope.appointments.businessAppointments[appointmentIndex].end.full,
                        appointment:$scope.appointments.personalAppointments[appointmentIndex]
                    };
                    $scope.associateEvents.push(tempObj);
                }
            };
            createEventsSources();
            $scope.eventsPersonalSource = {
                //color:'#f00',
                //textColor:'blue',
                events:$scope.personalEvents
            };
            $scope.eventsAssociateSource = {
                color:'#f00',
                //textColor:'blue',
                events:$scope.associateEvents
            };

            $scope.open = function (size,data) {
                var modalInstance = $modal.open({
                    animation: $scope.animationsEnabled,
                    templateUrl: 'editAppointment.html',
                    controller: 'editAppointmentModalCtrl',
                    size: size,
                    resolve: {
                        data: function () {
                            return data;
                        }
                    }
                });
                //TODO FIGURE OUT HOW TO MAKE THE CALENDAR RELOAD WITHOUT RELOADING THE PAGE :( WON'T WORK NOW
                modalInstance.result.then(function(){
                    user.getUserAppts()
                        .then(function(data){
                            $state.reload();
                        });
                },function(){

                });
            };
            /* event source that calls a function on every view switch */
            /* alert on eventClick */
            $scope.alertOnEventClick = function( date, jsEvent, view){
                $scope.open('lg',date);
                $scope.alertMessage = (date.title + ' was clicked ');
            };
            /* alert on Drop */
            $scope.alertOnDrop = function(event, delta, revertFunc, jsEvent, ui, view){
                $scope.alertMessage = ('Event Dropped to make dayDelta ' + delta);
                console.log(delta);
                console.log(event);
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
            /* remove event */
            $scope.remove = function(index) {
                $scope.events.splice(index,1);
            };
            /* Change View */
            $scope.changeView = function(view,calendar) {
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

            /* config object */
            $scope.uiConfig = {
                calendar:{
                    height: 450,
                    editable: false,
                    header:{
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
            $scope.eventSources = [$scope.eventsPersonalSource,$scope.eventsAssociateSource];
        }])
    .controller('editAppointmentModalCtrl', function ($scope, $modalInstance,data,businessFactory,user,socket,$rootScope) {
        $scope.dateObj = data;
        //TODO make a request for the service details based on the service ID in Data
        businessFactory.serviceDetails($scope.dateObj.appointment.service)
            .then(function(data){
                $scope.service = businessFactory.service;
                $scope.stripePrice = $scope.service.price * 100;
            });
        $scope.selectedDate = data.appointment.start.date;


        $scope.minDate = $scope.minDate ? null : moment();

        $scope.showCount = false;
        var timeStarted = false;

        // $scope.currentUser = auth.currentUser();
        $scope.$watch('selectedDate', function (newVal, oldVal) {
            if (newVal) {
                getAvailableTimes(newVal, data.appointment.employee);
            }
        });

        $scope.timerFinished = function(){
            $scope.activeTime.toggled = !$scope.activeTime.toggled;
            $scope.showCount = false;
            $scope.$apply();
            socket.emit('timeDestroyed',$scope.activeTime);
            console.log($scope.activeTime);
        };
        ///**
        // *
        // * @param employee
        // */
        //$scope.selectEmployee = function (employee) {
        //    $scope.availableTimes = [];
        //    $scope.employee = employee;
        //    //TODO This is deprecated according to https://github.com/moment/moment/issues/1407
        //    var day = moment().format('MM/DD/YYYY');
        //    getAvailableTimes(day,$scope.employee._id);
        //};
        /**
         *
         * @param date
         * @param employeeId
         */
        function getAvailableTimes(date, employeeId) {
            var newDate = moment(date).format('MM/DD/YYYY');
            var employeeApptObj = {
                startDate: newDate,
                id: employeeId
            };
            user.getAppts(employeeApptObj)
                .then(function(data){
                    calculateAppointments(data);
                    socket.emit('joinApptRoom', employeeApptObj);
                });
        }

        /**
         *
         * @param data
         */
        function calculateAppointments(data) {
            var duration = $scope.service.duration;
            var startTime = moment('6:00 am', 'hh:mm a');
            $scope.availableTimes = [];
            var endTime = moment('7:00 pm', 'hh:mm a');
            for (var m = startTime; startTime.isBefore(endTime); m.add(duration, 'minutes')) {
                var timeObj = {
                    time: m.format('hh:mm a'),
                    end: moment(startTime).add(duration,'minutes').format('hh:mm a'),
                    available: true,
                    toggled: false,
                    status: false,
                    user:$scope.currentUser._id
                };
                $scope.availableTimes.push(timeObj);
            }
            data.forEach(function (array) {
                for (var availableTimesIndex = 0; availableTimesIndex < $scope.availableTimes.length; availableTimesIndex++) {
                    for (var appointmentsIndex = 0; appointmentsIndex < array.length; appointmentsIndex++) {
                        if (moment($scope.availableTimes[availableTimesIndex].time, 'hh:mm a')
                                .isSame(moment(array[appointmentsIndex].start.time, 'hh:mm a'))) {
                            $scope.availableTimes[availableTimesIndex].available = false;
                        }
                        if (moment($scope.availableTimes[availableTimesIndex].time, 'hh:mm a')
                                .isBetween(moment(array[appointmentsIndex].start.time, 'hh:mm a'),
                                moment(array[appointmentsIndex].end.time, 'hh:mm a'), 'minute')) {
                            $scope.availableTimes[availableTimesIndex].available = false;
                        }
                    }
                }
            });
        }
        socket.on('update',function(){
            getAvailableTimes($scope.selectedDate, data.appointment.employee);
        });

        socket.on('oldHold',function(data){
            for(var dataIndex =0; dataIndex<data.length;dataIndex++){
                calculateHold(data[dataIndex].data);
            }
        });
        socket.on('newHold',function(data){
            if(data.user !== $scope.currentUser._id){
                calculateHold(data);
            }
        });
        socket.on('destroyOld',function(data){
            if(data.user !== $scope.currentUser._id) {
                destroyOld(data);
            }
        });
        var calculateHold = function(timeObj){
            var indexToReplace  = parseInt(_.findKey($scope.availableTimes, { 'time': timeObj.time}));
            var startTime = moment(timeObj.time, 'hh:mm a');
            var endTime = moment(timeObj.end, 'hh:mm a');
            var calculatedDuration = $scope.service.duration;
            for (var m = startTime; startTime.isBefore(endTime); m.add(calculatedDuration, 'minutes')) {
                $scope.availableTimes[indexToReplace].status = true;
                indexToReplace += 1;
            }
        };
        var destroyOld = function(timeObj){
            var indexToReplace  = parseInt(_.findKey($scope.availableTimes, { 'time': timeObj.time}));
            var startTime = moment(timeObj.time, 'hh:mm a');
            var endTime = moment(timeObj.end, 'hh:mm a');
            var destroyDuration = $scope.service.duration;

            for (var m = startTime; startTime.isBefore(endTime); m.add(destroyDuration, 'minutes')) {
                $scope.availableTimes[indexToReplace].status = false;
                indexToReplace += 1;
            }
        };
        /**
         *
         * @param time
         * @param index
         */
        $scope.selectedIndex = null;
        $scope.createAppointmentObj = function (time,index) {
            $scope.activeTime = time;
            $scope.showCount = true;
            socket.emit('timeTaken',time);
            if (!timeStarted) {
                $scope.$broadcast('timer-start');
                $scope.timerRunning = true;
                timeStarted = true;
            }else if(timeStarted){
                $scope.$broadcast('timer-reset');
                $scope.$broadcast('timer-start');
            }


            var newDate = moment($scope.selectedDate).format('MM/DD/YYYY');
            /**
             *
             * If there is a previously selected time and the previous selected time isn't equal to the current one
             * we toggle the previously selected time to be false; Toggle the current time to be true.
             * Then we set the current index as the selected index
             */
            if($scope.selectedIndex !== null){
                $scope.availableTimes[$scope.selectedIndex].toggled = false;
                socket.emit('timeDestroyed',$scope.availableTimes[$scope.selectedIndex]);
                time.toggled = !time.toggled;
                $scope.selectedIndex = index;
            }
            /**
             *
             * If there is no previously selected time we simply toggle the current time, then
             * set the current index as the selected index.
             */
            if($scope.selectedIndex == null){
                time.toggled = !time.toggled;
                $scope.selectedIndex = index;
            }
            $scope.selectedIndex = index;
            var apptDay = moment($scope.selectedDate).format('dddd');
            var apptDate = moment($scope.selectedDate).format('MM/DD/YYYY');
            var apptTime = moment(time.time, 'hh:mm a').format('hh:mm a');
            var endTime = moment(time.time, 'hh:mm a').add($scope.service.duration, 'minutes').format('hh:mm a');

            $scope.appointment = {
                _id: data.appointment._id,
                businessid: data.appointment.businessId,
                employee: data.appointment.employee,
                customer: $rootScope.currentUser._id,
                start: {
                    date: apptDate,
                    time: apptTime,
                    day: apptDay,
                    full: moment(apptDate+' '+apptTime,'MM/DD/YYYY hh:mm a').format()
                },
                end: {
                    date: apptDate,
                    time: endTime,
                    day: apptDay,
                    full:moment(apptDate+' '+endTime,'MM/DD/YYYY hh:mm a').format()

                },
                service: $scope.service._id,
                title: $scope.service.name,
                timestamp: moment()
            };
        };

        /**
         *
         * @param token
         */
        $scope.update = function () {
            socket.emit('timeDestroyed',$scope.activeTime);
             businessFactory.updateAppointment($scope.appointment)
               .then(function(data){
                 $modalInstance.close();
               });
        };
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    });
