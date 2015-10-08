angular.module('cc.account-controller',[])
.controller('AccountCtrl',['$scope','auth','user','$location','$sce','FileUploader','$state','$stateParams','$rootScope',
	function($scope,auth,user,$location,$sce,FileUploader,$state,$stateParams,$rootScope){
		var uploader = $scope.uploader = new FileUploader({
			url: '/upload',
			queueLimit: 1,
			headers:{
				Authorization: 'Bearer '+auth.getToken()
			}
		});
		uploader.onSuccessItem = function(item,response,status,header){
			auth.saveToken(response.token);
			$rootScope.currentUser = auth.currentUser();
		}
		uploader.filters.push({
            name: 'imageFilter',
            fn: function(item /*{File|FileLikeObject}*/, options) {
                var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
                return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
            }
        });
}])