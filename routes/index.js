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
var _ = require('underscore');

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

Array.prototype.getIndexBy = function (name, value) {
    for (var i = 0; i < this.length; i++) {
        if (this[i][name] == value) {
            return i;
        }
    }
}

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


// var Review = mongoose.model('Review');
var User = mongoose.model('User');
var Business = mongoose.model('Business');
var Appointment = mongoose.model('Appointment');
var Category = mongoose.model('Category');
var Service = mongoose.model('Service');

var auth = jwt({secret: 'SECRET', userProperty: 'payload'});


// console.log(googleplaces)
/**
*   Queries google places for a business based on a 
*   text search.
*
**/

router.get('/query',auth,function(req,res,next){
  var query = req.param('query');

  googleplaces.textSearch({query:query},function(error,response){
    if(error){return next(error);}
    res.json(response);
  })
})

/**
*   Returns a list of all businesses in a specific category
*
**/
// var updatedBusinesses = [];
// googleplaces.radarSearch({location:"40.5278139,-74.4891696",radius:"10000",keyword:"barber"},function(err,response){
//   if(err){return next(err);}
//   async.each(response.results,function(currResponse,responseCallback){
//     Business.findOne({"placesId":currResponse.place_id,"claimed":true}).populate({path:'services',select:''}).exec(function(err,business){
//       if(err){return next(err);}
//       if(business !== null){
//         console.log("BUSINESS:"+business)
//         Service.populate(business.services,{path:'employees',select:'_id appointments firstName lastName username avatarVersion'},function(err,newBusiness){
//           if(err){return next(err);}
//           googleplaces.placeDetailsRequest({placeid:business.placesId},function(error,placesResult){
//             if(error){return responseCallback(error);}
//             console.log("RESULT OF THE GOOGLE PLACES DETAIL SEARCH")
//             placesResult.result.info = business;
//             updatedBusinesses.push(placesResult.result);
//             console.log(updatedBusinesses)
//             responseCallback();
//           });
//         })
//       }else{
//         console.log("not found")
//       }
//     })
//   },function(err){
//     if(err){return console.log(err);}
//     console.log(updatedBusinesses)

//   })
// })
router.get('/business-list',auth,function(req,res,next){
  var keyword = req.param('category');
  var location = req.param('location');
  var radius = req.param('radius');
  console.log(location)
  var updatedBusinesses = [];

  googleplaces.radarSearch({location:location,radius:radius,keyword:keyword},function(err,response){
    if(err){return next(err);}

    async.each(response.results,function(currResponse,responseCallback){
        Business.findOne({"placesId":currResponse.place_id,"claimed":true}).populate({path:'services',select:''}).exec(function(err,business){
            if(err){
              return responseCallback(err);// <== calling responseCallback instead of next() 
            } 
            // in case of business === null/undefined, I'm not seeing any 
            // callback getting called, it needs to be called inside 
            // async.each() no matter which condition it is
            if (!business) {
               // call responseCallback to continue on with async.each()
                return responseCallback();
            }
            Service.populate(business.services,{path:'employees',select:'_id appointments firstName lastName username avatarVersion'},function(err,newBusiness){
                if(err){
                  return responseCallback(err);
                }
                googleplaces.placeDetailsRequest({placeid:business.placesId},function(error,placesResult){
                    if(error){return responseCallback(error);}
                    placesResult.result.info = business;
                    updatedBusinesses.push(placesResult.result);
                    responseCallback();
                });
            })
        })
    },function(err){
        if(err){return next(err);}
        res.json(updatedBusinesses);
    });
  }); 
})

/**
*   Returns an employee object.
*
**/
router.get('/search/employees',auth,function(req,res,next){
  var id = req.param('id');
  User.findOne({"_id":id}).select('_id lastName firstName username avatarVersion').exec(function(error,user){
    if(error){return next(error);}
    res.json(user);
  })
})

/**
*   Adds a new employee to a Business.
*
**/

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

/**
*   Returns all information about a specific Business.
*
**/

