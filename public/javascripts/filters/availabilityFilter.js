/**
 * Created by khalilbrown on 1/24/16.
 */
var moment = require('moment');
module.exports = function () {
    return function (date) {
        if (angular.isUndefined(date)) {
            return;
        }
        return moment(date).format('hh:mm a');
    };
};

