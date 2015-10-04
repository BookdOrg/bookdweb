/*
 * Created by: Khalil Brown
 *
 * All Routes under the /user end point
 */
angular.module('cc.user-factory',[])
.factory('user',['$http','auth',function($http,auth){
	var o = {};

/**
 *   Returns the profile of a specified user.
 *
 **/
	o.get = function(username){
		return $http.get('/user/profile',{
			params:{
				username:username
			},
			headers:{Authorization: 'Bearer '+auth.getToken(),'Content-Type':'application/x-www-form-urlencoded'}
		})
		.success(function(res){
			// angular.copy(res.data, o.user)
			return res.data;
		});
	}
/**
 *   Upload a users profile picture
 *
 **/
	o.postPicture = function(){
		return $http.post('/upload',{
            headers:{Authorization: 'Bearer '+auth.getToken(),'Content-Type':'application/x-www-form-urlencoded'}
        })
		.success(function(data){

		})
	}
/**
 *  Returns all appointments for both the employee and the customers trying to schedule an appointment,
 *  Takes in the ID of the employee & the startDate to search for. User ID is grabbed from
 *  auth middleware.
 *
 **/
    o.getAppts = function(object){
        return $http.get('/user/appointments',{
            params:{
                'startDate':object.startDate,
                'id':object.id
            },
            headers: {Authorization: 'Bearer '+auth.getToken()}
        }).success(function(data){

        })
    }
/**
 *   Returns a user object
 *
 *  Parameters:
 *  id - The id of the employee.
 **/
    o.search = function(id){
        return $http.get('/user/search', {
            params:{
                'id':id
            },
            headers: {Authorization: 'Bearer '+auth.getToken()}
        }).success(function(data){
            angular.copy(data, o.categories)
        });
    }
/**
 *
 *
 *
 */
    o.getDashboard = function(){
        return $http.get('/user/dashboard',{
            headers:{Authorization: 'Bearer '+auth.getToken(),'Content-Type':'application/x-www-form-urlencoded'}
        })
        .success(function(data){

        })
    }
	return o;
}])