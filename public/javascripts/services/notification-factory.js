/**
 * Created by Jonfor on 12/24/15.
 */
module.exports = function ($http, auth, $q, $interval) {
    var o = {};
    o.addNotification = function (id, content, type, sendEmail, date) {
        var body = {
            id: id,
            content: content,
            type: type,
            sendEmail: sendEmail,
            date: date
        };
        return $http.post('/user/notifications/create', body, {
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        }).then(function (response) {
            return response.data;
        }, function (err) {
            handleError(err);
            return err.data;
        });
    };

    o.getNotifications = function () {
        return $http.get('/user/notifications', {
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        }).then(function (response) {
            return response.data;
        }, function (err) {
            handleError(err);
            return err.data;
        });
    };

    /**
     * Route to change all non-viewed notifications to viewed.
     * @returns {*}
     */
    o.notificationsViewed = function () {
        return $http.get('/user/notifications/viewed', {
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        }).then(function (response) {
            return response.data;
        }, function (err) {
            handleError(err);
            return err.data;
        });
    };

    /**
     * Route to change one non-viewed notifications to viewed given it's ID.
     * @param id
     * @returns {*}
     */
    o.notificationViewed = function (id) {
        var body = {
            id: id
        };
        return $http.post('/user/notification/viewed', body, {
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        }).then(function (response) {
            return response.data;
        }, function (err) {
            handleError(err);
            return err.data;
        });
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
            return ( $q.reject('An unknown error occurred.') );
        }
        // Otherwise, use expected error message.
        return ( $q.reject(response.data.message) );
    }
};