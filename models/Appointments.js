var mongoose = require('mongoose');

var AppointmentsSchema = new mongoose.Schema({
  businessId: String,
  employee: String,
  customer: String,
  start: Object,
  end: Object,
  title: String,
  service: {type: mongoose.Schema.Types.ObjectId, ref:'Service'},
  type: String,
  timestamp: String
});

mongoose.model('Appointment', AppointmentsSchema);
