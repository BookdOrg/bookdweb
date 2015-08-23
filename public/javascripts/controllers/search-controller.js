angular.module('cc.search-controller',[])
.controller('searchCtrl', [
'$scope',
'$state',
'auth',
'businessFactory',
function($scope, $state, auth,businessFactory){

	$scope.$watch('query',function(newVal,oldVal){
		if(newVal !== oldVal){
			$scope.selectedQuery = $scope.query;
		}
		if(!newVal && oldVal){
			console.log("here")
			$scope.selectedQuery = oldVal;
		}
	})
	businessFactory.getCategories().then(function(data){
		$scope.categoryOptions = data.data;
	})

	$scope.search =function(){
		businessFactory.query($scope.query)
			.then(function(data){
				$scope.queryResults = data.data.results;
		})
	}

}])
