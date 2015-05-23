
var mongoose = require('mongoose');

var ReviewSchema = new mongoose.Schema({
  body: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  authorId: String,
  timestamp: String,
  image: String,
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }
});

// CommentSchema.methods.upvote = function(cb) {
//   this.upvotes += 1;
//   this.save(cb);
// };

mongoose.model('Review', ReviewSchema);
