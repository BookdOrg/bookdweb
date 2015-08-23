var mongoose = require('mongoose');

var CategorySchema = new mongoose.Schema({
  id: String,
  name: String,
  image: String,
  description: String
});

mongoose.model('Category', CategorySchema);
