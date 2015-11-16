/*
 * Created by: Khalil Brown
 *
 * Business Factory - Responsible for interacting with all routes related to businesses & querying
 *
 * All Routes under the /business endpoint
 */
angular.module('cc.business-factory', [])
    .factory('businessFactory', ['$http', 'auth', function ($http, auth) {
        var o = {
            categories: [],
            business: {
                info: {}
            },
            error: {},
            service: {},
            requests: [],
            businesses: []
        };

        /**
         *   Queries & returns google places for a business based on a
         *   text search.
         *
         **/
        o.search = function (query) {
            return $http.get('/business/search', {
                params: {
                    'query': query
                },
                headers: {Authorization: 'Bearer ' + auth.getToken()}
            }).then(function (data) {
                angular.copy(data.data, o.businesses);
            },function(err){
                return err.data;
            });
        };
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
        o.addAppointment = function (appt) {
            return $http.post('/business/appointments/create', appt, {
                headers: {Authorization: 'Bearer ' + auth.getToken()}
            }).then(function (response) {
                return response.data;
            }, function (err) {
                return err.data;
            });
        };
        /**
         *
         * Reschedule an appointment
         *
         */
        o.updateAppointment = function(appt){
            return $http.post('/business/appointments/update',appt,{
                headers:{Authorization: 'Bearer ' + auth.getToken()}
            }).then(function(response){

            },function(err){
                return err.data;
            });
        };
        /**
         *
         * Cancel an appointment
         *
         */
        o.cancelAppointment = function(appt){
            return $http.post('/business/appointments/cancel',appt,{
                headers:{Authorization: 'Bearer ' + auth.getToken()}
            }).then(function(response){

            },function(err){
                return err.data;
            });
        };
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
        o.getNearby = function (category, location, radius) {
            return $http.get('/business/nearby', {
                params: {
                    'category': category,
                    'location': location,
                    'radius': radius
                },
                headers: {Authorization: 'Bearer ' + auth.getToken()}
            }).then(function (data) {
                //TODO Handle data
            }, handleError);
        };
        /**
         *
         *  Adds a new employee to a Business.
         *  Parameters:
         *  businessId -
         *  employeeId -
         *
         **/
        o.addEmployee = function (employee) {
            return $http.post('/business/add-employee', employee, {
                headers: {Authorization: 'Bearer ' + auth.getToken()}
            }).then(function (data) {
                angular.copy(data.data, o.business.info);
            }, function (err) {
                angular.copy(err, o.error);
            });
        };

        /**
         *
         *  Deletes an employee to from a Business.
         *  Parameters:
         *  businessId -
         *  employeeId -
         *
         **/
        o.removeEmployee = function (employee) {
            return $http.post('/business/remove-employee', employee, {
                headers: {Authorization: 'Bearer ' + auth.getToken()}
            }).then(function (data) {
                angular.copy(data.data,o.business.info);
            }, function (err) {
                angular.copy(err, o.error);
            });
        };

        /**
         *   Returns all categories that Bookd offers
         *
         **/

        o.getCategories = function () {
            return $http.get('/categories/all', {
                headers: {Authorization: 'Bearer ' + auth.getToken()}
            }).then(function (data) {
                angular.copy(data.data, o.categories);
            }, handleError)
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
        o.claim = function (claim) {
            return $http.post('/business/claim-request', claim, {
                headers: {Authorization: 'Bearer ' + auth.getToken()}
            }).then(function (response) {
                //TODO Handle success
                return response
            }, handleError)
        };
        /**
         *   Returns all information about a specific Business.
         *
         *  Parameters:
         *  placeId -
         *
         **/
        o.getBusiness = function (id) {
            return $http.get('/business/details', {
                params: {
                    'placesId': id
                },
                headers: {Authorization: 'Bearer ' + auth.getToken()}
            }).then(function (data) {
                angular.copy(data.data, o.business);
            }, handleError)
        };

        /**
         *   Returns all information about a specific Business.
         *
         *  Parameters:
         *  placeId -
         *
         **/
        o.getBusinessInfo = function (id) {
            return $http.get('/business/info', {
                params: {
                    'placesId': id
                },
                headers: {Authorization: 'Bearer ' + auth.getToken()}
            }).then(function (data) {
                angular.copy(data.data, o.business.info);
            }, handleError);
        };
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
        o.addService = function (service) {
            return $http.post('/business/add-service', service, {
                headers: {Authorization: 'Bearer ' + auth.getToken()}
            }).then(function (data) {
                angular.copy(data.data, o.business.info);
            }, handleError);
        };
        /**
         *
         *
         */
        o.updateService = function (service) {
            return $http.post('/business/update-service', service, {
                headers: {Authorization: 'Bearer ' + auth.getToken()}
            }).then(function (response) {
                //angular.copy(data.data, o.business.info);
                return response.data;
            }, handleError)
        };
        /**
         *
         *
         */
        o.removeService = function (serviceId) {
            return $http.post('/business/add-service', serviceId, {
                headers: {Authorization: 'Bearer ' + auth.getToken()}
            }).then(function (data) {
                angular.copy(data.data, o.business.info);
            }, handleError);
        };
        /**
         *
         * Get the details for a specific service
         *
         */
        o.serviceDetails = function(serviceId){
            return $http.get('/business/service-detail', {
                params:{
                    'service':serviceId
                },
                headers: {Authorization: 'Bearer ' + auth.getToken()}
            }).then(function(data){
                angular.copy(data.data, o.service);
            },handleError);
        };
        /**
         *
         * getRequests - Returns all businsses that have pending requests
         *
         *
         **/
        o.getRequests = function () {
            return $http.get('/business/pending-requests', {
                headers: {Authorization: 'Bearer ' + auth.getToken()}
            }).then(function (data) {
                angular.copy(data.data, o.requests);
            }, handleError);
        };
        /**
         *
         *  changeStatus - Updates the status of the businesses object, from
         *  pending to claimed.
         *  Params :
         *      request - the business object
         **/
        o.changeStatus = function (request) {
            return $http.post('/business/update-request', request, {
                headers: {Authorization: 'Bearer ' + auth.getToken()}
            }).then(function (data) {
                angular.copy(data.data, o.requests);
            }, handleError);
        };
        return o;

        // I transform the error response, unwrapping the application dta from
        // the API response payload.
        function handleError(response) {
            // The API response from the server should be returned in a
            // normalized format. However, if the request was not handled by the
            // server (or what not handles properly - ex. server error), then we
            // may have to normalize it on our end, as best we can.
            if (!angular.isObject(response.data) || !response.data.message) {
                return ( $q.reject("An unknown error occurred.") );
            }
            // Otherwise, use expected error message.
            return ( $q.reject(response.data.message) );
        }
    }]);