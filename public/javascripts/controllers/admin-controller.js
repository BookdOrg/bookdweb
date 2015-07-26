angular.module('cc.admin-controller',[])
.controller('AdminCtrl', [
'$scope',
'$state',
'auth',
'adminService',
'pendingRequests',
function($scope, $state, auth,adminService,pendingRequests){
  $scope.pendingRequests = pendingRequests.data;

  $scope.updateRequest = function(request,pending,claimed){
  	request.pending = pending;
  	request.claimed = claimed;
  	adminService.changeStatus(request);
  }
}])
