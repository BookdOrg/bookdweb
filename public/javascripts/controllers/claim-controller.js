angular.module('cc.claim-controller',[])
.controller('claimController', [
'$scope',
'auth',
'$state',
'location',
'$stateParams',
'businessFactory',
'claimInfo',
function($scope, auth, $state,location,$stateParams,businessFactory,claimInfo){
	$scope.currentUser = auth.currentUser();
	$scope.business = claimInfo.data;

	$scope.createClaim = function(){
	    var now = moment().format('MMM Do YYYY, h:mm:ss a');
	    // if(!$scope.title) {console.log("empty"); return; }
	    businessFactory.create({
	      firstName: $scope.currentUser.firstName,
	      lastName: $scope.currentUser.lastName,
	      id: $scope.business.id,
	      businessName: $scope.business.name,
	      pPhoneNumber: $scope.currentUser.phone,
	      bPhoneNumber:$scope.business.phone,
	      email: $scope.currentUser.email,
	      location: $scope.business.location,
	      image: $scope.business.image_url,
	      rating: $scope.business.rating,
	      timestamp: now
	    });
	    
	    // $scope.title = '';
	    // $scope.description = '';
	    // $scope.location = '';
	    // $scope.rate = '';
	    // $scope.startDate = '';
	    // $scope. endDate = '';
	    $state.go('home');
  	};
}])