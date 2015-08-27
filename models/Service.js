var mongoose = require('mongoose');

var ServiceSchema = new mongoose.Schema({
  businessId: {type: mongoose.Schema.Types.ObjectId, ref:'Business'},
  employees: [{type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  name: String,
  duration: String,
  description: String,
  price: String,
  options: Object
});

mongoose.model('Service', ServiceSchema);
