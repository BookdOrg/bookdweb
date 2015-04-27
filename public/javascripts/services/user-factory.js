angular.module('oddjob.user-factory',[])
.factory('user',['$http','auth',function($http,auth){
	var o = {};

	o.get = function(id){
		return $http.get('/profile',{
			headers:{Authorization: 'Bearer '+auth.getToken()}
		})
		.then(function(res){
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