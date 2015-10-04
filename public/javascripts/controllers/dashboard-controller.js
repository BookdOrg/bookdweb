angular.module('cc.dashboard-controller',[])
.controller('dashboardCtrl', [
'$scope',
'$state',
'auth',
'businesses',
'businessFactory',
function($scope, $state, auth,businesses,businessFactory){
    $scope.businesses = businesses.data;
    $scope.setBusiness = function(business){
        businessFactory.business = business;
    }
}])
