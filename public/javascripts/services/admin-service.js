/*
 * Created by: Khalil Brown
 * This service controls actions the ADMIN may take on
 * any business object.
 */

module.exports = function ($http, auth) {
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
        }, handleError)
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
        }, handleError)
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
};