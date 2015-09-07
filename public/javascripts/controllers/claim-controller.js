angular.module('cc.claim-controller',[])
.controller('claimController', [
'$scope',
'auth',
'$state',
'location',
'$stateParams',
'businessFactory',
'claimInfo',
'$rootScope',
function($scope, auth, $state,location,$stateParams,businessFactory,claimInfo,$rootScope){
	// $scope.currentUser = auth.currentUser();
	$scope.business = claimInfo.data;

	$scope.createClaim = function(){
	    var now = moment().format('MMM Do YYYY, h:mm:ss a');
	    // if(!$scope.title) {console.log("empty"); return; }
	    businessFactory.create({
	      firstName: $rootScope.currentUser.firstName,
	      lastName: $rootScope.currentUser.lastName,
	      id: $scope.business.id,
	      businessName: $scope.business.name,
	      pPhoneNumber: $rootScope.currentUser.phone,
	      bPhoneNumber:$scope.business.phone,
	      email: $scope.currentUser.email,
	      location: {
	      	address: $scope.business.location.address[0],
	      	city: $scope.business.location.city,
	      	country_code: $scope.business.location.country_code,
	      	postal_code: $scope.business.location.postal_code,
	      	state_code: $scope.business.location.state_code,
	      	coordinate:{
	      		latitude: $scope.business.location.coordinate.latitude,
	      		longitude: $scope.business.location.coordinate.longitude
	      	}
	      },
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