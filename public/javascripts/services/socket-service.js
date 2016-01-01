/*
 * Created by: Khalil Brown
 *
 */
module.exports = function ($rootScope) {
    var socket = io.connect('//localhost:3001');

    function on(eventName, callback) {
        socket.on(eventName, function () {
            var args = arguments;
            $rootScope.$apply(function () {
                callback.apply(socket, args);
            });
        });
    }

    function emit(eventName, data, callback) {
        socket.emit(eventName, data, function () {
            var args = arguments;
            $rootScope.$apply(function () {
                if (callback) {
                    callback.apply(socket, args);
                }
            });
        });
    }

    function disconnect() {
        socket.disconnect();
    }

    return {
        on: on,
        emit: emit,
        disconnect: disconnect
    };
};