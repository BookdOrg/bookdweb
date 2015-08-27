var mongoose = require('mongoose');

var BusinessSchema = new mongoose.Schema({
  owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  services: [{type: mongoose.Schema.Types.ObjectId, ref:'Service'}],
  category: String,
  employees: [{type: mongoose.Schema.Types.ObjectId, ref:'User'}],
  placesId: String,
  dateCreated: String,
  pending: Boolean,
  claimed: Boolean
});

mongoose.model('Business', BusinessSchema);
