/**
 * Created by Jonfor on 1/31/16.
 */
module.exports = function ($scope, auth) {
    $scope.reset = function () {
        auth.reset($scope.email);
    };
};
