angular.module('cc.business-controller',[])
.controller('businessCtrl', [
'$scope',
'auth',
'$state',
'location',
'$stateParams',
'businessFactory',
'location',
'$rootScope',
'$modal',
'socket',
function($scope, auth, $state,location,$stateParams,businessFactory,location,$rootScope,$modal,socket){
	$scope.currentUser = auth.currentUser();
	// $scope.business = business.data;
  $scope.cloudinaryBaseUrl = "http://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_100,r_10,w_100/v";
  $scope.cloudinaryDefaultPic = "http://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_100,r_10,w_100/v1432411957/profile/placeholder.jpg";

	
  $scope.business = businessFactory.business;
  if(!businessFactory.business.info._id){
    businessFactory.getBusiness($stateParams.businessid)
    .then(function(data){
      $scope.business = data.data.result;
      $scope.business.info = data.data.info;
      businessFactory.business = $scope.business;
    })
  }
  $scope.employeeError = businessFactory.error;
	$scope.animationsEnabled = true;

  // var object = {
  //   employeeId:'55dbd00c4f5384e661290aad',
  //   startDate:'09/10/2015'
  // }
  // console.log(object);
  

  // socket.on('employeeAppts',function(data){
  //   // console.log(data);
  //   $scope.employeeAppts = data;
  // })
  $scope.removeAlert=function(){
    $scope.employeeError.message = null;
  }
  $scope.open = function (size) {

    var modalInstance = $modal.open({
      animation: $scope.animationsEnabled,
      templateUrl: 'addServiceModal.html',
      controller: 'addServiceModalCtrl',
      size: size,
      resolve:{
      	business: function(){
      		return $scope.business.info;
      	}
      }
    });
   };
 	$scope.openEmployee = function (size) {
	    var modalInstance = $modal.open({
	      animation: $scope.animationsEnabled,
	      templateUrl: 'addEmployeeModal.html',
	      controller: 'addEmployeeModalCtrl',
	      size: size
	      // resolve:{
	      // 	id: function(){
	      // 		return $scope.employee.id;
	      // 	}
	      // }
	    });
   	};
  $scope.openService = function(size){
    var modalIsntance = $modal.open({
      animation: $scope.animationsEnabled,
      templateUrl: 'scheduleServiceModal.html',
      controller: 'scheduleServiceModalCtrl',
      size: size
    });
  }
  $scope.setService = function(service){
    businessFactory.service = service;
  }
  $scope.toggleAnimation = function () {
    $scope.animationsEnabled = !$scope.animationsEnabled;
  };
	// if($scope.currentUser._id === $scope.lbusiness.owner._id){
	// 	$scope.canEdit = true;
	// }else{
	// 	$scope.canEdit = false;
	// }
}])
.controller('scheduleServiceModalCtrl', function ($scope, $modalInstance,businessFactory,socket,moment) {

  $scope.service = businessFactory.service;
  $scope.cloudinaryBaseUrl = "http://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_100,r_10,w_100/v";
  $scope.cloudinaryDefaultPic = "http://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_100,r_10,w_100/v1432411957/profile/placeholder.jpg";
  $scope.minDate = $scope.minDate ? null : moment();

  $scope.$watch('selectedDate',function(newVal,oldVal){
    if(newVal){
      getAvailableTimes(newVal,$scope.employee._id);
    }
  })
  $scope.selectEmployee = function(employee){
    $scope.employee = employee;
  }

  function getAvailableTimes(date,employeeId){
    var newDate = moment(date).format('MM/DD/YYYY');
    var apptObj = {
      startDate: newDate,
      employeeId:employeeId
    }
    socket.emit('joinApptRoom',apptObj);
    businessFactory.getEmployeeAppts(apptObj)
      .then(function(data){
        // $scope.appointments = data;
        calculateAppointments(data.data);
      });
  }
  function calculateAppointments(data){

    var duration = $scope.service.duration;
    var startTime = moment('6:00 am', "hh:mm a");
    var endTime = moment('7:00 pm', "hh:mm a");

    // var rangesArray = [];
    // for(var i =0; i<data.length; i++){
    //   var start = moment(data[i].start.full);
    //   var end = moment(data[i].end.full);
    //   var newRange = moment.range(start,end)
      
    //   rangesArray.push(newRange);
    // }
    $scope.availableTimes = [];
    for (var m = startTime; startTime.isBefore(endTime); m.add(duration,'minutes')) {
      var appointmentObj = {
        time:m.format('hh:mm a'),
        available:true
      }
      $scope.availableTimes.push(appointmentObj);
    }

    for(var availableTimesIndex=0; availableTimesIndex<$scope.availableTimes.length;availableTimesIndex++){
      // console.log(moment($scope.availableTimes[availableTimesIndex].time,'hh:mm a').format())
      for(var appointmentsIndex=0; appointmentsIndex<data.length;appointmentsIndex++){

        // console.log(moment(data[appointmentsIndex].start.time,'hh:mm a').format())
        // console.log(moment($scope.availableTimes[availableTimesIndex].time,'hh:mm a').isSame(moment(data[appointmentsIndex].start.time,'hh:mm a')))
        if(moment($scope.availableTimes[availableTimesIndex].time,'hh:mm a').isSame(moment(data[appointmentsIndex].start.time,'hh:mm a'))){
          $scope.availableTimes[availableTimesIndex].available = false;
        }
        // console.log(moment($scope.availableTimes[availableTimesIndex].time,'hh:mm a').isBetween(moment(data[appointmentsIndex].start.time,'hh:mm a'),moment(data[appointmentsIndex].end.time,'hh:mm a'),'minute'))
        if(moment($scope.availableTimes[availableTimesIndex].time,'hh:mm a').isBetween(moment(data[appointmentsIndex].start.time,'hh:mm a'),moment(data[appointmentsIndex].end.time,'hh:mm a'),'minute')){
          $scope.availableTimes[availableTimesIndex].available = false;
        }
      }
      // for(var rangesArrayIndex=0; rangesArrayIndex<rangesArray.length;rangesArrayIndex++){
      //   // console.log(rangesArray[rangesArrayIndex].start)
      //   // console.log(rangesArray[rangesArrayIndex])
      //   // console.log(moment($scope.availableTimes[availableTimesIndex].time,'hh:mm a').format());
      //   // var when = moment($scope.availableTimes[availableTimesIndex].time,'hh:mm a');
      //   // console.log(when.within(rangesArray[rangesArrayIndex]))
      //   console.log(rangesArray[rangesArrayIndex].contains(moment($scope.availableTimes[availableTimesIndex].time,'hh:mm a').format(),'minutes'))
      //   if(rangesArray[rangesArrayIndex].contains(moment($scope.availableTimes[availableTimesIndex].time).format())){
      //     $scope.availableTimes[availableTimesIndex].available = false;
      //   }
      // }
    }

    // console.log($scope.availableTimes);

    var dr = moment.range(startTime, endTime);
  }



  socket.on('employeeAppts',function(data){
    console.log(data);
    $scope.appointments = data;
  })
  $scope.ok = function (service) {
    // service.businessId = business._id;
    // service.employees = _.pluck($scope.serviceEmployees,'_id');
    // businessFactory.addService(service);
    $modalInstance.close();
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
})
.controller('addServiceModalCtrl', function ($scope, $modalInstance, businessFactory,business) {

  $scope.business = business;

  // $scope.service = {
  //   employees: []
  // }
  $scope.serviceEmployees = [];
    $scope.settings = {
    displayProp: 'firstName',
    idProp: '_id',
    externalIdProp: '_id',
    smartButtonMaxItems: 3,
    smartButtonTextConverter: function(itemText, originalItem) {
        return itemText;
    }
  }
  $scope.ok = function (service) {
  	service.businessId = business._id;
    service.employees = _.pluck($scope.serviceEmployees,'_id');
  	businessFactory.addService(service);
    $modalInstance.close();
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
})
.controller('addEmployeeModalCtrl', function ($scope, $modalInstance, businessFactory) {
  $scope.cloudinaryBaseUrl = "http://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_100,r_10,w_100/v";
  $scope.cloudinaryDefaultPic = "http://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_100,r_10,w_100/v1432411957/profile/placeholder.jpg";

  $scope.create = function (id) {
    var business = businessFactory.business;
    var newEmployee = {
      businessId:business.info._id,
      employeeId:id
    }
  	businessFactory.addEmployee(newEmployee);
    $modalInstance.close();
  };

  $scope.findEmployee = function(id){
    businessFactory.searchEmployee(id)
      .then(function(data){
        $scope.employee = data.data;
      })
  }

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
})