/*
 * Created by: Khalil Brown
 *
 * Need to be removed unless keeping YELP
 */
angular.module('cc.yelp-service',[])
.factory('yelpService', ['$http', 'auth', function($http, auth){
  var o = {
    businesses: [],
    business:{}
  };

  o.search = function(category,location,limit,sort,offset,radius,deals) {
    return $http.get('/search', {
      params:{
        'location':location,
        'limit': limit,
        'sort': sort,
        'offset': offset,
        'category': category,
        'radius': radius,
        'deals': deals
      },
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      angular.copy(data.businesses, o.businesses);
    });
  };
  o.business = function(id){
    return $http.get('/business', {
      params:{
        'id':id
      },
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      angular.copy(data, o.business);
    });
  }
  // o.getCategories = function() {
  //   return $http.get('/categories', {
  //     headers: {Authorization: 'Bearer '+auth.getToken()}
  //   }).then(function(data){
  //     angular.copy(data.data, o.categories)
  //   });
  // };
  return o;
}])