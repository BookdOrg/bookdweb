angular.module('cc.business-factory',[])
.factory('businessFactory', ['$http', 'auth', function($http, auth){
  var o = {
    categories: [],
    business: {
      info:{}
    },
    error:{

    },
    service:{}
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

    })
  }
  o.getEmployeeAppts = function(object){
    return $http.get('/appointments/employee',{
      params:{
        'startDate':object.startDate,
        'employeeId':object.employeeId
      },
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){

    })
  }
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
        'placeId':id
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