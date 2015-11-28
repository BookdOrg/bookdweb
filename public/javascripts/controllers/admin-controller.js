module.exports = function ($scope, $state, auth, businessFactory) {

    businessFactory.getRequests()
        .then(function () {
            $scope.pendingRequests = businessFactory.requests;
        });

    $scope.updateRequest = function (request, pending, claimed) {
        request.pending = pending;
        request.claimed = claimed;
        businessFactory.changeStatus(request)
            .then(function () {
                businessFactory.getRequests();
            });
    }
};