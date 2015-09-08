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
var moment = require('moment');
require('moment-range');

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
server.listen(8112);
io.on('connection',function(socket){
  socket.on('joinApptRoom',function(data){
    socket.join(data.startDate);
  });
  // socket.on('receiveAppts',function(){
  //   Appointment.find({"start":data.startDate,"employee":data.employeeId}).exec(function(err,appointments){
  //     io.sockets.in(data.startDate).emit('employeeAppts',appointments);
  //   })
  // })
});

// socket.on('joinApptRoom',function(data){
//     socket.join(data.employeeId);
//     console.log(data);
//     Appointments.find({"startDate":data.startDate,"userId":data.employeeId}).exec(function(err,appointments){
//       io.sockets.in(data.employeeId).emit('employeeAppts',appointments);
//     })
//   });


/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: '' });
});

var mongoose = require('mongoose');
acl = new acl(new acl.mongodbBackend(mongoose.connection.db,'acl_'));


// var Review = mongoose.model('Review');
var User = mongoose.model('User');
var Business = mongoose.model('Business');
var Appointment = mongoose.model('Appointment');
var Category = mongoose.model('Category');
var Service = mongoose.model('Service');

var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

/**
*  Returns all appointments for both the employee and the user trying to schedule an appointment,
*  Takes in the ID of the employee & the startDate to search for. User ID is grabbed from  
*  auth middleware. 
*
**/

router.get('/employee/appointments',auth,function(req,res,next){
  var startDate = req.param('startDate');
  var employeeId = req.param('id');
  var userId = req.payload._id;
  var responseArray = [];
  User.findOne({"_id":employeeId}).populate({path:"businessAppointments",match:{'start.date':startDate}}).exec(function(err,employee){
    if(err){return next(err);}
    responseArray.push(employee.businessAppointments);
    User.findOne({"_id":userId}).populate({path:"personalAppointments",match:{'start.date':startDate}}).exec(function(err,customer){
      if(err){return next(err);}
      responseArray.push(customer.personalAppointments);
      res.json(responseArray);
    })
  })
})

/**
*   Creates a new appointment on both the Employee and User. 
*   Takes in the appointment object. 
*   
*    Parameters: 
*               businessId - 
                employee - 
                customer - 
                start - 
                end - 
                title -
                timestamp - 
                card - 
**/

router.post("/appointment",auth,function(req,res,next){
  var appointment = new Appointment();
  appointment.businessId = req.body.businessid;
  appointment.employee = req.body.employee;
  appointment.customer = req.payload._id;

  appointment.start = req.body.start;
  appointment.end = req.body.end;
  appointment.title = req.body.title;
  appointment.timestamp = req.body.timestamp;
  appointment.card = req.body.card;

  appointment.save(function(err,appointment){
    if(err){return next(err);}
    User.findOne({"_id":appointment.employee}).exec(function(err,user){
      if(err){return next(err);}
      console.log(user)
      user.businessAppointments.push(appointment);
      user.save(function(err,response){
        if(err){return next(err);}
      }) 
    })
    User.findOne({"_id":appointment.customer}).exec(function(err,user){
      if(err){return next(err);}
      user.personalAppointments.push(appointment);
      user.save(function(err,response){
        if(err){return next(err);}
      })  
    })
      res.status(200).json({message: 'Success!'})
  })
})

// router.get('/user/appointments',auth, function(req,res,next){
//   var startDate = req.param('startDate');
//   var userId = req.payload._id;
//   User.findOne({"_id":userId}).populate({path:"personalAppointments",match:{'start.date':startDate}}).exec(function(err,user){
//     if(err){return next(err);}
//     res.json(user.personalAppointments);
//   })
// })


/**
*   Queries google places for a business based on a 
*   text search.
*
**/

