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
}])
.controller('scheduleServiceModalCtrl', function ($scope, $modalInstance,businessFactory,socket,moment,auth) {

  $scope.service = businessFactory.service;
  $scope.stripePrice = $scope.service.price * 100;
  $scope.cloudinaryBaseUrl = "http://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_100,r_10,w_100/v";
  $scope.cloudinaryDefaultPic = "http://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_100,r_10,w_100/v1432411957/profile/placeholder.jpg";
  $scope.minDate = $scope.minDate ? null : moment();
  $scope.currentUser = auth.currentUser();
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
    var employeeApptObj = {
      startDate: newDate,
      id:employeeId
    }
    socket.emit('joinApptRoom',employeeApptObj);
    businessFactory.getEmployeeAppts(employeeApptObj)
      .then(function(data){
        calculateAppointments(data.data);
      });
  }
  function calculateAppointments(data){
    var duration = $scope.service.duration;
    var startTime = moment('6:00 am', "hh:mm a");
    var endTime = moment('7:00 pm', "hh:mm a");
    $scope.availableTimes = [];
    
    for (var m = startTime; startTime.isBefore(endTime); m.add(duration,'minutes')) {
      var timeObj = {
        time:m.format('hh:mm a'),
        available:true
      }
      $scope.availableTimes.push(timeObj);
    }
      data.forEach(function(array){
        for(var availableTimesIndex=0; availableTimesIndex<$scope.availableTimes.length;availableTimesIndex++){
          for(var appointmentsIndex=0; appointmentsIndex<array.length;appointmentsIndex++){
            if(moment($scope.availableTimes[availableTimesIndex].time,'hh:mm a').isSame(moment(array[appointmentsIndex].start.time,'hh:mm a'))){
              $scope.availableTimes[availableTimesIndex].available = false;
            }
            if(moment($scope.availableTimes[availableTimesIndex].time,'hh:mm a').isBetween(moment(array[appointmentsIndex].start.time,'hh:mm a'),moment(array[appointmentsIndex].end.time,'hh:mm a'),'minute')){
              $scope.availableTimes[availableTimesIndex].available = false;
            }
          }
        }
      })
  }
  socket.on('employeeAppts',function(data){
    console.log(data);
    $scope.appointments = data;
  })

  $scope.createAppointmentObj = function(time,index){
    var apptDay = moment($scope.selectedDate).format('dddd');
    var apptDate = moment($scope.selectedDate).format('MM/DD/YYYY');
    var apptTime = moment(time.time,'hh:mm a').format('hh:mm a');
    var endTime = moment(time.time,'hh:mm a').add($scope.service.duration,'minutes').format('hh:mm a');

    $scope.appointment = {
      businessid:$scope.service.businessId,
      employee:$scope.employee._id,
      customer:$scope.currentUser._id,
      start:{
        date:apptDate,
        time:apptTime,
        day:apptDay,
      },
      end:{
        date:apptDate,
        time:endTime,
        day:apptDay,
      },
      title:$scope.service.name,
      timestamp: moment()

    }
    
  }
  $scope.ok = function() {
    // businessFactory.addAppointment($scope.appointment);
    //   .then(function(data){
    //     $modalInstance.close();
    //   })
    
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