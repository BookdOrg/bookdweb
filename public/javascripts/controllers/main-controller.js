module.exports = function ($scope, businessFactory, $controller) {
    $scope.businesses = businessFactory.businesses;
    var navViewModel = $scope.$new();
    $controller('NavCtrl', {$scope: navViewModel});

    navViewModel.showSearch(true);
    $scope.$watch('currLocation', function (newVal, oldVal) {
        if (newVal) {
            //$scope.map = {center: {latitude: newVal.latitude, longitude: newVal.longitude}, zoom: 12};
            $scope.center = newVal.latitude + ',' + newVal.longitude;
        }
    });
    var vm = this;
    vm.positions = [];
    var generateMarkers = function(businesses) {
        vm.positions = [];
        var numMarkers = businesses.length;
        for (var i = 0; i < numMarkers; i++) {
            var lat = businesses[i].geometry.location.lat;
            var lng = businesses[i].geometry.location.lng;
            $scope.center = businesses[i].geometry.location.lat+','+businesses[i].geometry.location.lng;
            vm.positions.push({lat:lat, lng:lng});
        }
        console.log("vm.positions", vm.positions);
    };
    $scope.$watchCollection('businesses', function (newVal, oldVal) {
        if (newVal !== oldVal) {
            generateMarkers(newVal);

        }
        //if (!newVal && oldVal) {
        //    $scope.selectedQuery = oldVal;
        //}
        //
        //if ($scope.query.geometry) {
        //    $scope.center = $scope.query.geometry.location.lat() + ',' + $scope.query.geometry.location.lng();
        //}
    });
};
