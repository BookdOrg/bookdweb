var mongoose = require('mongoose');

var BusinessSchema = new mongoose.Schema({
  name: String,
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  services: Object,
  categories: [{type: mongoose.Schema.Types.ObjectId, ref:'Categories'}],
  employees: [{type: mongoose.Schema.Types.ObjectId, ref:'User'}],
  photos: String,
  hours: String,
  email: String,
  phoneNumber: String,
  description: String,
  rating: Number,
  location: String,
  image: String,
  dateCreated: String,
  pending: Boolean,
  claimed: Boolean
});

mongoose.model('Business', BusinessSchema);
