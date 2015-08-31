angular.module('cc.main-controller',["google.places"])
.controller('MainCtrl', [
'$scope',
'businessFactory',
'auth',
'$modal',
'$log',
'$geolocation',
'$http',
'location',
'categories',
'$rootScope',
'$compile',
'uiCalendarConfig',
function($scope,businessFactory,auth,$modal,$log,$geolocation,$http,location,categories,$rootScope,$compile,uiCalendarConfig){

  $scope.cloudinaryBaseUrl = "http://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_50,r_10,w_50/v";
  $scope.cloudinaryDefaultPic = "http://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_50,r_10,w_50/v1432411957/profile/placeholder.jpg";
  $scope.categories = businessFactory.categories;

  $rootScope.currLocation = location.getPosition();

  if(!$rootScope.currLocation.lat){
    $scope.loadingLocation = true;
  }

  $scope.autocompleteOptions = {
    componentRestrictions: {country: 'us'},
    types:['geocode']
  }
  $geolocation.watchPosition({
        timeout: 60000,
        maximumAge: 250,
        enableHighAccuracy: true
      });
  $scope.myPosition = $geolocation.position;
  
  $scope.$watch('myPosition.coords.latitude',function(newVal,oldVal){
    if(newVal !== oldVal){
      $http.get('http://maps.googleapis.com/maps/api/geocode/json?latlng='+$scope.myPosition.coords.latitude+","+$scope.myPosition.coords.longitude+"&sensor=true")
        .success(function(data){
          $scope.loadingLocation = false;
          location.setPosition(data.results[0]);
      });
    }
  })

  $scope.isLoggedIn = auth.isLoggedIn;

  //Commented out.. potentially use for the future. 
  
  // var socket = io.connect('http://khalilbrown.com:8112');

  // socket.on('newPost', function (data) {
  //       // if(data.post) {
  //       //   posts.getRecent();
  //       //   posts.getAll();
  //       // }
  // });
  // socket.on('newReview',function (data){
  //   // if(data.review){
  //   //   posts.getRecent();
  //   // }
  // })

  $scope.animationsEnabled = true;

  $scope.open = function (size) {
    var modalInstance = $modal.open({
      animation: $scope.animationsEnabled,
      templateUrl: 'myModalContent.html',
      controller: 'ModalInstanceCtrl',
      size: size,
      // resolve: {
      //   userLoc: function(){
      //     return $scope.currLocation;
      //   }
      // }
    });

    modalInstance.result.then(function (selectedItem) {

    }, function () {
      // $log.info('Modal dismissed at: ' + new Date());
    });
  };

  $scope.myInterval = 5000;
  var slides = $scope.slides = [];


  var date = new Date();
    var d = date.getDate();
    var m = date.getMonth();
    var y = date.getFullYear();
    
    $scope.changeTo = 'Hungarian';
    /* event source that pulls from google.com */
    // $scope.eventSource = {
    //         url: "http://www.google.com/calendar/feeds/usa__en%40holiday.calendar.google.com/public/basic",
    //         className: 'gcal-event',           // an option!
    //         currentTimezone: 'America/Chicago' // an option!
    // };
    /* event source that contains custom events on the scope */
    // console.log(d,m,y)
    // console.log(moment())
    $scope.events = [
      {title: 'Hello Khalil',start: moment().format()},
      {title: 'Long Event',start: new Date(y, m, d - 5),end: new Date(y, m, d - 2)},
      {id: 999,title: 'Repeating Event',start: new Date(y, 8, 25 - 3, 16, 0),allDay: false},
      {id: 999,title: 'Repeating Event',start: new Date(y, m+1, d + 4, 16, 0),allDay: false},
      {title: 'Birthday Party',start: new Date(y, m, 27),end: new Date(y, m, 27 ),allDay: false},
      {title: 'Click for Google',start: new Date(y, m, 28),end: new Date(y, m, 29),url: 'http://google.com/'}
    ];
    // + 1, 19, 0
    // + 1, 22, 30
    /* event source that calls a function on every view switch */
    // $scope.eventsF = function (start, end, timezone, callback) {
    //   var s = new Date(start).getTime() / 1000;
    //   var e = new Date(end).getTime() / 1000;
    //   var m = new Date(start).getMonth();
    //   var events = [{title: 'Feed Me ' + m,start: s + (50000),end: s + (100000),allDay: false, className: ['customFeed']}];
    //   callback(events);
    // };

    // $scope.calEventsExt = {
    //    color: '#f00',
    //    textColor: 'yellow',
    //    events: [ 
    //       {type:'party',title: 'Lunch',start: new Date(y, m, d, 12, 0),end: new Date(y, m, d, 14, 0),allDay: false},
    //       {type:'party',title: 'Lunch 2',start: new Date(y, m, d, 12, 0),end: new Date(y, m, d, 14, 0),allDay: false},
    //       {type:'party',title: 'Click for Google',start: new Date(y, m, 28),end: new Date(y, m, 29),url: 'http://google.com/'}
    //     ]
    // };
    /* alert on eventClick */
    $scope.alertOnEventClick = function( date, jsEvent, view){
        $scope.alertMessage = (date.title + ' was clicked ');
    };
    /* alert on Drop */
     $scope.alertOnDrop = function(event, delta, revertFunc, jsEvent, ui, view){
       $scope.alertMessage = ('Event Droped to make dayDelta ' + delta);
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
    $scope.addEvent = function(month,day,year) {
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
      if(uiCalendarConfig.calendars[calendar]){
        uiCalendarConfig.calendars[calendar].fullCalendar('render');

      }
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
        defaultView:'agendaDay',
        header:{
          left: 'today prev,next',
          center: '',
          right: 'title'
        },
        eventClick: $scope.alertOnEventClick,
        eventDrop: $scope.alertOnDrop,
        eventResize: $scope.alertOnResize,
        eventRender: $scope.eventRender
      }
    };

    $scope.changeLang = function() {
      if($scope.changeTo === 'Hungarian'){
        $scope.uiConfig.calendar.dayNames = ["Vasárnap", "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat"];
        $scope.uiConfig.calendar.dayNamesShort = ["Vas", "Hét", "Kedd", "Sze", "Csüt", "Pén", "Szo"];
        $scope.changeTo= 'English';
      } else {
        $scope.uiConfig.calendar.dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        $scope.uiConfig.calendar.dayNamesShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        $scope.changeTo = 'Hungarian';
      }
    };
    /* event sources array*/
    $scope.eventSources = [$scope.events];
    // $scope.eventSources2 = [$scope.calEventsExt, $scope.eventsF, $scope.events];

}])
