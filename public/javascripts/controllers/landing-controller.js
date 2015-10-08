angular.module('cc.landing-controller',[])
    .controller('landingCtrl', [
    '$scope',
    '$geolocation',
    '$http',
    '$state',
    'location',
    'businessFactory',
    '$rootScope',
      function($scope,$geolocation,$http,$state,location,businessFactory,$rootScope){
          $scope.navbarCollapsed = true;

          $scope.myInterval = 5000;
          var slides = $scope.slides = [];
          $scope.addSlide = function() {
              var newWidth = 600 + slides.length + 1;
              slides.push({
                  image: 'http://placehold.it/' + newWidth + 'x300',
                  text: ['More','Extra','Lots of','Surplus'][slides.length % 4]
              });
          };
          for (var i=0; i<4; i++) {
              $scope.addSlide();
          }
      }]);