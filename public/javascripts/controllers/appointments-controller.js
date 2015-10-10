/**
 * Created by khalilbrown on 10/5/15.
 */
angular.module('cc.appointments-controller', [])
    .controller('appointmentsCtrl', [
        '$scope',
        '$state',
        'auth',
        'user',
        function ($scope, $state, auth, user) {
            $scope.appointments = user.appointments;
        }]);
