angular.module('cc.user-factory',[])
.factory('user',['$http','auth',function($http,auth){
	var o = {};

	o.get = function(username){
		return $http.get('/profile',{
			params:{
				username:username,
			},
			headers:{Authorization: 'Bearer '+auth.getToken(),'Content-Type':'application/x-www-form-urlencoded'}
		})
		.success(function(res){
			// angular.copy(res.data, o.user)
			return res.data;
		});
	}

	o.postPicture = function(){
		return $http.post('/upload')
		.success(function(data){

		})
	}
	o.getPicture = function(){
		return $http.get('/getpic',{
			headers:{Authorization: 'Bearer '+auth.getToken()}
		})
		.success(function(data){
			return data;
		})
	}
	return o;
}])