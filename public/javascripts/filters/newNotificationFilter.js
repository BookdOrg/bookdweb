/**
 * Created by Jonfor on 1/21/16.
 */
module.exports = function () {
    return function (notifications) {
        if (angular.isUndefined(notifications)) {
            return;
        }

        if ((_.filter(notifications, {viewed: false}).length) > 0) {
            return 'new-notification-alert';
        } else {
            return '';
        }
    };
};