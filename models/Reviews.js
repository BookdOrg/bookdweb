
var mongoose = require('mongoose');

var ReviewSchema = new mongoose.Schema({
  body: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: String,
  image: String,
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' }
});

mongoose.model('Review', ReviewSchema);
