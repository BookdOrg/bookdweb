/**
 * Created by khalilbrown on 2/5/16.
 */
module.exports = function () {
    return function (date) {
        if (angular.isUndefined(date)) {
            return;
        }
        return moment(date, ['YYYY-MM-DDTHH:mm:ssZ', moment.ISO_8601]).calendar(null, {
            sameElse: 'dddd' + ', ' + 'MMMM' + ' Do' + ' - ' + 'hh:mm a'
        })
    };
};