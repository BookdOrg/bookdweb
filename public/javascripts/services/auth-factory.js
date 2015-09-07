angular.module('cc.auth-factory',[])
.factory('auth', ['$http', '$window', '$rootScope','$state', function($http, $window, $rootScope,$state){
   var auth = {
    saveToken: function (token){
      $window.localStorage['cc-token'] = token;
    },
    getToken: function (){
      return $window.localStorage['cc-token'];
    },
    isLoggedIn: function(){
      var token = auth.getToken();

      if(token){
        var payload = JSON.parse($window.atob(token.split('.')[1]));
        
        return payload.exp > Date.now() / 1000;
      } else {
        return false;
      }
    },
    currentUser: function(){
      if(auth.isLoggedIn()){
        var token = auth.getToken();
        var payload = JSON.parse($window.atob(token.split('.')[1]));
        return payload;
      }
    },
    register: function(user){
      return $http.post('/register', user).success(function(data){
        auth.saveToken(data.token);
        $rootScope.currentUser = auth.currentUser();
      });
    },
    logIn: function(user){
      return $http.post('/login', user).success(function(data){
        auth.saveToken(data.token);
        $rootScope.currentUser = auth.currentUser();
      });
    },
    logOut: function(){
      $window.localStorage.removeItem('cc-token');
      $rootScope.currentUser = null;
      $state.go('landing');
    }
  };

  return auth;
}])