module.exports = function ($scope, $controller) {
    $scope.navbarCollapsed = true;

    //Inject the navView controller so we can call the openSignup modal
    var navViewModel = $scope.$new();
    $controller('NavCtrl', {$scope: navViewModel});
    $scope.openSignup = function (type, state) {
        navViewModel.open(type, state);
    };
};