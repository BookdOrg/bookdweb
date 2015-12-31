/**
 * Created by Jonfor on 12/31/15.
 */
module.exports = function (Notification, userFactory) {
    return {
        /**
         * Loops through all a businesses employees, makes a request to google to
         * retrieve the profile picture for employee's who authenticated with google+
         *
         * @param employeeArray - array of employee objects
         */
        getGooglePlusPhoto: function (employeeArray) {
            var indices = [];
            for (var employeeIndex = 0; employeeIndex < employeeArray.length; employeeIndex++) {
                if (employeeArray[employeeIndex].provider === 'google_plus') {
                    indices.push(employeeIndex);
                    userFactory.getGooglePhoto(employeeArray[employeeIndex].providerId)
                        .then(function (response) {
                            if (!response.error) {
                                employeeArray[indices.pop()].photo = response.image.url.replace('sz=50', 'sz=200');
                            } else {
                                console.log(response.error);
                            }
                        });
                }
            }
        }
    };
};