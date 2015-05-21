angular.module('oddjob.profile-controller',[])
.controller('ProfileCtrl',['$scope','auth','user','$location','$sce','FileUploader','$state',
	function($scope,auth,user,$location,$sce,FileUploader,$state){
		$scope.currentUser = auth.currentUser();

		user.get().then(function(data){
			$scope.currentUser.image= $sce.trustAsHtml(data.data.image);
		});
		var uploader = $scope.uploader = new FileUploader({
			url: '/upload',
			queueLimit: 1,
			headers:{
				Authorization: 'Bearer '+auth.getToken()
			}
		});
		// uploader.onCompleteItem = function(item){
		// 	window.location.reload();
		// }

		uploader.filters.push({
            name: 'imageFilter',
            fn: function(item /*{File|FileLikeObject}*/, options) {
                var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
                return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
            }
        });
}])