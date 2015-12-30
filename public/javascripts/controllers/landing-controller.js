module.exports = function ($scope, $controller,$state) {
    $scope.navbarCollapsed = true;

    $scope.myInterval = 5000;
    var slides = $scope.slides = [];
    $scope.addSlide = function (i) {
        //var newWidth = 750 + slides.length + 1;
        slides.push({
            image: '/images/'+i+'.jpg',
            text: ['More', 'Extra', 'Lots of', 'Surplus'][slides.length % 4]
        });
    };
    for (var i = 0; i < 2; i++) {
        $scope.addSlide(i);
    }

    var navViewModel = $scope.$new();
    $controller('NavCtrl', {$scope: navViewModel});
    $scope.openSignup = function (type, state) {
        navViewModel.open(type, state);
    };
};