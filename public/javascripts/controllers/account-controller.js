angular.module('cc.account-controller',[])
.controller('AccountCtrl',['$scope','auth','user','$location','$sce','FileUploader','$state','$stateParams','$rootScope',
	function($scope,auth,user,$location,$sce,FileUploader,$state,$stateParams,$rootScope){
		var uploader = $scope.uploader = new FileUploader({
			url: '/upload',
			headers:{
				Authorization: 'Bearer '+auth.getToken()
			}
		});
		$scope.showLoader = false;
		uploader.onAfterAddingFile = function(item){
			$scope.showLoader = true;
		}
		uploader.onCompleteItem = function(item){
			uploader.removeFromQueue(item);
		}
		uploader.onSuccessItem = function(item,response,status,header){
			auth.saveToken(response.token);
			$rootScope.currentUser = auth.currentUser();
			$scope.showLoader = false;
		}
		uploader.filters.push({
            name: 'imageFilter',
            fn: function(item /*{File|FileLikeObject}*/, options) {
                var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
                return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
            }
        });
}])