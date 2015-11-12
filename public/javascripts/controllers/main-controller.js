angular
    .module('cc.main-controller', ['google.places'])
    .controller('MainCtrl', ['$scope', 'businessFactory', '$controller','socket','$rootScope','location',
        function ($scope, businessFactory, $controller,socket,$rootScope,location) {
            $scope.businesses = businessFactory.businesses;
            var navViewModel = $scope.$new();
            $controller('NavCtrl', {$scope: navViewModel});

            navViewModel.showSearch(true);
            $scope.$watch('currLocation',function(newVal,oldVal){
                if(newVal){
                    $scope.map = { center: { latitude: newVal.latitude, longitude:newVal.longitude  }, zoom: 12 };
                }
            })
            //socket.on('incomingData',function(data){
            //socket.on('incomingData',function(data){
            //    console.log(data)
            //   $scope.feed = data;
            //});
        }]);
