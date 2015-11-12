angular.module('cc.dashboard-controller', [])
    .controller('dashboardCtrl', [
        '$scope',
        '$state',
        'auth',
        'user',
        'businessFactory',
        'socket',
        function ($scope, $state, auth, user, businessFactory,socket) {
            if(user.dashboard.length > 0){
                $scope.businesses = user.dashboard;
            }
            $scope.setBusiness = function (business) {
                businessFactory.business = business;
            };
            //$scope.pushDeal = function(deal,location){
            //    deal.location = location;
            //    socket.emit('newDeal',deal);
            //};
        }]);
