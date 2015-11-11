var mongoose = require('mongoose');

var AppointmentsSchema = new mongoose.Schema({
    businessId: String,
    employee: String,
    customer: String,
    start: Object,
    end: Object,
    title: String,
    service: String,
    timestamp: String,
    card: Object
});

mongoose.model('Appointment', AppointmentsSchema);
