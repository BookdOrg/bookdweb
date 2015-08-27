var mongoose = require('mongoose');

var AppointmentsSchema = new mongoose.Schema({
  businessId: String,
  employee: {type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customer: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  start: String,
  end: String,
  title: String,
  service: {type: mongoose.Schema.Types.ObjectId, ref:'Service'},
  type: String,
  timestamp: String
});

mongoose.model('Appointment', AppointmentsSchema);
