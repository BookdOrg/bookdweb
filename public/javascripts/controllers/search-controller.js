module.exports = function ($scope, businessFactory, $controller, $rootScope, NgMap, socketService) {

    var vm = this;
    $scope.businesses = businessFactory.businesses;

    /**
     *
     * Enable this when we add is customer filtering
     *
     *
     * @type {google.maps.LatLngBounds}
     */
        //
        //$scope.filters = [
        //    {'name':'Location'},
        //    {'name':'Rating'}
        //];
        //
        //$scope.activeFilters = [];
        ///**
        // * Defines the settings we want to use in the angular-dropdown-multiselect
        // *
        // * Documentation can be found here: http://dotansimha.github.io/angularjs-dropdown-multiselect/#/
        // *
        // * @type {{displayProp: string, idProp: string, externalIdProp: string, smartButtonMaxItems: number, smartButtonTextConverter: Function}}
        // */
        //$scope.settings = {
        //    displayProp: 'name',
        //    idProp: 'name',
        //    externalIdProp: 'name',
        //    showCheckAll: false,
        //    selectionLimit:1,
        //    showUncheckAll:false,
        //    smartButtonMaxItems: 3,
        //    smartButtonTextConverter: function (itemText, originalItem) {
        //        return itemText;
        //    }
        //};
        //
        //$scope.customTexts = {
        //    buttonDefaultText: 'Filter By'
        //};

    $scope.hoveringOver = function (value) {
        $scope.overStar = value;
        $scope.percent = 100 * (value / $scope.max);
    };

    $scope.max = 5;
    $scope.isReadonly = true;
    /**
     * Generate map markers based on the search results
     *
     * @param businesses - array of businesses returned thanks to Google :)
     */
    var generateMarkers = function (businesses) {
        console.log('HereeRere');
        $scope.business = businesses[0];
        $scope.positions = [];
        var boundsArray = [];
        boundsArray.push([$rootScope.currLocation.latitude, $rootScope.currLocation.longitude]);
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
    }
    //Inject the navCtrl to use it's showSearch method
    var navViewModel = $scope.$new();
    $controller('NavCtrl', {$scope: navViewModel});

    navViewModel.showSearch(true);
    //Watch the current location of the user
    $scope.$watch('currLocation', function (newVal, oldVal) {
        if (newVal) {
            $scope.center = $rootScope.currLocation.latitude + ',' + $rootScope.currLocation.longitude;
        }
    });

    $scope.$on('$destroy', function (event) {
        socketService.removeAllListeners();
    });

    $scope.showDetail = function (business) {
        $scope.business = business;
        vm.map.showInfoWindow('info', business.id);
    };

    $scope.showDetailClicked = function (e, business) {
        $scope.business = business;
        vm.map.showInfoWindow('info', business.id);
    };

    $scope.hideDetail = function () {
        vm.map.hideInfoWindow('info');
    };
};
