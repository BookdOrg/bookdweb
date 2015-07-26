angular.module('cc.admin-service',[])
.factory('adminService', ['$http', 'auth', function($http, auth){
  var o = {
    requests:[]
  };
  o.getRequests = function(){
    return $http.get('/claim-requests', {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      angular.copy(data, o.requests);
    });
  }
  o.changeStatus = function(request){
    return $http.post('/claim-status',request, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      angular.copy(data, o.requests);
    });
  }
  return o;
}])