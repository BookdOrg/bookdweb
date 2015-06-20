angular.module('oddjob.post-controller',[])
.controller('PostsCtrl', [
'$scope',
'posts',
'post',
'auth',
'$sce',
function($scope, posts, post, auth,$sce){
  $scope.cloudinaryBaseUrl = "http://res.cloudinary.com/dvvtn4u9h/image/upload/";
  $scope.authorImgTrans = "c_thumb,h_100,r_10,w_100/v";
  $scope.reviewImgTrans = "c_thumb,h_50,r_10,w_50/v";
  $scope.cloudinaryDefaultPic = "http://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_50,r_10,w_50/v1432411957/profile/placeholder.jpg";

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