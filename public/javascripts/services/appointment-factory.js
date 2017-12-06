/**
 * Created by khalilbrown on 2/17/16.
 */
module.exports = function () {
    /**
     *
     * @param employeeAvailability - The employee availability array with availability for all days and a deeper array with break times
     * @param appointmentsArray - The array of appointments for both the employee and the user.
     * @param duration - Duration of the selected service we are trying to schedule
     * @param user - The id of the user we are scheduling for.
     * @returns {Array}
     */
    function createAvailableTimes(employeeAvailability, appointmentsArray, duration, user) {
        var availableTimes = [];
        //The duration of the service in minutes.
        var minutes = moment.duration(parseInt(duration), 'minutes');
        var employeeDate = employeeAvailability.date.clone();
        //We need to count from the start of the employee's day by the duration number of minutes as long as it's before the
        //employee's end time.
        for (var m = employeeAvailability.dayStart; employeeAvailability.dayStart.isBefore(employeeAvailability.dayEnd); m.add(duration, 'minutes')) {

            var availableTimeStart = m.clone();
            availableTimeStart.set('second', '00');
            var startPlusEnd = m.clone();
            startPlusEnd.set('second', '00');
            startPlusEnd.add(minutes);
            var availableTimeEnd = startPlusEnd.clone();
            var availableTimeRange = moment.range(availableTimeStart, availableTimeEnd);
            //This object represents a block of time that we can possible return to the function caller
            var timeObj = {
                time: availableTimeStart.format('hh:mm a'),
                end: availableTimeEnd.format('hh:mm a'),
                available: true,
                toggled: false,
                status: false,
                hide: false,
                user: user
            };
            /**
             *
             * We loop though the array of break times for a given employee on the given day.
             * If there are any intersections between the employee's break time and the current "available time"
             * then we adjust our available time.
             */
            _.forEach(employeeAvailability.gaps, function (gap) {
                var gapStartHour = moment(gap.start, 'hh:mm a').hour();
                var gapStartMinute = moment(gap.start, 'hh:mm a').minute();
                var gapEndHour = moment(gap.end, 'hh:mm a').hour();
                var gapEndMinute = moment(gap.end, 'hh:mm a').minute();
                var gapStart = moment(employeeDate).set({
                    'hour': gapStartHour,
                    'minute': gapStartMinute,
                    'second': '00'
                });
                var gapEnd = moment(employeeDate).set({
                    'hour': gapEndHour,
                    'minute': gapEndMinute,
                    'second': '00'
                });
                var gapRange = moment.range(gapStart, gapEnd);
                var adjustedEnd = m.clone();
                if (gapRange.intersect(availableTimeRange)) {
                    adjustedEnd.add(duration, 'minutes');
                    timeObj.end = adjustedEnd.format('hh:mm a');
                    m.set({'hour': gapEndHour, 'minute': gapEndMinute}).format('hh:mm a');
                    timeObj.time = m.clone().format('hh:mm a');
                } else {
                    adjustedEnd.add(duration, 'minutes');
                    timeObj.end = adjustedEnd.format('hh:mm a');
                }
            });

            /**
             *
             *
             * @param appointmentArray - The array of appointments for both the employee and the user
             */
            function calculateAppointmentBlocks(appointmentArray) {
                _.forEach(appointmentArray, function (appointment) {
                    calculateAppointment(appointmentArray, appointment, timeObj, m);
                });
            }

            _.forEach(appointmentsArray, function (appointmentArray) {
                calculateAppointmentBlocks(appointmentArray);
            });

            /**
             *
             *
             *
             * @param appointmentArray - The array of appointments for both the employee and the user
             * @param appointment - The current appoontment that we are looking at in the appointment array
             * @param timeObj - The current block of time we are trying to create
             * @param m - The moment object representing the employees start date
             */
            function calculateAppointment(appointmentArray, appointment, timeObj, m) {
                var apptStartHour = moment(appointment.start.time, 'hh:mm a').hour();
                var apptStartMinute = moment(appointment.start.time, 'hh:mm a').minute();
                var apptEndHour = moment(appointment.end.time, 'hh:mm a').hour();
                var apptEndMinute = moment(appointment.end.time, 'hh:mm a').minute();
                var apptStart = moment(employeeDate).set({
                    'hour': apptStartHour,
                    'minute': apptStartMinute,
                    'second': '00'
                });
                var apptEnd = moment(employeeDate).set({
                    'hour': apptEndHour,
                    'minute': apptEndMinute,
                    'second': '00'
                });
                var apptRange = moment.range(apptStart, apptEnd);
                var availableTimeAdjustedEnd = m.clone();
                var currentAvailableTimeStartHour = moment(timeObj.time, 'hh:mm a').hour();
                var currentAvailableTimeStartMinute = moment(timeObj.time, 'hh:mm a').minute();
                var currentAvailableTimeEndHour = moment(timeObj.end, 'hh:mm a').hour();
                var currentAvailableTimeEndMinute = moment(timeObj.end, 'hh:mm a').minute();

                var currAvailableStart = moment(employeeDate).set({
                    'minute': currentAvailableTimeStartMinute,
                    'hour': currentAvailableTimeStartHour,
                    'second': '00'
                });
                var currAvailableEnd = moment(employeeDate).set({
                    'minute': currentAvailableTimeEndMinute,
                    'hour': currentAvailableTimeEndHour,
                    'second': '00'
                });
                var currAvailableRange = moment.range(currAvailableStart, currAvailableEnd);

                if (apptRange.intersect(currAvailableRange) || apptRange.isSame(currAvailableRange)) {
                    m.set({'hour': apptEndHour, 'minute': apptEndMinute}).format('hh:mm a');
                    availableTimeAdjustedEnd = m.clone();
                    timeObj.time = m.clone().format('hh:mm a');
                    availableTimeAdjustedEnd.add(duration, 'minutes');
                    timeObj.end = availableTimeAdjustedEnd.format('hh:mm a');
                    calculateAppointmentBlocks(appointmentArray);
                } else {
                    availableTimeAdjustedEnd.add(duration, 'minutes');
                    timeObj.end = availableTimeAdjustedEnd.format('hh:mm a');
                }
            }

            var currentDateTime = moment().set({
                'year': moment(employeeDate).year(),
                'month': moment(employeeDate).month(),
                'date': moment(employeeDate).date(),
                'hour': moment(timeObj.time, 'hh:mm a').hour(),
                'minute': moment(timeObj.time, 'hh:mm a').minute(),
                'second': 0,
                'milliseconds': 0
            });
            var timeEnd = moment({
                'date': moment(employeeDate).date(),
                'year': moment(employeeDate).year(),
                'month': moment(employeeDate).month(),
                'hour': moment(timeObj.end, 'hh:mm a').hour(),
                'minutes': moment(timeObj.end, 'hh:mm a').minute(),
                'seconds': 00,
                'milliseconds': 00
            });
            var timeStart = moment({
                'date': moment(employeeDate).date(),
                'year': moment(employeeDate).year(),
                'month': moment(employeeDate).month(),
                'hour': moment(timeObj.time, 'hh:mm a').hour(),
                'minutes': moment(timeObj.time, 'hh:mm a').minute(),
                'seconds': 00,
                'milliseconds': 00
            });
            var dayEnd = moment({
                'date': moment(employeeDate).date(),
                'year': moment(employeeDate).year(),
                'month': moment(employeeDate).month(),
                'hour': moment(employeeAvailability.dayEnd).hour(),
                'minutes': moment(employeeAvailability.dayEnd).minute(),
                'seconds': moment(employeeAvailability.dayEnd).second()
            });
            if (moment(timeEnd.format()).isSameOrBefore(moment(dayEnd.format())) && !moment(timeStart.format()).isSameOrAfter(moment(timeEnd).format())
                && !moment(timeStart.format()).isSameOrAfter(moment(dayEnd.format())) && !currentDateTime.isBefore(moment())) {
                availableTimes.push(timeObj);
            }
        }
        return availableTimes;
    }

    return {
        createAvailableTimes: createAvailableTimes
    };
};
