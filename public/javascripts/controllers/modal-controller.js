// Please note that $modalInstance represents a modal window (instance) dependency.
// It is not the same as the $modal service used above.

angular.module('oddjob.modalInstance',[])
.controller('ModalInstanceCtrl', function ($scope, $modalInstance,auth,$state,userLoc) {
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currLocation = userLoc;

  $scope.addPost = function(){
    var now = moment().format('MMM Do YYYY, h:mm:ss a');
    if(!$scope.title) {console.log("empty"); return; }
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

    $modalInstance.close();
    $state.go('home',{},{reload:true});
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
});