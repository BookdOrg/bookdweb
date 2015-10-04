angular.module('cc.dashboard-controller',[])
.controller('dashboardCtrl', [
'$scope',
'$state',
'auth',
'businesses',
function($scope, $state, auth,businesses){
    $scope.businesses = businesses.data;
}])
