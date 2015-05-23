angular.module('oddjob.post-controller',[])
.controller('PostsCtrl', [
'$scope',
'posts',
'post',
'auth',
'$sce',
function($scope, posts, post, auth,$sce){
  if(post.author.avatarVersion == undefined){
    post.image = $sce.trustAsHtml("<img src='http://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_50,r_10,w_50/v1432411957/profile/home-cat.jpg'>");
  }else{
    post.image = $sce.trustAsHtml(post.image);
  }

  for(var i=0; i<post.reviews.length;i++){
    console.log(post.reviews[i].author.avatarVersion)
    if(post.reviews[i].author.avatarVersion == undefined){
        post.reviews[i].image = $sce.trustAsHtml("<img src='http://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_50,r_10,w_50/v1432411957/profile/home-cat.jpg'>");
      }else{
        console.log(post.reviews[i])
        post.reviews[i].image = $sce.trustAsHtml(post.reviews[i].image);
      }
  }
  $scope.post = post;
  console.log(post)
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