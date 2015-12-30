/*
 * Created by: Khalil Brown
 *
 * All Routes under the /user end point
 */
var userFactory = function ($http, auth, $q) {
    var o = {
        appointments: [],
        dashboard: [],
        user: {},
        customerEmployeeAppts: []
    };

    /**
     *   Returns the profile of a specified user.
     **/
    o.get = function (id) {
        return $http.get('/user/profile', {
            params: {
                id: id
            },
            headers: {
                Authorization: 'Bearer ' + auth.getToken(),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then(function (res) {
            // angular.copy(res.data, o.user)
            return res.data;
        }, handleError);
    };
    /**
     *   Upload a users profile picture
     **/
    o.postPicture = function () {
        return $http.post('/upload', {
            headers: {
                Authorization: 'Bearer ' + auth.getToken(),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then(function (data) {
            //TODO Handle success
            //console.log(data);
        }, handleError);
    };
    o.getGooglePhoto = function (id) {
        return $http.get('/user/google-photo', {
            params: {
                id: id
            },
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        }).then(function (data) {
            return data.data;
        });
    };
    /**
     * Returns all a users personal and business appointments
     * @returns {*}
     */
    o.getUserAppts = function (id, monthYear) {
        return $http.get('/user/appointments-all', {
            params: {
                id: id,
                monthYear: monthYear
            },
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        }).then(function (data) {
            angular.copy(data.data, o.appointments);
            return data.data;
            //console.log(data);
        }, handleError);
    };
    /**
     *  Returns all appointments for both the employee and the customers trying to schedule an appointment,
     *  Takes in the ID of the employee & the startDate to search for. User ID is grabbed from
     *  auth middleware.
     **/
    o.getAppts = function (object) {
        return $http.get('/user/appointments', {
            params: {
                'startDate': object.startDate,
                'employeeId': object.employeeId,
                'customerId': object.customerId,
                'personal':object.personal
            },
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        }).then(function (data) {
            angular.copy(data.data, o.customerEmployeeAppts);
            return data.data;
        }, handleError);
    };
    /**
     *   Returns a user object
     *
     *  Parameters:
     *  id - The id of the employee.
     **/
    o.search = function (email) {
        return $http.get('/user/search', {
            params: {
                'email': email
            },
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        }).then(function (data) {
            angular.copy(data.data, o.user);
            return data.data;
        }, handleError);
    };

    o.getDashboard = function () {
        return $http.get('/user/dashboard', {
            headers: {
                Authorization: 'Bearer ' + auth.getToken(),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then(function (data) {
            angular.copy(data.data, o.dashboard);
        }, handleError);
    };
    o.updateProfile = function (data) {
        return $http.post('/user/profile/update', data, {
            headers: {
                Authorization: 'Bearer ' + auth.getToken(),
            }
        }).then(function (data) {
            //TODO Handle success
            console.log(data);
        }, handleError);
    };
    /**
     *
     *
     *  Parameters:
     *
     **/
    o.updateAvailability = function (availability) {
        return $http.post('/user/availability/update', availability, {
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        }).then(function (data) {
            return data.data;
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
};

module.exports = userFactory;