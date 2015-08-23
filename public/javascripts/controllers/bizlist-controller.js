angular.module('cc.bizlist-controller',[])
.controller('bizlistCtrl', [
'$scope',
'auth',
'$stateParams',
'businessFactory',
function($scope, auth, $stateParams,businessFactory){
	var location = $stateParams.location;
	var category = $stateParams.cat;

	$scope.cat = category;

	businessFactory.getBusinessList(category,location)
		.then(function(data){
			$scope.businesses = data.data;
		})
}])