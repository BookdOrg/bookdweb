var mongoose = require('mongoose');

var AppointmentsSchema = new mongoose.Schema({
  barber: {type: mongoose.Schema.Types.ObjectId, ref: 'Barber' },
  customer: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  service: {type: mongoose.Schema.Types.ObjectId, ref:'Services'},
  time: String,
  phoneNumber: String,
  timestamp: String
});

mongoose.model('Appointment', AppointmentsSchema);
