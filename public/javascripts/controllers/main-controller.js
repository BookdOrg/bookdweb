module.exports = function ($scope, businessFactory, $controller,$rootScope,NgMap) {
    $scope.businesses = businessFactory.businesses;

    //var $scope = this;
    $scope.positions = [];
    var bounds = new google.maps.LatLngBounds();
    var generateMarkers = function(businesses) {
        $scope.positions = [];
        for (var i = 0; i < businesses.length; i++) {
            var lat = businesses[i].geometry.location.lat;
            var lng = businesses[i].geometry.location.lng;
            var tempArray = [lat,lng];
            $scope.positions.push(tempArray);
        }
        for (var boundsIndex=0; i<$scope.positions.length; boundsIndex++) {
            var latlng = new google.maps.LatLng($scope.positions[boundsIndex][0], $scope.positions[boundsIndex][1]);
            bounds.extend(latlng);
        }
        //TODO get the bounds to work!
        //NgMap.getMap().then(function(map) {
        //    map.setCenter(bounds.getCenter());
        //    map.fitBounds(bounds);
        //});
        //console.log("$scope.positions", $scope.positions);
    };

    $scope.$watchCollection('businesses',function(newVal,oldVal){
        if(newVal !== oldVal){
            generateMarkers(newVal);
        }
    });


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
