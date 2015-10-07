angular.module('cc.profile-controller',[])
.controller('ProfileCtrl',['$scope','auth','user','$location','$sce','FileUploader','$state','$stateParams',
	function($scope,auth,user,$location,$sce,FileUploader,$state,$stateParams){
		$scope.hoveringOver = function(value) {
			$scope.overStar = value;
			$scope.percent = 100 * (value / $scope.max);
		};
		$scope.max = 5;
		$scope.isReadonly = false;
		$scope.rate= 2.5;
		user.get($stateParams.username).then(function(data){
			$scope.currentUser = data.data.user;
			// $scope.currentUser.posts = myPosts.data.posts;
			// if(data.data.user.avatarVersion == undefined){
			// 	$scope.currentUser.image = $sce.trustAsHtml("<img src='http://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_100,r_10,w_100/v1432411957/profile/home-cat.jpg'>");
			// }else{
			// 	$scope.currentUser.image= $sce.trustAsHtml(data.data.image);
			// }
			// if($scope.currentUser._id === auth.currentUser()._id){
			// 	$scope.myProfile = true;
			// }
		});
}])