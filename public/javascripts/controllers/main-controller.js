module.exports = function ($scope, businessFactory, $controller,$rootScope) {
    $scope.businesses = businessFactory.businesses;

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
    generateMarkers($scope.businesses);
    var navViewModel = $scope.$new();
    $controller('NavCtrl', {$scope: navViewModel});

    navViewModel.showSearch(true);
    $scope.$watch('currLocation',function(newVal,oldVal){
        if(newVal){
            $scope.position = $rootScope.currLocation;
            if($scope.businesses.length == 0){
                $scope.center = $scope.position.latitude + ',' + $scope.position.longitude;
            }
        }
    });
};
