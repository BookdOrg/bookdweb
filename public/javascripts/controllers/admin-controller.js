angular.module('cc.admin-controller', [])
    .controller('AdminCtrl', [
        '$scope',
        '$state',
        'auth',
        'businessFactory',
//'pendingRequests',
        function ($scope, $state, auth, businessFactory) {
            businessFactory.getRequests()
                .then(function () {
                    $scope.pendingRequests = businessFactory.requests;
                });
            /**
             *
             * @param request
             * @param pending
             * @param claimed
             */
            $scope.updateRequest = function (request, pending, claimed) {
                request.pending = pending;
                request.claimed = claimed;
                businessFactory.changeStatus(request)
                    .then(function () {
                        businessFactory.getRequests();
                    });
            }
        }]);
