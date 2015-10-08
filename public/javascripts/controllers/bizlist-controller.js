angular.module('cc.bizlist-controller', [])
    .controller('bizlistCtrl', [
        '$scope',
        'auth',
        '$stateParams',
        'businessFactory',
        function ($scope, auth, $stateParams, businessFactory) {
            var location = $stateParams.location;
            var category = $stateParams.cat;
            $scope.cat = category;
            var radius = '5000';
            businessFactory.getNearby(category, location, radius)
                .then(function (data) {
                    $scope.businesses = data.data;
                });

            $scope.setBusiness = function (business) {
                businessFactory.business = business;
            };

        }]);