router.get('/query',auth,function(req,res,next){
  var query = req.param('query');
  var updatedBusinesses = [];
  var populateQuery = [{path:'services',select:''},{path:'employees',select:'_id businessAppointments firstName lastName username avatarVersion'}];
  googleplaces.textSearch({query:query},function(error,response){
    if(error){return next(error);}
    async.each(response.results,function(currResponse,responseCallback){
        Business.findOne({"placesId":currResponse.place_id,"claimed":true}).populate(populateQuery).exec(function(err,business){
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
            Service.populate(business.services,{path:'employees',select:'_id businessAppointments firstName lastName username avatarVersion'},function(err,newBusiness){
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
    // res.json(response);
  })
})

/**
*   Returns a list of all businesses in a specific category that are within the defined 
*   search radius. Radar Search returns a list of 200 businesses maximum. 

    Update this route to remote the google places detail request. Instead of caching results
    from the Business List page on the front/end just make a second call for details when they
    click which business they want details for. 


    Parameters:
            category -
            location - 
            radius - 
*
**/
router.get('/business-list',auth,function(req,res,next){
  var keyword = req.param('category');
  var location = req.param('location');
  var radius = req.param('radius');
  var updatedBusinesses = [];
  var populateQuery = [{path:'services',select:''},{path:'employees',select:'_id businessAppointments firstName lastName username avatarVersion'}];

  googleplaces.placeSearch({location:location,radius:radius,keyword:keyword},function(err,response){
    if(err){return next(err);}
    async.each(response.results,function(currResponse,responseCallback){
        Business.findOne({"placesId":currResponse.place_id,"claimed":true}).populate(populateQuery).exec(function(err,business){
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
            Service.populate(business.services,{path:'employees',select:'_id businessAppointments firstName lastName username avatarVersion'},function(err,newBusiness){
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
});

/**
*   Returns all information about a specific Business.

    Parameters:
              placeId -
*
**/
router.get('/business-detail',auth,function(req,res,next){
  var id = req.param('placesId');
  Business.findOne({'placesId':id}).populate([{path:"employees",select:'_id businessAppointments firstName lastName username avatarVersion'},{path:'services',select:''}]).exec(function(error,business){
    if(error){return next(error);}
    googleplaces.placeDetailsRequest({placeid:business.placesId},function(error,response){
        if(error){return next(error);}
        Service.populate(business.services,{path:'employees',select:'_id businessAppointments firstName lastName username avatarVersion'},function(err,finalobj){
          if(error){return next(error);}
          response.info = business;
          res.json(response);
        })
    });  
  })
})
// router.get('/appointments/employee',auth,function(req,res,next){
//    var userId = req.body.id;
//    var startDate = req.body.startDate;

//   Appointment.find({"user":userId,"start.date":startDate}).exec(function(err,appointments){
//     appointments.forEach(function(appt){
//       *
//       *
//       * Check to see if the appointment in the request is in the range of any 
//       * appointments happening on the same day as it. 
//       *
//       * Look at the day first and then the minute and hour of the appointment.
//       * If it is in the range, respond to the client with 400 and state that the appointment is taken. 
//       * Also may want to return the updated list of appointments incase someone has already taken it. 
      
//     })
//   })
// })

/**
*
* Can I use socket.io to keep the available appointment times in sync, 
* stopping users from scheduling appointments that have already been taken?
* 
* If this works will we still need to check the range on the POST request? Yes.
*
*/

// router.get('/appointments/business',auth,function(req,res,next){

// })
/**
*   Returns an employee object
*
    Parameters: 
            id - The id of the employee. 
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

    Parameters:
              businessId - 
              employeeId -
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
    Business.populate(response,[{path:"employees",select:'_id appointments firstName lastName username avatarVersion'},{path:"services",select:''}],function(err,busResponse){
      if(err){return next(err);}
      Service.populate(busResponse.services,{path:'employees',select:'_id appointments firstName lastName username avatarVersion'},function(err,services){
        if(err){return next(err);}
        busResponse.services = services;
        res.json(busResponse);
      })
    })
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

    Parameters:
              id-
              name-
              description-
              image- cloudinary id
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


    Parameters:
              id - The BOOKD id of a business.
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


    Parameters:
              name-
              duration-
              employees-
              description-
              price-
              businessId-
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
        Business.populate(business,[{path:'employees',select:'_id appointments firstName lastName username avatarVersion'},{path:'services',select:''}],function(err,responseBusiness){
          if(err){return next(err);}
          Service.populate(responseBusiness.services,{path:'employees',select:'_id appointments firstName lastName username avatarVersion'},function(err,services){
            if(err){return next(err);}
            console.log(services)
            responseBusiness.services = services;
            console.log(responseBusiness)
            res.json(responseBusiness);
          })      
        })
      // }
    })
  })
})
/**
*   Submits a claim request to Bookd 


    Parameters:
              id-
              category-
              placesId-
              dateCreated-
              timestamp-
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
*   Logs in a valid user using passport.
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
  User.findOne({"_id": id}).select('_id lastName firstName username avatarVersion personalAppointments businessAppointments').populate({path:'businessAppointments personalAppointments'}).exec(function(err,user){
    if(err){return handleError(err)};
    var profile = {};
    profile.user= user;
    var updatedBusinesses = [];
    // async.each(user.businesses,function(businessObj,employeeCallBack){
    //   googleplaces.placeDetailsRequest({placeid:businessObj.placesId},function(error,response){
    //     if(error){
    //       return employeeCallBack(error);
    //     }
    //     response.result.info = businessObj;
    //     Business.populate(businessObj,{path:'employees',select:'_id appointments firstName lastName username avatarVersion'},function(err,business){
    //       profile.user.businesses[profile.user.businesses.getIndexBy("_id",businessObj._id)] = response.result;
    //       employeeCallBack();
    //     });
        
    //   })
    // },function(err){
    //   if(err){return next(err);}
      res.json(profile);
    // })
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
