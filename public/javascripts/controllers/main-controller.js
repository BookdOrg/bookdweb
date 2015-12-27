module.exports = function ($scope, businessFactory, $controller,$rootScope,NgMap) {
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

    //var $scope = this;
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
    if ($scope.businesses.length > 0) {
        generateMarkers($scope.businesses);
    }
    $scope.$watchCollection('businesses',function(newVal,oldVal){
        if(newVal !== oldVal){
            generateMarkers(newVal);
        }
    });

    if($scope.businesses.length == 0 && $rootScope.currLocation){
        $scope.center = $rootScope.currLocation.latitude + ',' + $rootScope.currLocation.longitude;
    }

    var navViewModel = $scope.$new();
    $controller('NavCtrl', {$scope: navViewModel});

    navViewModel.showSearch(true);
    $scope.$watch('currLocation',function(newVal,oldVal){
        if(newVal){
            $scope.center = $rootScope.currLocation.latitude + ',' + $rootScope.currLocation.longitude;
        }
    });
};
