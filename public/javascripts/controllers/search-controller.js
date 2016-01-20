module.exports = function ($scope, businessFactory, $controller, $rootScope, NgMap, socketService) {

    var vm = this;
    $scope.businesses = businessFactory.businesses;

    $scope.hoveringOver = function (value) {
        $scope.overStar = value;
        $scope.percent = 100 * (value / $scope.max);
    };
    $scope.selectBusiness = function (business) {
        businessFactory.business = business;
    };
    $scope.max = 5;
    $scope.isReadonly = true;
    $scope.personalCenter = false;
    /**
     * Generate map markers based on the search results
     *
     * @param businesses - array of businesses returned thanks to Google :)
     */
    var generateMarkers = function (businesses) {
        $scope.business = businesses[0];
        $scope.positions = [];
        var boundsArray = [];
        if (angular.isDefined($rootScope.currLocation)) {
            boundsArray.push([$rootScope.currLocation.latitude, $rootScope.currLocation.longitude]);
        }
        for (var i = 0; i < businesses.length; i++) {
            var lat = businesses[i].geometry.location.lat;
            var lng = businesses[i].geometry.location.lng;
            var tempArray = [lat, lng];
            $scope.positions.push(tempArray);
            boundsArray.push(tempArray);
        }
        var bounds = new google.maps.LatLngBounds();
        for (var boundsIndex = 0; boundsIndex < boundsArray.length; boundsIndex++) {
            var latlng = new google.maps.LatLng(boundsArray[boundsIndex][0], boundsArray[boundsIndex][1]);
            bounds.extend(latlng);
        }
        NgMap.getMap().then(function (map) {
            vm.map = map;
            vm.map.setCenter(bounds.getCenter());
            vm.map.fitBounds(bounds);
        });
        //console.log("$scope.positions", $scope.positions);
    };
    //If there are results when we get to the page, generate markers
    if ($scope.businesses.length > 0) {
        generateMarkers($scope.businesses);
    }
    //Watch businesses, each time a user search they will change
    $scope.$watchCollection('businesses', function (newVal, oldVal) {
        if (newVal !== oldVal) {
            generateMarkers(newVal);
        }
    });
    //If there are no businesses and we have the users currentlocation, set the center of the map to be the users
    if ($scope.businesses.length == 0 && $rootScope.currLocation) {
        $scope.center = $rootScope.currLocation.latitude + ',' + $rootScope.currLocation.longitude;
        $scope.personalCenter = true;
    } else if ($scope.businesses.length > 0 && !$rootScope.currLocation) {
        $scope.center = $scope.businesses[0].geometry.location.lat + ',' + $scope.businesses[0].geometry.location.lng;
    }
    //Inject the navCtrl to use it's showSearch method
    var navViewModel = $scope.$new();
    $controller('NavCtrl', {$scope: navViewModel});

    //Watch the current location of the user
    $scope.$watch('currLocation', function (newVal, oldVal) {
        if (angular.isDefined(newVal)) {
            $scope.center = $rootScope.currLocation.latitude + ',' + $rootScope.currLocation.longitude;
            $scope.personalCenter = true;
        } else {
            $scope.center = '40.4867,-74.4444';
        }
    });

    $scope.$on('$destroy', function (event) {
        socketService.removeAllListeners();
    });

    $scope.showDetail = function (business) {
        $scope.business = business;
        if (vm.map) {
            vm.map.showInfoWindow('info', business.id);
        }
    };

    $scope.showDetailClicked = function (e, business) {
        $scope.business = business;
        vm.map.showInfoWindow('info', business.id);
        console.log(vm);
    };

    $scope.hideDetail = function () {
        vm.map.hideInfoWindow('info');
    };
};
