angular.module('cc.business-factory',[])
.factory('businessFactory', ['$http', 'auth', function($http, auth){
  var o = {
    categories: [],
    business: {}
  };

  o.get = function(id) {
    return $http.get('/business/' + id, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).then(function(res){
      return res.data;
    });
  };
  o.query = function(query){
    return $http.get('/query',{
      params:{
        'query':query
      },
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){

    })
  }
  o.getCategories = function() {
    return $http.get('/categories', {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      angular.copy(data, o.categories)
    });
  };
  o.claim = function(id,category) {
    return $http.post('/business/claim',{
      params:{
        'placesId':id,
        'category':category
      },
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      console.log(data);
    });
  };
  o.getBusiness = function(id){
    return $http.get('/business-detail', {
      params:{
        'id':id
      },
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).then(function(data,err){
      angular.copy(data.data, o.business);
    });
  }
  o.addService = function(service){
    return $http.post('/business/service',service,{
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).then(function(data,err){
      angular.copy(data.data, o.business);
    });
  }
  // o.addService = function(service){
  //   console.log(auth.getToken())
  //   return $http.post('/business/service', {
  //     params:{
  //       'service':service
  //     },
  //     headers: {Authorization: 'Bearer '+auth.getToken()}
  //   }).success(function(data){
  //     angular.copy(data.data, o.business);
  //   });
  // }
  // o.getRecent = function(){
  //   return $http.get('/most-recent', {
  //     headers: {Authorization: 'Bearer '+auth.getToken()}
  //   }).success(function(data){
  //     angular.copy(data,o.recentPosts);
  //   });
  // };
  // o.getAll = function() {
  //   return $http.get('/businesses',{
  //     headers: {Authorization: 'Bearer '+auth.getToken()}
  //   }).success(function(data){
  //     angular.copy(data, o.posts);
  //   });
  // };

  // o.getUserPosts = function(id){
  //   return $http.get('/user/appointments/'+ id,{
  //     headers: {Authorization: 'Bearer '+auth.getToken()}
  //   }).success(function(data){
  //     angular.copy(data, o.myPosts)
  //   })
  // }


  // o.upvote = function(post) {
  //   return $http.put('/posts/' + post._id + '/upvote', {
  //     headers: {Authorization: 'Bearer '+auth.getToken()}
  //   }).success(function(data){
  //     post.upvotes += 1;
  //   });
  // };

  // o.addReview = function(id, review) {
  //   return $http.post('/posts/' + id + '/reviews', review,{
  //     headers: {Authorization: 'Bearer '+auth.getToken()}
  //   });
  // };

  // o.upvoteComment = function(post, comment) {
  //   return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/upvote', {
  //     headers: {Authorization: 'Bearer '+auth.getToken()}
  //   }).success(function(data){
  //     comment.upvotes += 1;
  //   });
  // };

  return o;
}])