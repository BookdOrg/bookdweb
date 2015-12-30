module.exports = function ($scope, $controller, $state, $timeout, $interval) {
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

    $scope.sound = new Audio('https://s3.amazonaws.com/moovweb-marketing/playground/harlem-shake.mp3');
    $scope.shake = function () {
        $scope.sound.play();

        $interval(function () {
            //$( '#location' ).toggle( "pulsate" );
            $('#location').toggle("explode");
            $("#search").toggle('explode');
            $("#intro").toggle("scale");
            $("#btnn").toggle("explode");
        }, 410);

        $timeout(function () {
            $interval(function () {
                $('body').effect('shake', {times: 100, distance: 20});
            }, 1000);
        }, 14500);
    };
};