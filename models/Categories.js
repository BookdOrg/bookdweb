var mongoose = require('mongoose');

var CategorySchema = new mongoose.Schema({
  name: String,
  description: String
});

mongoose.model('Category', CategorySchema);
