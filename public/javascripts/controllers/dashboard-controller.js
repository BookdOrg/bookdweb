module.exports = function ($scope, $state, auth, user, businessFactory) {
    if (user.dashboard.length > 0) {
        $scope.businesses = user.dashboard;
    }
    $scope.setBusiness = function (business) {
        businessFactory.business = business;
    };
};
