/**
 * Created by khalilbrown on 11/28/15.
 */
module.exports = function () {
    /**
     * Filter out appointments that occur before today.
     * Return array of appointments occurring today or later.
     * We append the number of days between the appointment day and today to each filtered appointment.
     * @param dates - An array of dates in MM/DD/YYYY format.
     */
    return function (dates) {
        if (!dates) {
            return;
        }
        var newDates = [],
            today = moment().startOf('day');

        for (var currDateIndex = 0; currDateIndex < dates.length; currDateIndex++) {
            var startDay = moment(dates[currDateIndex].start.date, 'MM/DD/YYYY'),
                numDaysAway = startDay.diff(today, 'days');

            if (numDaysAway > 0) {
                newDates.push(dates[currDateIndex]);
                newDates[newDates.length - 1].dayDiff = numDaysAway;
            }
        }
        return newDates;
    };
};

