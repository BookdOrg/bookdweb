module.exports = function ($scope, $state, auth, userFactory, businessFactory) {
    if (userFactory.dashboard.length > 0) {
        $scope.businesses = userFactory.dashboard;
    }
    $scope.setBusiness = function (business) {
        businessFactory.business = business;
    };
};
