angular.module('cc.admin-controller',[])
.controller('AdminCtrl', [
'$scope',
'$state',
'auth',
'businessFactory',
'pendingRequests',
function($scope, $state, auth,businessFactory,pendingRequests){
    $scope.pendingRequests = pendingRequests.data;
    /**
     *
     * @param request
     * @param pending
     * @param claimed
     */
    $scope.updateRequest = function(request,pending,claimed){
        request.pending = pending;
        request.claimed = claimed;
        businessFactory.changeStatus(request);
    }
}])
