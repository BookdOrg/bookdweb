/**
 * Created by Jonfor on 1/31/16.
 */
module.exports = function ($scope, auth) {
    $scope.emailSent = false;
    $scope.reset = function () {
        auth.reset($scope.email).then(
            function (data) {
                $scope.emailSent = true;
            }, function (err) {
                $scope.error = err;
            });
    };
};
