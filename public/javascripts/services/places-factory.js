angular.module('oddjob.places-factory',[])
.factory('places', ['$http','auth', function($http,auth){
	var key= "AIzaSyBEfPgu646Z7Irg0mBMurhhTJsRb5FcQgA"
	var url = "//maps.googleapis.com/maps/api/place/queryautocomplete/json?key="+key;
	var places ={
		getSuggestion:function(input){
			return $http.get(url+"&input="+input,{
			}).then(function(data){
				console.log(data);
				return data;
				// angular.copy(data,o.suggestions)
			})
		}
	}
	return places;

}]);