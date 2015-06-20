angular.module('oddjob.main-controller',[])
.controller('MainCtrl', [
'$scope',
'posts',
'auth',
'$modal',
'$log',
'$geolocation',
'$http',
'location',
'places',
function($scope, posts, auth,$modal,$log,$geolocation,$http,location,places){

  $scope.cloudinaryBaseUrl = "http://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_50,r_10,w_50/v";
  $scope.cloudinaryDefaultPic = "http://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_50,r_10,w_50/v1432411957/profile/placeholder.jpg";
  
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
          console.log(data.results[0])
      });
    }
  })

  places.getSuggestion("pisca");

  $scope.currLocation = location.getPosition();
  $scope.posts = posts.posts;

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
  // $scope.addSlide = function() {
  //   var newWidth = 600 + slides.length + 1;
  //   slides.push({
  //     image: 'http://placehold.it/' + newWidth + 'x300',
  //     text: ['More','Extra','Lots of','Surplus'][slides.length % 4] + ' ' +
  //       ['Cats', 'Kittys', 'Felines', 'Cutes'][slides.length % 4]
  //   });
  // };
  // for (var i=0; i<4; i++) {
  //   $scope.addSlide();
  // }

}])