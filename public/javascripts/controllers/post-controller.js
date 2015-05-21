angular.module('oddjob.post-controller',[])
.controller('PostsCtrl', [
'$scope',
'posts',
'post',
'auth',
'$sce',
function($scope, posts, post, auth,$sce){
  post.image = $sce.trustAsHtml(post.image);
  for(var i=0; i<post.comments.length;i++){
    post.comments[i].image = $sce.trustAsHtml(post.comments[i].image);
  }
  $scope.post = post;
  $scope.isLoggedIn = auth.isLoggedIn;

  $scope.addComment = function(){
    var now = moment().format('MMM Do YYYY, h:mm:ss a');
    if($scope.body === '') { return; }
    posts.addComment(post._id, {
      body: $scope.body,
      author: 'user',
      timestamp: now
    }).success(function(comment) {
      $scope.post.comments.push(comment);
    });
    $scope.body = '';
    window.location.reload();
  };
}])