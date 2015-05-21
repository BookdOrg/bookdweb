angular.module('oddjob.main-controller',[])
.controller('MainCtrl', [
'$scope',
'posts',
'auth',
'$sce',
function($scope, posts, auth,$sce){
  for(var i =0; i<posts.posts.length; i++){
    posts.posts[i].image = $sce.trustAsHtml(posts.posts[i].image);
  }
  $scope.posts = posts.posts;

  $scope.isLoggedIn = auth.isLoggedIn;

  $scope.addPost = function(){
    var now = moment().format('MMM Do YYYY, h:mm:ss a');
    if($scope.title === '') { return; }
    posts.create({
      title: $scope.title,
      description: $scope.description,
      location: $scope.location,
      rate: $scope.rate,
      startDate: $scope.startDate,
      endDate: $scope.endDate,
      timestamp: now
    });
    
    $scope.title = '';
    $scope.description = '';
    $scope.location = '';
    $scope.rate = '';
    $scope.startDate = '';
    $scope. endDate = '';

    window.location.reload();
  };

  // $scope.incrementUpvotes = function(post) {
  //   posts.upvote(post);
  // };

}])