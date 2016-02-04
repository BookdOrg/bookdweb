/**
 * Created by Jonfor on 2/1/16.
 */
module.exports = function ($scope, auth, $location, $state) {
    $scope.newPassword = function () {
        //http://localhost:3002/reset/fc1e442999db2adfe27e7ea598c184e66dbe7878
        // The token will be the third item in the array after splitting (see above example URL).
        var token = $location.path().split('/')[2];
        auth.newPassword($scope.password, token).then(
            function (data) {
                $state.go('landing');
            }, function (error) {
                $scope.error = error.error;
            });
    };
};
