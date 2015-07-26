var express = require('express');
var app = require('express')();
var router = express.Router();
var jwt = require('express-jwt');
var passport = require('passport');
var cloudinary = require('cloudinary');
var fs = require('fs');
var Busboy = require('busboy');
var async = require('async');
var acl = require('acl');

var server = require('http').createServer(app);
var io = require('socket.io')(server);

io.on('connection',function(socket){
  socket.emit('welcome', {message:"Welcome to Handi"})
  socket.on('send',function(data){
    server.sockets.emit('welcome',data);
  });
});

server.listen(process.env.devsocketPort);
/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: '' });
});

var yelp = require("yelp").createClient({
  consumer_key: "hRcCQYnLQ6pJAhMW1kqIxQ", 
  consumer_secret: process.env.yelpconsumersecret,
  token: "YL6ONt-_YNjOmyrz7BWm8zN-9FCUNcBq",
  token_secret: process.env.yelptokensecret
});

var mongoose = require('mongoose');
acl = new acl(new acl.mongodbBackend(mongoose.connection.db,'acl_'));


var Review = mongoose.model('Review');
var User = mongoose.model('User');
var Business = mongoose.model('Business');
var Appointment = mongoose.model('Appointment');
var Category = mongoose.model('Category');

var auth = jwt({secret: 'SECRET', userProperty: 'payload'});



router.get('/foursquare-test',function(req,res,next){

})


router.get('/search',auth,function(req,res,next){
  /**
  * Yelp Parameters - limit, offset, sort, category_filter, 
  * radius_filter, deals_filter
  *
  **/
  var limit = '',
      location = '',
      sort  = '',
      offset = '',
      category = '',
      radius = '',
      deals = '';

  if(req.param('limit')){
    var limit = req.param('limit');
  }
  if(req.param('offset')){
    var offset = req.param('offset');
  }
  if(req.param('sort')){
    var sort = req.param('sort');
  }
  if(req.param('category')){
    var category = req.param('category');
  }
  if(req.param('radius')){
    var radius = req.param('radius');
  }
  if(req.param('deals')){
    var deals = req.param('deals');
  }
  if(req.param('location')){
    var location = req.param('location');
  }
  yelp.search({category_filter:category,location:location},function(err,data){
    if(err){console.log(err); return next(err);}
    console.log(data);
    res.json(data);
  })
})
router.get('/business',auth,function(req,res,next){
  /**
  * Yelp Parameters - id
  *
  **/
  yelp.business(req.param('id'),function(err,data){
    if(err){return next(err);}
    res.json(data);
  })
})

  router.get('/categories',auth,function(req,res,next){
    Category.findOne("beautysvc").exec(function(err,categories){
      if(err){return next(err);}
      res.json(categories);
    })
  })

  router.get('/api/categories',function(req,res,next){
    Category.findOne("beautysvc").exec(function(err,categories){
      if(err){return next(err);}
      console.log(categories)
      res.json(categories);
    })
  })

// router.get('/posts',auth, function(req, res, next) {
//   var id = req.payload._id;

//   Post.find({}).populate({path:'author',select:'_id avatarVersion username'}).exec(function(err,posts){
//     if(err){ return next(err); }
//     var updatedPosts = [];
//     posts.forEach(function(post){
//       updatedPosts.push(post);
//     })
//     res.json(updatedPosts);
//   })
// });

// router.get('/most-recent',auth,function(req, res, next) {
//   var id = req.payload._id;
//   Post.find({}).sort('-timestamp').populate({path:'author',select:'_id avatarVersion username'}).exec(function(err,posts){
//     if(err){ return next(err); }
//     var updatedPosts = [];
//     posts.forEach(function(post){
//       updatedPosts.push(post);
//     })
//     Review.find({}).sort('-timestamp').populate({path:'author',select:'_id avatarVersion username'}).exec(function(err,reviews){
//       var updatedReviews = [];
//       reviews.forEach(function(review){
//         updatedReviews.push(review);
//       })
//       var recentPosts = updatedPosts.concat(updatedReviews);
//       res.json(recentPosts);
//     })
//     // res.json(updatedPosts);
//   })
// });

// router.get('/api/most-recent',function(req, res, next) {
//   Post.find({}).sort('-timestamp').populate({path:'author',select:'_id avatarVersion username'}).exec(function(err,posts){
//     if(err){ return next(err); }
//     var updatedPosts = [];
//     posts.forEach(function(post){
//       updatedPosts.push(post);
//     })
//     Review.find({}).sort('-timestamp').populate({path:'author',select:'_id avatarVersion username'}).exec(function(err,reviews){
//       var updatedReviews = [];
//       reviews.forEach(function(review){
//         updatedReviews.push(review);
//       })
//       res.json({
//         updatedPosts:updatedPosts,
//         updatedReviews:updatedReviews
//       })
//     })
//     // res.json(updatedPosts);
//   })
// });

// router.get('/api/posts', function(req, res, next) {
//   Post.find({}).populate({path:'author',select:'_id avatarVersion username'}).exec(function(err,posts){
//     if(err){ return next(err); }
//     var updatedPosts = [];
//     posts.forEach(function(post){
//       updatedPosts.push(post);
//     })
//     res.json(updatedPosts);
//   })
// });

