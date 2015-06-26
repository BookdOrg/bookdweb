angular.module('oddjob.main-controller',["google.places"])
.controller('MainCtrl', [
'$scope',
'posts',
'auth',
'$modal',
'$log',
'$geolocation',
'$http',
'location',
function($scope, posts, auth,$modal,$log,$geolocation,$http,location){

  $scope.cloudinaryBaseUrl = "http://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_50,r_10,w_50/v";
  $scope.cloudinaryDefaultPic = "http://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_50,r_10,w_50/v1432411957/profile/placeholder.jpg";
  

  $scope.autocompleteOptions = {
    componentRestrictions: {country: 'us'},
    types:['geocode']
  }
  $geolocation.watchPosition({
        timeout: 60000,
        maximumAge: 250,
        enableHighAccuracy: true
      });
  $scope.myPosition = $geolocation.position;
  $scope.loadingLocation = true;
  $scope.$watch('myPosition.coords',function(newVal,oldVal){
    if(newVal !== oldVal){
      $http.get('http://maps.googleapis.com/maps/api/geocode/json?latlng='+newVal.latitude+","+newVal.longitude+"&sensor=true")
        .success(function(data){
          $scope.loadingLocation = false;
          location.setPosition(data.results[0]);
      });
    }
  })

  $scope.currLocation = location.getPosition();
  $scope.posts = posts.posts;
  $scope.recentPosts = posts.recentPosts;
  $scope.isLoggedIn = auth.isLoggedIn;

  $scope.animationsEnabled = true;

  $scope.open = function (size) {
    var modalInstance = $modal.open({
      animation: $scope.animationsEnabled,
      templateUrl: 'myModalContent.html',
      controller: 'ModalInstanceCtrl',
      size: size,
      // resolve: {
      //   userLoc: function(){
      //     return $scope.currLocation;
      //   }
      // }
    });

    modalInstance.result.then(function (selectedItem) {

    }, function () {
      // $log.info('Modal dismissed at: ' + new Date());
    });
  };

  $scope.myInterval = 5000;
  var slides = $scope.slides = [];

}])