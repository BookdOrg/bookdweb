
var app = require('angular').module('cc');

app.controller('AccountCtrl', require('./account-controller'));
app.controller('AdminCtrl', require('./admin-controller'));
app.controller('appointmentsCtrl', require('./appointments-controller'));
app.controller('editAppointmentModalCtrl', require('./appointments-controller'));
app.controller('AuthCtrl', require('./auth-controller'));
app.controller('businessCtrl', require('./business-controller'));
app.controller('scheduleServiceModalCtrl', require('./business-controller'));
app.controller('addServiceModalCtrl', require('./business-controller'));
app.controller('editServiceModalCtrl', require('./business-controller'));
app.controller('addEmployeeModalCtrl', require('./business-controller'));
app.controller('removeEmployeeModalCtrl', require('./business-controller'));
app.controller('dashboardCtrl', require('./dashboard-controller'));
app.controller('LandingCtrl', require('./landing-controller'));
app.controller('MainCtrl', require('./main-controller'));
app.controller('ModalInstanceCtrl', require('./modal-controller'));
app.controller('NavCtrl', require('./nav-controller'));
app.controller('messagesModalCtrl', require('./nav-controller'));
app.controller('ProfileCtrl', require('./profile-controller'));
app.controller('searchCtrl', require('./search-controller'));

app.filter('notifFilter', require('./nav-controller'));