/*
 * Created by: Khalil Brown
 *
 * All Routes under the /user end point
 */
angular.module('cc.user-factory', [])
    .factory('user', ['$http', 'auth', function ($http, auth) {
        var o = {
            appointments:[],
            dashboard:[],
            user:{},
            customerEmployeeAppts:[]
        };

        /**
         *   Returns the profile of a specified user.
         *
         **/
        o.get = function (username) {
            return $http.get('/user/profile', {
                params: {
                    username: username
                },
                headers: {
                    Authorization: 'Bearer ' + auth.getToken(),
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).then(function (res) {
                // angular.copy(res.data, o.user)
                return res.data;
            }, function (response) {
                //TODO Handle error
                //console.log(response);
            });
        };
        /**
         *   Upload a users profile picture
         *
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
            }, function (response) {
                //TODO Handle error
                //console.log(response);
            });
        };
        /**
         * Returns all a users personal and business appointments
         *
         * @returns {*}
         */
        o.getUserAppts = function () {
            return $http.get('/user/appointments-all', {
                headers: {Authorization: 'Bearer ' + auth.getToken()}
            }).then(function (data) {
                //TODO Handle success
                angular.copy(data.data, o.appointments);
                //console.log(data);
            }, function (response) {
                //TODO Handle error
                //console.log(response);
            });
        };
        /**
         *  Returns all appointments for both the employee and the customers trying to schedule an appointment,
         *  Takes in the ID of the employee & the startDate to search for. User ID is grabbed from
         *  auth middleware.
         *
         **/
        o.getAppts = function (object) {
            return $http.get('/user/appointments', {
                params: {
                    'startDate': object.startDate,
                    'id': object.id
                },
                headers: {Authorization: 'Bearer ' + auth.getToken()}
            }).then(function (data) {
                //TODO Handle success
                angular.copy(data.data, o.customerEmployeeAppts)
                //console.log(data);
            }, function (response) {
                //TODO Handle error
                //console.log(response);
            });
        };
        /**
         *   Returns a user object
         *
         *  Parameters:
         *  id - The id of the employee.
         **/
        o.search = function (id) {
            return $http.get('/user/search', {
                params: {
                    'id': id
                },
                headers: {Authorization: 'Bearer ' + auth.getToken()}
            }).then(function (data) {
                angular.copy(data.data, o.user);
            }, function (response) {
                //TODO Handle error
                //console.log(response);
            });
        };

        o.getDashboard = function () {
            return $http.get('/user/dashboard', {
                headers: {
                    Authorization: 'Bearer ' + auth.getToken(),
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).then(function (data) {
                //TODO Handle success
                angular.copy(data.data, o.dashboard)
            }, function (response) {
                //TODO Handle error
                //console.log(response);
            });
        };
        return o;
    }]);