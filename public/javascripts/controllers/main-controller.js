angular.module('oddjob.main-controller',[])
.controller('MainCtrl', [
'$scope',
'posts',
'auth',
function($scope, posts, auth){
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
  };

  // $scope.incrementUpvotes = function(post) {
  //   posts.upvote(post);
  // };

}])