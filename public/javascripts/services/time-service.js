angular.module('cc.time-service', [])
    .factory('time', ['moment', function (moment) {
        return {
            /**
             * Helper function that gets the differences for each element of an array containing dates
             * and the current day.
             * @param dates - An array of dates in MM/DD/YYYY format.
             * @returns {Array} - Array of days diff from today.
             */
            getDaysDiff: function (dates) {
                var dayDiffs = [];

                for (var currDateIndex = 0; currDateIndex < dates.length; currDateIndex++) {
                    var startDay = moment(dates[currDateIndex].start.date, 'MM/DD/YYYY'),
                        today = moment().startOf('day');

                    var numDaysAway = startDay.diff(today, 'days');

                    dayDiffs.push(numDaysAway);
                }
                return dayDiffs;
            }
        }
    }]);