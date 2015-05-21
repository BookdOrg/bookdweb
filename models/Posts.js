
var mongoose = require('mongoose');

// var gfs = new Grid(mongoose.connection.db);

var PostSchema = new mongoose.Schema({
  title: String,
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  author: String,
  authorId: String,
  description: String,
  rate: String,
  location: String,
  image: String,
  startDate: String,
  endDate: String,
  timestamp: String
});

  // PostSchema.methods.getAvatar = function(posts,id){
  //   for(var i = 0; i<posts.length; i++){
  //     gfs.findOne({_id:posts[i].id},function(err,file){
  //       if(file){
  //         var readstream = gfs.createReadStream({
  //           _id:id
  //         });
  //         readStream.on('data',function(data){
  //           var data_uri_prefix = "data:" + file.contentType + ";base64,";
  //           var image = data.tostring("base64");
  //           image = data_uri_prefix +image;
  //           posts[i].image = image;
  //         });
  //       };
  //       readStream.on('error',function(err){
  //         console.log('An error occured!',err);
  //         throw err;
  //       })
  //     });
  //   };
  //   return posts;
  // };
// PostSchema.methods.upvote = function(cb) {
//   this.upvotes += 1;
//   this.save(cb);
// };

mongoose.model('Post', PostSchema);
