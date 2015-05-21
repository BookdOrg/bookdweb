var express = require('express');
var router = express.Router();
var jwt = require('express-jwt');
var passport = require('passport');
var cloudinary = require('cloudinary');
var fs = require('fs');
var Busboy = require('busboy');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});


var mongoose = require('mongoose');

var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');

var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

router.get('/posts',auth, function(req, res, next) {
  var id = req.payload._id;
  Post.find(function(err, posts){
    if(err){ return next(err); }
    for(var i = 0; i<posts.length; i++){
      posts[i].image = cloudinary.image("profile/"+posts[i].authorId,{
        width:100, height:100,crop:'thumb',gravity:'face',radius:'max'
      })
    }
    res.json(posts);
  });
});

router.post('/posts', auth, function(req, res, next) {
  var post = new Post(req.body);
  post.author = req.payload.username;
  var id = req.payload._id;
  post.authorId = id;

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

// Preload comment objects on routes with ':comment'
router.param('comment', function(req, res, next, id) {
  var query = Comment.findById(id);

  query.exec(function (err, comment){
    if (err) { return next(err); }
    if (!comment) { return next(new Error("can't find comment")); }

    req.comment = comment;
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
  req.post.populate('comments', function(err, post) {
    for(var i = 0; i<post.comments.length; i++){
      post.comments[i].image = cloudinary.image("profile/"+post.comments[i].authorId,{
        width:100, height:100,crop:'thumb',gravity:'face',radius:'max'
      })
    }
    post.image = cloudinary.image("profile/"+post.authorId,{
        width:100, height:100,crop:'thumb',gravity:'face',radius:'max'
      })
    res.json(post);
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


// create a new comment
router.post('/posts/:post/comments', auth, function(req, res, next) {
  var comment = new Comment(req.body);
  comment.post = req.post;
  comment.author = req.payload.username;
  var id = req.payload._id;
  comment.authorId = id;

  comment.save(function(err, comment){
    if(err){ return next(err); }
    req.post.comments.push(comment);
    req.post.save(function(err, post) {
      if(err){ return next(err); }
      res.json(comment);
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
        console.log('result ' +result);
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
  console.log(req);
  console.log(id);
  User.findOne({'_id':id},function(err,user){
    if(err){return handleError(err)};
      var profile = {};
      profile.user= user;
      profile.image = cloudinary.image("profile/"+id,{
        width:100, height:100,crop:'thumb',gravity:'face',radius:'max'
      })
      res.json(profile);
  })
});

module.exports = router;
