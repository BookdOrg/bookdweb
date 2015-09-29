angular.module('cc.search-controller',[])
.controller('searchCtrl', [
'$scope',
'$state',
'auth',
'businessFactory',
'$modal',
function($scope, $state, auth,businessFactory,$modal){
	/**
	 *
	 */
	$scope.$watch('query',function(newVal,oldVal){
		if(newVal !== oldVal){
			$scope.selectedQuery = $scope.query;
		}
		if(!newVal && oldVal){
			$scope.selectedQuery = oldVal;
		}
	})

	businessFactory.getCategories().then(function(data){
		$scope.categoryOptions = data.data;
	})
	$scope.autocompleteOptions = {
		componentRestrictions: {country: 'us'},
		types:['establishment']
	}
	/**
	 *
	 */
	$scope.search = function(){
		businessFactory.search($scope.query)
			.then(function(data){
				$scope.queryResults = data.data.results;
		})
	}
	/**
	 *
	 * @param request
	 */
	$scope.claim = function(request){
		var claimRequest = {};
		claimRequest.now = moment().format('MMM Do YYYY, h:mm:ss a');
		claimRequest.category = request.category;
		claimRequest.placesId = request.place_id;
		businessFactory.claim(claimRequest)
			.then(function(data){
				$modal.open({
					templateUrl: 'myModalContent.html',
					controller: 'ModalInstanceCtrl',
					resolve:{
						message:function(){
							return data;
						},
						info:function(){
							return request;
						}
					}
				});
			},
			function(error){
				$modal.open({
					templateUrl: 'myModalContent.html',
					controller: 'ModalInstanceCtrl',
					resolve:{
						message:function(){
							return error;
						},
						info:function(){
							return request;
						}
					}
				});
			}
		)
	}

}])
