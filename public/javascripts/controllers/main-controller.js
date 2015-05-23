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

  // $scope.addPost = function(){
  //   var now = moment().format('MMM Do YYYY, h:mm:ss a');
  //   if(!$scope.title) {console.log("empty"); return; }
  //   posts.create({
  //     title: $scope.title,
  //     description: $scope.description,
  //     location: $scope.location,
  //     rate: $scope.rate,
  //     startDate: $scope.startDate,
  //     endDate: $scope.endDate,
  //     timestamp: now
  //   });
    
  //   $scope.title = '';
  //   $scope.description = '';
  //   $scope.location = '';
  //   $scope.rate = '';
  //   $scope.startDate = '';
  //   $scope. endDate = '';

  //   posts.getAll().then(function(data){
  //     safeImage(posts);
  //     $scope.posts = posts.posts;
  //   })
  // };
}])