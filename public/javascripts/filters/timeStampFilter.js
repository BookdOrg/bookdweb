/**
 * Created by khalilbrown on 1/20/16.
 */

var moment = require('moment');
module.exports = function () {
    return function (timestamp) {
        if (angular.isUndefined(timestamp)) {
            return;
        }
        return moment(new Date(timestamp)).calendar();
    };
};

