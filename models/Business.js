var mongoose = require('mongoose');
var textSearch = require('mongoose-text-search');

var BusinessSchema = new mongoose.Schema({
    name: String,
    location: Object,
    owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    services: [{type: mongoose.Schema.Types.ObjectId, ref: 'Service'}],
    category: String,
    employees: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    placesId: String,
    customers: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    address: String,
    phoneNumber: String,
    dateCreated: String,
    pending: Boolean,
    claimed: Boolean,
    tier: Number,
    payments: Boolean,
    stripeId: String,
    stripeKeys: Object,
    stripeAccount: Object
});

BusinessSchema.plugin(textSearch);

BusinessSchema.index({customers: 'text'});

mongoose.model('Business', BusinessSchema);
