module.exports = function ($scope, businessFactory, $controller) {
    $scope.businesses = businessFactory.businesses;
    var navViewModel = $scope.$new();
    $controller('NavCtrl', {$scope: navViewModel});

    navViewModel.showSearch(true);
    $scope.$watch('currLocation', function (newVal, oldVal) {
        if (newVal) {
            $scope.map = {center: {latitude: newVal.latitude, longitude: newVal.longitude}, zoom: 12};
        }
    });
};
