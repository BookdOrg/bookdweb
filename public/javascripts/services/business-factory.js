angular.module('cc.business-factory',[])
.factory('business', ['$http', 'auth', function($http, auth){
  var o = {
    categories: []
  };

  o.get = function(id) {
    return $http.get('/business/' + id, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).then(function(res){
      return res.data;
    });
  };
  o.getCategories = function() {
    return $http.get('/categories', {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).then(function(data){
      angular.copy(data.data, o.categories)
    });
  };
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
  // o.create = function(post) {
  //   return $http.post('/posts', post, {
  //     headers: {Authorization: 'Bearer '+auth.getToken()}
  //   }).success(function(data){
  //     o.posts.push(data);
  //   });
  // };

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
.service('businessService',function(){
  var business;
  return{
    getBusiness:function(){
      return business;
    },
    setBusinesses:function(value){
      business = value;
    }
  }
})
.factory("MyYelpAPI", function($http) {
  function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
  }
    return {
        "retrieveYelp": function(name,cat,location,cll,callback) {
            var method = 'GET';
            var url = 'http://api.yelp.com/v2/search/';
            var params = {
                    callback: 'angular.callbacks._0',
                    location: location,
                    category_filter: cat,
                    cll: cll,
                    oauth_consumer_key: 'hRcCQYnLQ6pJAhMW1kqIxQ', //Consumer Key
                    oauth_token: 'YL6ONt-_YNjOmyrz7BWm8zN-9FCUNcBq', //Token
                    oauth_signature_method: "HMAC-SHA1",
                    oauth_timestamp: new Date().getTime(),
                    oauth_nonce: randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'),
                    // term: 'food'
                };
            var consumerSecret = '0p5OnO_XT-Qfwtl_TIVCrG_lPpU'; //Consumer Secret
            var tokenSecret = '-k-uGXRUaO14iTrFTQqpG1HztMc'; //Token Secret
            var signature = oauthSignature.generate(method, url, params, consumerSecret, tokenSecret, { encodeSignature: false});
            params['oauth_signature'] = signature;
            $http.jsonp(url, {params: params}).success(callback).success(function(data){
              console.log(data)
            });
        }
    }
});