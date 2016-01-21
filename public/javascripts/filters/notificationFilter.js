/**
 * Created by khalilbrown on 11/28/15.
 */
module.exports = function () {
    return function (notifications) {
        if (angular.isUndefined(notifications)) {
            return;
        }

        return _.filter(notifications, {viewed: false}).length;
    };
};

