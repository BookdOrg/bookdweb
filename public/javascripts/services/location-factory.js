module.exports = function ($window, $rootScope) {
    var currPosition = {};
    if (typeof(Number.prototype.toRad) === 'undefined') {
        Number.prototype.toRad = function () {
            return this * Math.PI / 180;
        };
    }
    var location = {
        setPosition: function (position) {
            currPosition = {
                address: position[0].formatted_address,
                city: position[0].address_components[2].long_name,
                state: position[0].address_components[4].long_name,
                country: position[0].address_components[5].long_name,
                zip: position[0].address_components[6].long_name,
                latitude: position[0].geometry.location.lat,
                longitude: position[0].geometry.location.lng
            };
            $window.localStorage['currPosition'] = currPosition;
            location.currPosition = currPosition;
        },
        getPosition: function () {
            location.currPosition = $window.localStorage['currPosition'];
            $rootScope.currLocation = location.currPosition;
        },
        calculateDistance: function (lon1, lat1, lon2, lat2) {
            var R = 6371; // Radius of the earth in km
            var dLat = (lat2 - lat1).toRad();  // Javascript functions in radians
            var dLon = (lon2 - lon1).toRad();
            var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            var d = R * c; // Distance in km
            return d * 0.000621371192; // Distance in miles;
        }
        // /** Converts numeric degrees to radians */
        // if (typeof(Number.prototype.toRad) === "undefined") {
        //   Number.prototype.toRad = function() {
        //     return this * Math.PI / 180;
        //   }
        // }
    };
    return location;
};