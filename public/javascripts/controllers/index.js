
var app = require('angular').module('cc');

app.controller('AccountCtrl', require('./account-controller'));
app.controller('AdminCtrl', require('./admin-controller'));
app.controller('appointmentsCtrl', require('./appointments-controller'));
app.controller('editAppointmentModalCtrl', require('./edit-appointment-modal'));
app.controller('AuthCtrl', require('./auth-controller'));
app.controller('businessCtrl', require('./business-controller'));
app.controller('scheduleServiceModalCtrl', require('./schedule-service-modal'));
app.controller('addServiceModalCtrl', require('./add-service-modal'));
app.controller('editServiceModalCtrl', require('./edit-service-modal'));
app.controller('addEmployeeModalCtrl', require('./add-employee-modal'));
app.controller('removeEmployeeModalCtrl', require('./remove-employee-modal'));
app.controller('dashboardCtrl', require('./dashboard-controller'));
app.controller('LandingCtrl', require('./landing-controller'));
app.controller('MainCtrl', require('./main-controller'));
app.controller('ModalInstanceCtrl', require('./modal-controller'));
app.controller('NavCtrl', require('./nav-controller'));
app.controller('messagesModalCtrl', require('./nav-controller'));
app.controller('ProfileCtrl', require('./profile-controller'));
app.controller('searchCtrl', require('./search-controller'));