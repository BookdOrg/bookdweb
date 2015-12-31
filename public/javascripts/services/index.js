/**
 * Created by jonfor on 11/24/15.
 */
var app = require('angular').module('cc');

app.factory('auth', require('./auth-factory'));
app.factory('businessFactory', require('./business-factory'));
app.factory('location', require('./location-factory'));
app.factory('socketService', require('./socket-service'));
app.factory('utilService', require('./util-service'));
app.factory('userFactory', require('./user-factory'));
app.factory('notificationFactory', require('./notification-factory'));