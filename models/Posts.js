
var mongoose = require('mongoose');

// var gfs = new Grid(mongoose.connection.db);

var PostSchema = new mongoose.Schema({
  title: String,
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  description: String,
  rate: String,
  rating: Number,
  location: String,
  image: String,
  startDate: String,
  endDate: String,
  timestamp: String
});

// PostSchema.methods.upvote = function(cb) {
//   this.upvotes += 1;
//   this.save(cb);
// };

mongoose.model('Post', PostSchema);
