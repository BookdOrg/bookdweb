angular.module('oddjob.profile-controller',[])
.controller('ProfileCtrl',['$scope','auth','user','$location','$sce','FileUploader','$state','$stateParams',
	function($scope,auth,user,$location,$sce,FileUploader,$state,$stateParams){

		$scope.myProfile = false;
		user.get($stateParams.id).then(function(data){
			$scope.currentUser = data.data.user;
			$scope.currentUser.image= $sce.trustAsHtml(data.data.image);
			if($scope.currentUser._id === auth.currentUser()._id){
				$scope.myProfile = true;
			}

		});

		var uploader = $scope.uploader = new FileUploader({
			url: '/upload',
			queueLimit: 1,
			headers:{
				Authorization: 'Bearer '+auth.getToken()
			}
		});
		uploader.onSuccessItem = function(item){
			setTimeout(function(){
				window.location.reload();
			},300)
		}

		uploader.filters.push({
            name: 'imageFilter',
            fn: function(item /*{File|FileLikeObject}*/, options) {
                var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
                return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
            }
        });
}])