var express = require('express');
var router = express.Router();
var jwt = require('express-jwt');
var passport = require('passport');
var cloudinary = require('cloudinary');
var fs = require('fs');
var Busboy = require('busboy');
var async = require('async');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});


var mongoose = require('mongoose');

var Post = mongoose.model('Post');
var Review = mongoose.model('Review');
var User = mongoose.model('User');

var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

router.get('/posts',auth, function(req, res, next) {
  var id = req.payload._id;

  Post.find({}).populate({path:'author',select:'_id avatarVersion username'}).exec(function(err,posts){
    if(err){ return next(err); }
    var updatedPosts = [];
    posts.forEach(function(post){
      post.image = cloudinary.image("v"+post.author.avatarVersion+"/profile/"+post.author._id,{
          width:50, height:50,crop:'thumb',radius:'10'
      })
      updatedPosts.push(post);
    })
    res.json(updatedPosts);
  })
});

router.get('/api/posts', function(req, res, next) {
  Post.find({}).populate({path:'author',select:'_id avatarVersion username'}).exec(function(err,posts){
    if(err){ return next(err); }
    var updatedPosts = [];
    posts.forEach(function(post){
      post.image = cloudinary.image("v"+post.author.avatarVersion+"/profile/"+post.author._id,{
          width:50, height:50,crop:'thumb',radius:'10'
      })
      updatedPosts.push(post);
    })
    res.json(updatedPosts);
  })
});

router.post('/posts', auth, function(req, res, next) {
  var post = new Post(req.body);
  var id = req.payload._id;
  post.author = id;
  
  post.save(function(err, post){
    if(err){ return next(err); }
    res.json(post);
  });
});


// Preload post objects on routes with ':post'
router.param('post', function(req, res, next, id) {
  var query = Post.findById(id);

  query.exec(function (err, post){
    if (err) { return next(err); }
    if (!post) { return next(new Error("can't find post")); }
    req.post = post;
    return next();
  });
});

// Preload review objects on routes with ':review'
router.param('review', function(req, res, next, id) {
  var query = Review.findById(id);

  query.exec(function (err, review){
    if (err) { return next(err); }
    if (!review) { return next(new Error("can't find review")); }

    req.review = review;
    return next();
  });
});

//Preload user objects on routes with ':user'
// router.param('user', function(req,res,next,id){
//   var query = User.findById(id);

//   query.exec(function(err,user){
//     if(err){return next(err); }
//     if(!user){return next(new Error("user not found")); }

//     req.user = user;
//     return next();
//   })
// })

// return a post
router.get('/posts/:post', function(req, res, next) {
  req.post.populate([{path:'reviews',select:''},{path:'author',select:'_id username avatarVersion'}], function(err, post) {
    post.image = cloudinary.image("v"+post.author.avatarVersion+"/profile/"+post.author._id,{
      width:100, height:100,crop:'thumb',radius:'20'
    })
    var updatedPost = [];
    async.each(post.reviews,function(currentReview,postCallback){
      currentReview.populate({path:'author',select:'_id username avatarVersion'},function(err,review){
        console.log(review)
        if(err){
          return postCallback(err);
        }
        review.image = cloudinary.image("v"+post.author.avatarVersion+"/profile/"+post.author._id,{
          width:75, height:75,crop:'thumb',radius:'20'
        });
        postCallback();
      });
    }, function(err){
      if(err){
        return next(error);
      }
      res.json(post)
    })
  });
});

router.get('/api/posts/:post', function(req, res, next) {
  req.post.populate([{path:'reviews',select:''},{path:'author',select:'_id username avatarVersion'}], function(err, post) {
    post.image = cloudinary.image("v"+post.author.avatarVersion+"/profile/"+post.author._id,{
      width:100, height:100,crop:'thumb',radius:'20'
    })
    var updatedPost = [];
    async.each(post.reviews,function(currentReview,postCallback){
      currentReview.populate({path:'author',select:'_id username avatarVersion'},function(err,review){
        console.log(review)
        if(err){
          return postCallback(err);
        }
        review.image = cloudinary.image("v"+post.author.avatarVersion+"/profile/"+post.author._id,{
          width:75, height:75,crop:'thumb',radius:'20'
        });
        postCallback();
      });
    }, function(err){
      if(err){
        return next(error);
      }
      res.json(post)
    })
  });
});

// router.get('/user/:user',auth, function(req,res,next){
//   res.json(req.user);
// })

// upvote a post
// router.put('/posts/:post/upvote', auth, function(req, res, next) {
//   req.post.upvote(function(err, post){
//     if (err) { return next(err); }

//     res.json(post);
//   });
// });


// create a new review
router.post('/posts/:post/reviews', auth, function(req, res, next) {
  var review = new Review(req.body);
  review.post = req.post;
  var id = req.payload._id;
  review.author = id;
  review.save(function(err, review){
    if(err){ return next(err); }
    req.post.reviews.push(review);
    req.post.save(function(err, post) {
      if(err){ return next(err); }
      res.json(review);
    });
  });
});

// upvote a comment
// router.put('/posts/:post/comments/:comment/upvote', auth, function(req, res, next) {
//   req.comment.upvote(function(err, comment){
//     if (err) { return next(err); }
    
//     res.json(comment);
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
  User.findOne({"_id": id}).select('_id lastName firstName username avatarVersion image').exec(function(err,user){
    if(err){return handleError(err)};
      var profile = {};
      profile.user= user;
      profile.image = cloudinary.image("v"+user.avatarVersion+"/profile/"+id,{
        width:100, height:100,crop:'thumb',radius:'20'
      })
      res.json(profile);
  })
});
router.get('/api/:id/profile',function(req,res,next){
  var id = req.params.id;
  User.findOne({"_id": id}).select('_id lastName firstName username avatarVersion image').exec(function(err,user){
    if(err){return handleError(err)};
      var profile = {};
      profile.user= user;
      profile.image = cloudinary.image("v"+user.avatarVersion+"/profile/"+id,{
        width:100, height:100,crop:'thumb',radius:'20'
      })
      res.json(profile);
  })
});

module.exports = router;
