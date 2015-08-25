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

var GooglePlaces = require('googleplaces');

var googleplaces = new GooglePlaces(process.env.GOOGLE_PLACES_API_KEY,process.env.GOOGLE_PLACES_OUTPUT_FORMAT); 

var server = require('http').createServer(app);
var io = require('socket.io')(server);

Array.prototype.inArray = function(comparer) { 
    for(var i=0; i < this.length; i++) { 
        if(comparer(this[i])) return true; 
    }
    return false; 
}; 

Array.prototype.pushIfNotExist = function(element, comparer) { 
    if (!this.inArray(comparer)) {
        this.push(element);
    }
};


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

// var yelp = require("yelp").createClient({
//   consumer_key: "hRcCQYnLQ6pJAhMW1kqIxQ", 
//   consumer_secret: process.env.yelpconsumersecret,
//   token: "YL6ONt-_YNjOmyrz7BWm8zN-9FCUNcBq",
//   token_secret: process.env.yelptokensecret
// });

var mongoose = require('mongoose');
acl = new acl(new acl.mongodbBackend(mongoose.connection.db,'acl_'));


var Review = mongoose.model('Review');
var User = mongoose.model('User');
var Business = mongoose.model('Business');
var Appointment = mongoose.model('Appointment');
var Category = mongoose.model('Category');

var auth = jwt({secret: 'SECRET', userProperty: 'payload'});



router.get('/query',auth,function(req,res,next){
  var query = req.param('query');

  googleplaces.textSearch({query:query},function(error,response){
    if(error){return next(error);}
    res.json(response);
  })
})
router.get('/business-list',auth,function(req,res,next){
  var category = req.param('category');
  var location = req.param('location');

  var updatedBusinesses = [];
  Business.find({"category":category,"claimed":true}).populate({path:"employees",select:'_id appointments firstName lastName username avatarVersion'}).exec(function(error,businesses){
    if(error){return next(error);}
    async.each(businesses,function(currBusiness,businessCallback){
        googleplaces.placeDetailsRequest({placeid:currBusiness.placesId},function(error,response){
          if(error){
            return businessCallback(error);
          }
          response.result.info = currBusiness;
          updatedBusinesses.push(response.result)
          businessCallback();
        });
      }, function(err){
          if(err){
            return next(error);
          }
        res.json(updatedBusinesses)
      })
  })
})
router.get('/search/employees',auth,function(req,res,next){
  var id = req.param('id');
  User.findOne({"_id":id}).select('_id lastName firstName username avatarVersion').exec(function(error,user){
    if(error){return next(error);}
    res.json(user);
  })
})

router.post('/business/employee',auth,function(req,res,next){
  var businessId = req.body.businessId;
  var employeeId = req.body.employeeId;

  Business.findOne({"_id":businessId}).exec(function(err,response){
    response.employees.pushIfNotExist(employeeId,function(e){
      return e == employeeId;
    })
    response.save(function(err){
      if(err){return next(err);}
    })
    Business.populate(response,{path:"employees",select:'_id appointments firstName lastName username avatarVersion'},function(err,busResponse){
      if(err){return next(err);}
      res.json(busResponse);
    })
  })
})

router.get('/business-detail',auth,function(req,res,next){
  var id = req.param('placeId');
  Business.findOne({'placesId':id}).populate({path:"employees",select:'_id appointments firstName lastName username avatarVersion'}).exec(function(error,business){
    googleplaces.placeDetailsRequest({placeid:business.placesId},function(error,response){
          if(error){return next(error);}
          response.info = business;
          res.json(response);
    });
  })
})

router.get('/categories',auth,function(req,res,next){
  Category.find({}).exec(function(err,categories){
    if(err){return next(err);}
    res.json(categories);
  })
})

router.post('/category',auth,function(req,res,next){
  var category = new Category();

  category.id = req.body.id;
  category.name = req.body.name;
  category.description = req.body.description;
  category.image = req.body.image;

  Category.findOne(req.body.name).exec(function(err,tempCat){
    if(err){return next(err)};
    if(category){
      return res.status(400).json({message: 'That Category already exsists!'});
    }else{
      category.save(function(err,category){
        res.json({message: "Success"})
      })
    }
  })
})
router.get('/claim-requests',auth,function(req,res,next){
  var updatedBusinesses = [];
  Business.find({pending:true}).populate({path:'owner',select:'id firstName lastName'}).exec(function(err,businesses){
    if(err){return next(err);}
    async.each(businesses,function(currBusiness,businessCallback){
      // console.log(currBusiness);
      googleplaces.placeDetailsRequest({placeid:currBusiness.placesId},function(error,response){
        if(error){
          return businessCallback(error);
        }
        response.result.info = currBusiness;
        updatedBusinesses.push(response.result)
        businessCallback();
      });
    }, function(err){
        if(err){
          return next(error);
        }
      res.json(updatedBusinesses)
    })
  })
})

router.post('/claim-status',auth,function(req,res,next){
    Business.findOne({"_id":req.body.info._id}).exec(function(err,business){
      business.pending = req.body.pending;
      business.claimed = true;
      User.findOne(business.owner).exec(function(err,user){

        if(err){return handleError(err)};
        user.businesses.push(business._id);
        user.businessPage = business.placesId;
        user.save(function(err,user){

      })
      business.save(function(err){
          if(err){ return next(err); }
          res.json({success:'success'})
        }) 
      })
  })
})

router.post('/business/service',auth,function(req,res,next){
  var id = req.payload._id;
  var service = {};
  service.name = req.body.name;
  service.description = req.body.description;
  service.price = req.body.price;
  User.findOne({"_id": id}).exec(function(err,user){
    if(err){return next(err);}
    console.log(user)
    Business.findOne({"_id":req.body.id}).populate({path:'owner',select:'_id'}).exec(function(err,business){

      if(err){return next(err);}
      console.log(user._id)
      console.log(business.owner._id)
      // if(user._id === business.owner._id){
        console.log("here")
        business.services.push(service);
        business.save(function(err,business){
          if(err){return next(err);}
          res.json(business);
        })
      // }
    })
  })
})

router.post('/business/claim',auth,function(req,res,next){
  var business = new Business();
  var id = req.payload._id;

  business.owner = id; 
  business.category = req.body.category;
  business.placesId = req.body.placesId;
  business.dateCreated = req.body.timestamp;
  business.pending = true;
  business.claimed = false;

  Business.findOne({"placesId":req.body.placesId}).exec(function(err,response){
    if(response){
      return res.status(400).json({message: 'This business has already been claimed or has a request pending.'});
    }
    business.save(function(err,business){
      if(err){return next(err);}
        res.json(business);
      })
  })
})

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
    if(err){ return res.status(400).json({message:"Username taken, please choose another."}); }

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
  User.findOne({"_id": id}).select('_id lastName firstName username avatarVersion businesses').populate({path:'businesses'}).exec(function(err,user){
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