router.get('/business-detail',auth,function(req,res,next){
  var id = req.param('placeId');
  Business.findOne({'placesId':id}).populate({path:"employees",select:'_id appointments firstName lastName username avatarVersion'}).exec(function(error,business){
    // Service.populate(business.services,{path:"employees",select:'_id appointments firstName lastName username avatarVersion'},function(err,businessDetail){
      // console.log(businessDetail)
      // console.log(business)
      Business.populate(business,{path:'services',select:''},function(err,newobj){
        Service.populate(newobj.employees,{path:'employees',select:''},function(err,finalobj){
          // console.log(finalobj)
        })
      })
      googleplaces.placeDetailsRequest({placeid:business.placesId},function(error,response){
        if(error){return next(error);}
        response.info = business;
        res.json(response);
      });
    // })
  })
})

/**
*   Returns all categories that Bookd offers
*
**/

router.get('/categories',auth,function(req,res,next){
  Category.find({}).exec(function(err,categories){
    if(err){return next(err);}
    res.json(categories);
  })
})

/**
*   Adds a new category to the Bookd System.
*
**/

router.post('/category',auth,function(req,res,next){
  var category = new Category();

  category.id = req.body.id;
  category.name = req.body.name;
  category.description = req.body.description;
  category.image = req.body.image;

  Category.findOne(req.body.name).exec(function(err,tempCat){
    if(err){return next(err)};
    if(tempCat){
      return res.status(400).json({message: 'That Category already exsists!'});
    }else{
      category.save(function(err,category){
        res.json({message: "Success"})
      })
    }
  })
})

/**
*   Returns all businesses that have requested to be claimed.
*
**/
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
/**
*   Changes the status of a business to approved
*
**/

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

/**
*   Adds a Service to a Business 
*
**/
router.post('/business/service',auth,function(req,res,next){
  var id = req.payload._id;
  var service = new Service();

  service.name = req.body.name;
  service.duration = req.body.duration;
  service.employees = req.body.employees;
  service.description = req.body.description;
  service.price = req.body.price;
  service.businessId = req.body.businessId;

  User.findOne({"_id": id}).exec(function(err,user){
    if(err){return next(err);}
    Business.findOne({"_id":req.body.businessId}).exec(function(err,business){
      if(err){return next(err);}
      //Implement a way to check that the user requesting the new
      //service is indeed the owner of the business. May need to happen
      //on the front end.
      // if(user._id === business.owner._id){
        service.save(function(err,service){
          if(err){return next(err);}
          business.services.push(service);
          business.save(function(err,business){
            if(err){return next(err);}
          })
        })
        Business.populate(business,[{path:'employees',select:'_id appointments firstName lastName username avatarVersion'},{path:'services',selet:''}],function(err,responseBusiness){
          if(err){return next(err);}
          res.json(responseBusiness);
        })
      // }
    })
  })
})
/**
*   Submits a claim request to Bookd 
*
**/
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
/**
*   Logs in a valid user
*
**/

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

/**
*   Registers a new account
*
**/
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
/**
*   Upload a users profile picture
*
**/
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

/**
*   Returns the profile of a specified user. 
*
**/
router.get('/:id/profile',auth,function(req,res,next){
  var id = req.params.id;
  User.findOne({"_id": id}).select('_id lastName firstName username avatarVersion businesses').populate({path:'businesses'}).exec(function(err,user){
    if(err){return handleError(err)};
    var profile = {};
    profile.user= user;
    var updatedBusinesses = [];
    async.each(user.businesses,function(businessObj,employeeCallBack){
      googleplaces.placeDetailsRequest({placeid:businessObj.placesId},function(error,response){
        if(error){
          return employeeCallBack(error);
        }
        response.result.info = businessObj;
        Business.populate(businessObj,{path:'employees',select:'_id appointments firstName lastName username avatarVersion'},function(err,business){
          profile.user.businesses[profile.user.businesses.getIndexBy("_id",businessObj._id)] = response.result;
          employeeCallBack();
        });
        
      })
    },function(err){
      if(err){return next(err);}
      // console.log(profile)
      res.json(profile);
    })
  })
});

/**
*   
*
**/
// router.get('/api/:id/profile',function(req,res,next){
//   var id = req.params.id;
//   User.findOne({"_id": id}).select('_id lastName firstName username avatarVersion').exec(function(err,user){
//     if(err){return handleError(err)};
//       var profile = {};
//       profile.user= user;
//       res.json(profile);
//   })
// });
router.get('/sockettest',function(req,res){
  res.render("page");
})

module.exports = router;
