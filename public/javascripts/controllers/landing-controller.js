angular.module('cc.landing-controller',[])
.controller('landingCtrl', [
'$scope',
'auth',
function($scope,auth){
  $scope.currentUser = auth.currentUser();
  
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

}])