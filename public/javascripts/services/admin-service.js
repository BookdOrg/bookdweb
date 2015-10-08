/*
 * Created by: Khalil Brown
 * This service controls actions the ADMIN may take on
 * any business object.
 */

angular.module('cc.admin-service', [])
    .factory('adminService', ['$http', 'auth', function ($http, auth) {
        var o = {
            requests: []
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
                angular.copy(data, o.requests);
            }, function (response) {
                //TODO Handle error case
            });
        };
        /**
         *
         * changeStatus - Updates the status of the businesses object, from
         * pending to claimed.
         * Params :
         *      request - the business object
         **/
        o.changeStatus = function (request) {
            return $http.post('/business/update-request', request, {
                headers: {Authorization: 'Bearer ' + auth.getToken()}
            }).then(function (data) {
                angular.copy(data, o.requests);
            }, function (response) {
                //TODO Handle error case
            });
        };
        return o;
    }]);