// router.post('/posts', auth, function(req, res, next) {
//   var post = new Post(req.body);
//   var id = req.payload._id;
//   post.author = id;

//   User.findOne({"_id":id}).exec(function(err,user){
//     user.posts.push(post);
//     user.save(function(err,post){
//       if(err){return next(err);}
//     })
//   })

//   post.save(function(err, post){
//     if(err){ return next(err); }
//     io.emit('newPost', {post:post});
//     res.json(post);
//   });
// });
// router.param('user',function(req,res,next,id){
//   var query = User.findById(id);
//   query.exec(function(err,user){
//     if (err) { return next(err); }
//     if (!user) { return next(new Error("can't find user")); }
//     req.user = user;
//     return next();
//   })
// })


// router.get('/user/appts/:user',auth,function(req,res,next){
//   var id = req.params.id;
//   req.user.populate({path:'posts',select:''},function(err,user){
//     res.json(user);
//   })
// });

// router.get('/api/appts/:user',function(req,res,next){
//   var id = req.params.id;
//   req.user.populate({path:'posts',select:''},function(err,user){
//     res.json(user);
//   })
// })

// Preload post objects on routes with ':post'

// router.param('biz', function(req, res, next, id) {
//   var query = Post.findById(id);

//   query.exec(function (err, post){
//     if (err) { return next(err); }
//     if (!post) { return next(new Error("can't find post")); }
//     req.post = post;
//     return next();
//   });
// });

// Preload review objects on routes with ':review'

// router.param('review', function(req, res, next, id) {
//   var query = Review.findById(id);

//   query.exec(function (err, review){
//     if (err) { return next(err); }
//     if (!review) { return next(new Error("can't find review")); }

//     req.review = review;
//     return next();
//   });
// });

// return a post
// router.get('/biz/:biz',auth, function(req, res, next) {
//   req.post.populate([{path:'reviews',select:''},{path:'author',select:'_id username avatarVersion'}], function(err, post) {
//     var updatedPost = [];
//     async.each(post.reviews,function(currentReview,postCallback){
//       currentReview.populate({path:'author',select:'_id username avatarVersion'},function(err,review){
//         if(err){
//           return postCallback(err);
//         }
//         postCallback();
//       });
//     }, function(err){
//       if(err){
//         return next(error);
//       }
//       res.json(post)
//     })
//   });
// });

// router.get('/api/posts/:post', function(req, res, next) {
//   req.post.populate([{path:'reviews',select:''},{path:'author',select:'_id username avatarVersion'}], function(err, post) {
//     var updatedPost = [];
//     async.each(post.reviews,function(currentReview,postCallback){
//       currentReview.populate({path:'author',select:'_id username avatarVersion'},function(err,review){
//         if(err){
//           return postCallback(err);
//         }
//         postCallback();
//       });
//     }, function(err){
//       if(err){
//         return next(error);
//       }
//       res.json(post)
//     })
//   });
// });

// create a new review associated with a business

// router.post('/biz/:biz/reviews', auth, function(req, res, next) {
//   var review = new Review(req.body);
//   review.post = req.post;
//   var id = req.payload._id;
//   review.author = id;
//   review.save(function(err, review){
//     if(err){ return next(err); }
//     req.post.reviews.push(review);
//     req.post.save(function(err, post) {
//       if(err){ return next(err); }
//       io.emit('newReview', {review:review});
//       res.json(review);
//     });
//   });
// });

router.post('/login', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  passport.authenticate('local', function(err, user, info){
    if(err){ return next(err); }

    if(user){
      return res.json({token: user.generateJWT()});
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
});

router.post('/register', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  var user = new User();

  user.username = req.body.username;

  user.setPassword(req.body.password);

  user.firstName = req.body.firstName;
  user.lastName = req.body.lastName;

  user.save(function (err){
    if(err){ return next(err); }

    return res.json({token: user.generateJWT()})
  });
})

router.post('/upload', auth, function(req,res,next){
    var id = req.payload._id;
    var busboy = new Busboy({headers:req.headers});

    busboy.on('file',function(fieldname,file,filename,encoding,mimetype){

      var stream = cloudinary.uploader.upload_stream(function(result){
        User.findOne({'_id':id},function(err,user){
          if(err){return handleError(err)};
          user.avatarVersion = result.version;
          user.save(function(err){
            if(err){ return next(err); }
          }) 
        })
      }, {public_id: "profile/"+id});

      file.pipe(stream);
    })
    busboy.on('finish',function(){
      res.end();
    })
    req.pipe(busboy);
});
router.get('/:id/profile',auth,function(req,res,next){
  var id = req.params.id;
  User.findOne({"_id": id}).select('_id lastName firstName username avatarVersion').exec(function(err,user){
    if(err){return handleError(err)};
      var profile = {};
      profile.user= user;
      res.json(profile);
  })
});
router.get('/api/:id/profile',function(req,res,next){
  var id = req.params.id;
  User.findOne({"_id": id}).select('_id lastName firstName username avatarVersion').exec(function(err,user){
    if(err){return handleError(err)};
      var profile = {};
      profile.user= user;
      res.json(profile);
  })
});
router.get('/sockettest',function(req,res){
  res.render("page");
})

module.exports = router;
