
var mongoose = require('mongoose');

var PostSchema = new mongoose.Schema({
  title: String,
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  author: String,
  description: String,
  rate: String,
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
