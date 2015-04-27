var express = require('express');
var router = express.Router();
var jwt = require('express-jwt');
var passport = require('passport');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});


var mongoose = require('mongoose'),
    _ = require('lodash');

var Grid = require('gridfs-stream');
Grid.mongo = mongoose.mongo;

var gfs = new Grid(mongoose.connection.db);

var fs = require('fs');
var busboy = require('connect-busboy');
var busboyBodyParser = require('busboy-body-parser');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');

var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

router.get('/posts', function(req, res, next) {
  Post.find(function(err, posts){
    if(err){ return next(err); }

    res.json(posts);
  });
});

router.post('/posts', auth, function(req, res, next) {
  var post = new Post(req.body);
  post.author = req.payload.username;
  var id = req.payload._id;

  gfs.findOne({ _id: id}, function(err,file){
    if(file){
      var readStream = gfs.createReadStream({
        _id: id
      });
      readStream.on('data',function(data){
        var data_uri_prefix = "data:" + file.contentType +";base64,";
        var image = data.toString("base64");
        image = data_uri_prefix + image;
        post.image = image;
        post.save(function(err, post){
          if(err){ return next(err); }
          res.json(post);
        });
      })
    }
    readStream.on('error',function(err){
      console.log('An error occurred!',err);
      throw err;
    });
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

  gfs.findOne({ _id: id}, function(err,file){
    if(file){
      var readStream = gfs.createReadStream({
        _id: id
      });
      readStream.on('data',function(data){
        var data_uri_prefix = "data:" + file.contentType +";base64,";
        var image = data.toString("base64");
        image = data_uri_prefix + image;
        comment.image = image;
        comment.save(function(err, comment){
        if(err){ return next(err); }
          req.post.comments.push(comment);
          req.post.save(function(err, post) {
            if(err){ return next(err); }
            res.json(comment);
          });
        });
      })
    }
    readStream.on('error',function(err){
      console.log('An error occurred!',err);
      throw err;
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
    var part = req.files.file;
    var id = req.payload._id;
      var writeStream = gfs.createWriteStream({
        _id: id,
        filename: part.name,
        mode:'w',
        content_type:part.mimetype
      });

      writeStream.on('close',function(){
        return res.status(200).send({
          message: 'Success'
        });
      });

      writeStream.write(part.data);
      writeStream.end();
});
router.get('/profile',auth,function(req,res,next){
  var id = req.payload._id;

  User.findOne({'_id':id},function(err,user){
    if(err){return handleError(err)};

    gfs.findOne({ _id: id}, function(err,file){
      if(!file){
        return res.status(400).send({
          message: 'File not found'
        });
      }
      // res.writeHead(200, {'Content-Type': 'application/json'});

      var readStream = gfs.createReadStream({
        _id: id
      });

      readStream.on('data',function(data){
        var data_uri_prefix = "data:" + file.contentType +";base64,";
        var image = data.toString("base64");
        image = data_uri_prefix + image;
        var profile = {};
        profile.user = user;
        profile.image = image;
        res.json(profile);
      })
      readStream.on('end',function(){
        res.end();
      });

      readStream.on('error',function(err){
        console.log('An error occurred!',err);
        throw err;
      });
    });
  })

})
// router.get('/getpic',auth,function(req,res,next){
//   var id = req.payload._id;

//   gfs.findOne({ _id: id}, function(err,file){
//     if(!file){
//       return res.status(400).send({
//         message: 'File not found'
//       });
//     }
//     res.writeHead(200, {'Content-Type': file.contentType});

//     var readStream = gfs.createReadStream({
//       _id: id
//     });

//     readStream.on('data',function(data){
//       var data_uri_prefix = "data:" + file.contentType +";base64,";
//       var image = data.toString("base64");
//       image = data_uri_prefix + image;
//       res.write(image);
//     })
//     readStream.on('end',function(){
//       res.end();
//     });

//     readStream.on('error',function(err){
//       console.log('An error occurred!',err);
//       throw err;
//     });
//   });
// });


module.exports = router;
