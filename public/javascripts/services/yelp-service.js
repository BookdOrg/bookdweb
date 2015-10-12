/*
 * Created by: Khalil Brown
 *
 * Need to be removed unless keeping YELP
 */
angular.module('cc.yelp-service', [])
    .factory('yelpService', ['$http', 'auth', function ($http, auth) {
        var o = {
            businesses: [],
            business: {}
        };

        o.search = function (category, location, limit, sort, offset, radius, deals) {
            return $http.get('/search', {
                params: {
                    'location': location,
                    'limit': limit,
                    'sort': sort,
                    'offset': offset,
                    'category': category,
                    'radius': radius,
                    'deals': deals
                },
                headers: {Authorization: 'Bearer ' + auth.getToken()}
            }).then(function (data) {
                angular.copy(data.businesses, o.businesses);
            }, function (response) {
                //TODO Handle error
                //console.log(response);
            });
        };
        o.business = function (id) {
            return $http.get('/business', {
                params: {
                    'id': id
                },
                headers: {Authorization: 'Bearer ' + auth.getToken()}
            }).then(function (data) {
                angular.copy(data, o.business);
            }, function (response) {
                //TODO Handle error
                //console.log(response);
            });
        };
        return o;
    }]);