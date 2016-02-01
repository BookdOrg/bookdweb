/**
 * Created by khalilbrown on 1/31/16.
 */
/**
 * Created by khalilbrown on 1/24/16.
 */
var moment = require('moment');
module.exports = function () {
    return function (time) {
        if (angular.isUndefined(time)) {
            return;
        }
        var hoursString, minutesString;
        var duration = moment.duration(parseInt(time), 'minutes');
        var hours = moment.duration(duration).hours();
        if (hours > 0) {
            hoursString = hours + 'hr';
        }
        var minutes = moment.duration(duration).minutes();
        if (minutes > 0) {
            minutesString = minutes + 'min';
        }
        if (angular.isDefined(hoursString) && angular.isDefined(minutesString)) {
            return hoursString + ' ' + minutesString
        } else if (angular.isDefined(hoursString) && !angular.isDefined(minutesString)) {
            return hoursString;
        } else {
            return minutesString;
        }

    };
};

