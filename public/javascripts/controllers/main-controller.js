angular.module('oddjob.main-controller',[])
.controller('MainCtrl', [
'$scope',
'posts',
'auth',
'$sce',
'$modal',
'$log',
function($scope, posts, auth,$sce,$modal,$log){

  var safeImage = function(posts){
    for(var i =0; i<posts.posts.length; i++){
      posts.posts[i].image = $sce.trustAsHtml(posts.posts[i].image.toString());
    }
  }
  safeImage(posts);
  $scope.posts = posts.posts;

  $scope.isLoggedIn = auth.isLoggedIn;

  $scope.animationsEnabled = true;

  $scope.open = function (size) {

    var modalInstance = $modal.open({
      animation: $scope.animationsEnabled,
      templateUrl: 'myModalContent.html',
      controller: 'ModalInstanceCtrl',
      size: size,
      resolve: {}
    });

    modalInstance.result.then(function (selectedItem) {

    }, function () {
      $log.info('Modal dismissed at: ' + new Date());
    });
  };

  $scope.myInterval = 5000;
  var slides = $scope.slides = [];
  $scope.addSlide = function() {
    var newWidth = 600 + slides.length + 1;
    slides.push({
      image: 'http://placekitten.com/' + newWidth + '/300',
      text: ['More','Extra','Lots of','Surplus'][slides.length % 4] + ' ' +
        ['Cats', 'Kittys', 'Felines', 'Cutes'][slides.length % 4]
    });
  };
  for (var i=0; i<4; i++) {
    $scope.addSlide();
  }

}])