angular.module('oddjob.post-controller',[])
.controller('PostsCtrl', [
'$scope',
'posts',
'post',
'auth',
'$sce',
function($scope, posts, post, auth,$sce){
  post.image = $sce.trustAsHtml(post.image);
  for(var i=0; i<post.reviews.length;i++){
    post.reviews[i].image = $sce.trustAsHtml(post.reviews[i].image);
  }
  $scope.post = post;
  $scope.isLoggedIn = auth.isLoggedIn;

  $scope.addReview = function(){
    var now = moment().format('MMM Do YYYY, h:mm:ss a');
    if($scope.body === '') { return; }
    posts.addReview(post._id, {
      body: $scope.body,
      timestamp: now
    }).success(function(review) {
      $scope.post.reviews.push(review);
    });
    $scope.body = '';
    window.location.reload();
  };
}])