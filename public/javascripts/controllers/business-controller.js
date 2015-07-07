angular.module('cc.business-controller',[])
.controller('businessCtrl', [
'$scope',
'auth',
'$state',
'location',
'MyYelpAPI',
'$stateParams',
function($scope, auth, $state,location,MyYelpAPI,$stateParams){
	// console.log($stateParams)
	// MyYelpAPI.retrieveYelp('',$stateParams.cat,$stateParams.location,$stateParams.cll,function(data) {
	//     console.log(data.businesses)
	//     $scope.businesses = data.businesses;

 //  	});
}])