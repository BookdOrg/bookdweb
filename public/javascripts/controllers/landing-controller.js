module.exports = function ($scope, $controller) {
    $scope.navbarCollapsed = true;

    //Inject the navView controller so we can call the openSignup modal
    var navViewModel = $scope.$new();
    $controller('NavCtrl', {$scope: navViewModel});
    $scope.openSignup = function (type, state) {
        navViewModel.open(type, state);
    };
    $scope.myInterval = 10000;
    $scope.noWrapSlides = false;
    $scope.active = 0;

    $scope.slides = [
        {
            image: '/images/masc.jpg',
            id: 0,
            style: 'center center'
        }, {
            image: '/images/fem.jpg',
            id: 1,
            style: 'center bottom'
        }
    ]
};