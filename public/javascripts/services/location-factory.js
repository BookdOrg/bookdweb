angular.module('cc.location-factory',[])
.factory('location', ['$http', function($http){
	var currPosition = {};
	if (typeof(Number.prototype.toRad) === "undefined") {
	  Number.prototype.toRad = function() {
	    return this * Math.PI / 180;
	  }
	}
	var distance;
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
		},
		calculateDistance:function(lon1, lat1, lon2, lat2) {
		  var R = 6371; // Radius of the earth in km
		  var dLat = (lat2-lat1).toRad();  // Javascript functions in radians
		  var dLon = (lon2-lon1).toRad(); 
		  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
		          Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) * 
		          Math.sin(dLon/2) * Math.sin(dLon/2); 
		  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
		  var d = R * c; // Distance in km
		  var m = d*0.000621371192; //Distance in miles
		  return m;
		}

		// /** Converts numeric degrees to radians */
		// if (typeof(Number.prototype.toRad) === "undefined") {
		//   Number.prototype.toRad = function() {
		//     return this * Math.PI / 180;
		//   }
		// }
	}
	return location;
}]);