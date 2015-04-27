angular.module('oddjob.profile-controller',[])
.controller('ProfileCtrl',['$scope','auth','user','$location','FileUploader',
	function($scope,auth,user,$location, FileUploader){
		$scope.currentUser = auth.currentUser();
		function loadProfile(){
			user.get().then(function(data){
				$scope.profilePic = data.image;
			});
		}
		loadProfile();

		var uploader = $scope.uploader = new FileUploader({
			url: '/upload',
			queueLimit: 1,
			headers:{
				Authorization: 'Bearer '+auth.getToken()
			}
		});
		uploader.onSuccessItem = function(item){
			loadProfile();
		}

		uploader.filters.push({
            name: 'imageFilter',
            fn: function(item /*{File|FileLikeObject}*/, options) {
                var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
                return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
            }
        });
}])