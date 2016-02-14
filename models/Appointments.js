var mongoose = require('mongoose');

var AppointmentsSchema = new mongoose.Schema({
    businessId: String,
    employee: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    customer: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    start: Object,
    end: Object,
    externalCustomer: Object,
    title: String,
    service: String,
    timestamp: String,
    card: Object,
    status: String,
    price: String
});

AppointmentsSchema.post('remove', function(next) {
    // Remove all the assignment docs that reference the removed person.
    console.log('%s has been removed', this._id);
    this.model('User').remove({ user: this._id }, next);

});
mongoose.model('Appointment', AppointmentsSchema);
