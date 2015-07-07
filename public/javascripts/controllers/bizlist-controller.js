angular.module('cc.bizlist-controller',[])
.controller('bizlistCtrl', [
'$scope',
'auth',
'$state',
'location',
'MyYelpAPI',
'$stateParams',
'businessService',
function($scope, auth, $state,location,MyYelpAPI,$stateParams,businessService){
	$scope.cat = $stateParams.cat;
	var businesses = [];
	$scope.getNumber = function(num){
		if(num){
			return new Array(num);
		}
		
	}
	MyYelpAPI.retrieveYelp('',$stateParams.cat,$stateParams.location,$stateParams.cll,function(data) {
	    console.log(data.businesses)
	    $scope.businesses = data.businesses;
  	});
}])