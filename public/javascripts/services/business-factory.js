angular.module('cc.business-factory',[])
.factory('businessFactory', ['$http', 'auth', function($http, auth){
  var o = {
    categories: [],
    business: {
      info:{}
    },
    error:{

    },
    service:{},
    businesses:[]
  };

  o.get = function(id) {
    return $http.get('/business/' + id, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).then(function(res){
      return res.data;
    });
  };
  o.query = function(query){
    return $http.get('/query',{
      params:{
        'query':query
      },
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      angular.copy(data,o.businesses)
    })
  }
  o.getEmployeeAppts = function(object){
    return $http.get('/employee/appointments',{
      params:{
        'startDate':object.startDate,
        'id':object.id
      },
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){

    })
  }
  o.addAppointment = function(appt){
    return $http.post('/appointment',appt, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){

    },function(err){

    });
  }
  // o.getUserAppts = function(object){
  //   return $http.get('/user/appointments',{
  //     params:{
  //       'startDate':object.startDate
  //     },
  //     headers: {Authorization: 'Bearer '+auth.getToken()}
  //   }).success(function(data){

  //   })
  // }
  o.getBusinessList = function(category,location,radius){
    return $http.get('/business-list', {
      params:{
        'category':category,
        'location':location,
        'radius':radius
      },
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){

    });
  }
  o.searchEmployee = function(id){
    return $http.get('/search/employees', {
      params:{
        'id':id
      },
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      angular.copy(data, o.categories)
    });
  }
  o.addEmployee = function(employee){
    return $http.post('/business/employee',employee, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      angular.copy(data,o.business.info);
    }).error(function(err){
      angular.copy(err,o.error)
    });
  }
  o.getCategories = function() {
    return $http.get('/categories', {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      angular.copy(data, o.categories)
    });
  };
  o.claim = function(claim) {
    return $http.post('/business/claim',claim, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){

    },function(err){

    });
  };
  o.getBusiness = function(id){
    return $http.get('/business-detail', {
      params:{
        'placesId':id
      },
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data,err){
    });
  }
  o.addService = function(service){
    return $http.post('/business/service',service,{
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).then(function(data,err){
      angular.copy(data.data, o.business.info);
    });
  }

  return o;
}])