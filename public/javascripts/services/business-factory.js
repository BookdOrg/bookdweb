/*
 * Created by: Khalil Brown
 *
 * Business Factory - Responsible for interacting with all routes related to businesses & querying
 *
 * All Routes under the /business endpoint
 */
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
    requests:[],
    businesses:[]
  };

/**
 *   Queries & returns google places for a business based on a
 *   text search.
 *
 **/
  o.search = function(query){
    return $http.get('/business/search',{
      params:{
        'query':query
      },
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      angular.copy(data,o.businesses)
    })
  }
//  o.getEmployeeAppts = function(object){
//    return $http.get('/user/appointments',{
//      params:{
//        'startDate':object.startDate,
//        'id':object.id
//      },
//      headers: {Authorization: 'Bearer '+auth.getToken()}
//    }).success(function(data){
//
//    })
//  }
/**
 *   Creates a new appointment for both the Employee and Customer.
 *   Takes in the appointment object.
 *
 *    Parameters:
 *               businessId -
 *  employee -
 *  customer -
 *  start -
 *  end -
 *  title -
 *  timestamp -
 *  card -
 **/
  o.addAppointment = function(appt){
    return $http.post('/business/appointments/create',appt, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){

    },function(err){

    });
  }
/**
 *   Returns a list of all businesses in a specific category that are within the defined
 *   search radius. Radar Search returns a list of 200 businesses maximum.
 *
 *  Update this route to remote the google places detail request. Instead of caching results
 *  from the Business List page on the front/end just make a second call for details when they
 *  click which business they want details for.
 *
 *
 *  Parameters:
 *  category -
 *  location -
 *  radius -
 *
 **/
  o.getNearby = function(category,location,radius){
    return $http.get('/business/nearby', {
      params:{
        'category':category,
        'location':location,
        'radius':radius
      },
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){

    });
  }
//  o.searchEmployee = function(id){
//    return $http.get('/user/search', {
//      params:{
//        'id':id
//      },
//      headers: {Authorization: 'Bearer '+auth.getToken()}
//    }).success(function(data){
//      angular.copy(data, o.categories)
//    });
//  }
/**
 *
 *  Adds a new employee to a Business.
 *  Parameters:
 *  businessId -
 *  employeeId -
 *
 **/
  o.addEmployee = function(employee){
    return $http.post('/business/add-employee',employee, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      angular.copy(data,o.business.info);
    }).error(function(err){
      angular.copy(err,o.error)
    });
  }
/**
 *   Returns all categories that Bookd offers
 *
 **/

  o.getCategories = function() {
    return $http.get('/categories/all', {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      angular.copy(data, o.categories)
    });
  };
/**
 *   Submits a claim request to Bookd
 *  Parameters:
 *  id-
 *  category-
 *  placesId-
 *  dateCreated-
 *  timestamp-
 *
 **/
  o.claim = function(claim) {
    return $http.post('/business/claim-request',claim, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){

    },function(err){

    });
  };
/**
 *   Returns all information about a specific Business.
 *
 *  Parameters:
 *  placeId -
 *
 **/
  o.getBusiness = function(id){
    return $http.get('/business/details', {
      params:{
        'placesId':id
      },
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data,err){
    });
  }
/**
 *   Adds a Service to a Business
 *
 *  Parameters:
 *  name-
 *  duration-
 *  employees-
 *  description-
 *  price-
 *  businessId-
 *
 **/
  o.addService = function(service){
    return $http.post('/business/add-service',service,{
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).then(function(data,err){
      angular.copy(data.data, o.business.info);
    });
  }
/**
 *
 * getRequests - Returns all businsses that have pending requests
 *
 *
 **/
    o.getRequests = function(){
        return $http.get('/business/pending-requests', {
            headers: {Authorization: 'Bearer '+auth.getToken()}
        }).success(function(data){
            angular.copy(data, o.requests);
        });
    }
/**
 *
 *  changeStatus - Updates the status of the businesses object, from
 *  pending to claimed.
 *  Params :
 *      request - the business object
 **/
    o.changeStatus = function(request){
        return $http.post('/business/update-request',request, {
            headers: {Authorization: 'Bearer '+auth.getToken()}
        }).success(function(data){
            angular.copy(data, o.requests);
        });
    }
  return o;
}])