angular.module('cc.location-factory',[])
.factory('location', ['$http', function($http){
	var currPosition = {};
	var location = {
		setPosition:function(position){
			// currPosition = position;
			currPosition.address = position.formatted_address;
  			currPosition.city = position.address_components[2].long_name;

	 	 	currPosition.state = position.address_components[4].long_name;

		  	currPosition.country = position.address_components[5].long_name;

		  	currPosition.zip = position.address_components[6].long_name;

		  	currPosition.lat = position.geometry.location.lat;
		  	currPosition.lng = position.geometry.location.lng;
		},
		getPosition:function(){
			return currPosition;
		}
	}
	return location;
}]);