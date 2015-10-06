/**
 * Created by khalilbrown on 10/5/15.
 */
angular.module('cc.appointments-controller',[])
    .controller('appointmentsCtrl', [
        '$scope',
        '$state',
        'auth',
        'appointments',
    function($scope, $state,auth,appointments){
        $scope.appointments = appointments.data;
    }])
