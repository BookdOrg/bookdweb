//Created by Khalil - 
var express = require('express');
var app = require('express')();
var router = express.Router();
var jwt = require('express-jwt');
var passport = require('passport');
var cloudinary = require('cloudinary');
var Busboy = require('busboy');
var async = require('async');
var moment = require('moment');
require('moment-range');
var GooglePlaces = require('googleplaces');
var googleplaces = new GooglePlaces(process.env.GOOGLE_PLACES_API_KEY, process.env.GOOGLE_PLACES_OUTPUT_FORMAT);
var mongoose = require('mongoose');


var _ = require('underscore');
var User = mongoose.model('User');
var Business = mongoose.model('Business');
var Appointment = mongoose.model('Appointment');
var Category = mongoose.model('Category');
var Service = mongoose.model('Service');

var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

var server = require('http').createServer(app);
var io = require('socket.io')(server);

Array.prototype.inArray = function (comparer) {
    for (var i = 0; i < this.length; i++) {
        if (comparer(this[i])) return true;
    }
    return false;
};

Array.prototype.pushIfNotExist = function (element, comparer) {
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
};
server.listen(process.env.devsocketPort);
var roomData = [];
io.on('connection', function (socket) {
    var string;
    var city, state, zip;
    var socketTimeData = {};
    socket.on('joinApptRoom', function (data) {
        string = data.startDate.toString() + data.id.toString();
        socket.join(string);
        var holdList = _.where(roomData, {id: string});
        io.to(socket.id).emit('oldHold', holdList);
    });
    socket.on('timeTaken', function (data) {
        socketTimeData = data;
        roomData.push({id: string, user: data.user, data: data});
        io.sockets.in(string).emit('newHold', data);
    });
    socket.on('timeDestroyed', function (data) {
        roomData = _.without(roomData, _.findWhere(roomData, {'user': data.user}));
        io.sockets.in(string).emit('destroyOld', data);
    });
    socket.on('online', function (data) {
        city = data.location.city;
        state = data.location.state;
        zip = data.location.zip;
        socket.join(city);
        socket.join(state);
        socket.join(zip);
    });
    socket.on('disconnect', function () {
        roomData = _.without(roomData, _.findWhere(roomData, {'user': socketTimeData.user}));
        io.sockets.in(string).emit('destroyOld', socketTimeData);
    });
});

/**
 *  Returns all appointments for both the employee and the customers trying to schedule an appointment,
 *  Takes in the ID of the employee & the startDate to search for. User ID is grabbed from
 *  auth middleware.
 *
 **/

router.get('/user/appointments', auth, function (req, res, next) {
    var startDate = req.param('startDate');
    var employeeId = req.param('id');
    var userId = req.payload._id;
    var responseArray = [];
    User.findOne({'_id': employeeId}).populate({
        path: 'businessAppointments',
        match: {'start.date': startDate}
    }).exec(function (err, employee) {
        if (err) {
            return next(err);
        }
        responseArray.push(employee.businessAppointments);
        User.findOne({'_id': userId}).populate({
            path: 'personalAppointments',
            match: {'start.date': startDate}
        }).exec(function (err, customer) {
            if (err) {
                return next(err);
            }
            responseArray.push(customer.personalAppointments);
            res.json(responseArray);
        });
    });
});
/**
 *
 * Returns the appointments of a specified user.
 */
router.get('/user/appointments-all', auth, function (req, res, next) {
    var id = req.payload._id;
    var response = {
        personalAppointments: [],
        businessAppointments: []
    };
    Appointment.find({'customer': id}).exec(function (err, customerAppointments) {
        if (err) {
            return next(err);
        }
        response.personalAppointments = customerAppointments;
        Appointment.find({'employee': id}).exec(function (err, employeeAppointments) {
            if (err) {
                return next(err);
            }
            response.businessAppointments = employeeAppointments;
            res.json(response);
        });
    });
});
/**
 *   Returns the profile of a specified user.
 *
 **/
router.get('/user/profile', auth, function (req, res, next) {
    var id = req.param('id');
    User.findOne({'_id': id})
        .select('_id name provider email avatarVersion personalAppointments businessAppointments associatePhotos')
        .populate({path: 'businessAppointments personalAppointments'}).exec(function (err, user) {
        if (err) {
            return next(err);
        }

        var profile = {};
        profile.user = user;
        res.json(profile);
    });
});
/**
 *   Updates the profile of a specified user.
 *
 **/
router.post('/user/profile/update', auth, function (req, res, next) {
    var id = req.payload._id;
    User.findOne({'_id': id}).exec(function (err, user) {
        if (err) {
            return next(err);
        }
        user.associatePhotos = [];
        user.associatePhotos = req.body.photos;

        user.save(function (err) {
            if (err) {
                next(err);
            }
            res.status(200).json({message: 'Success'});
        });

    });
});
/**
 *   Returns a user object
 *
 *  Parameters:
 *  id - The id of the employee.
 **/
router.get('/user/search', auth, function (req, res, next) {
    var email = req.param('email');
    User.findOne({'email': email}).select('_id name avatarVersion').exec(function (error, user) {
        if (error) {
            return next(error);
        }
        res.json(user);
    });
});
/**
 *  Returns all Dashboard information
 *
 *
 */
router.get('/user/dashboard', auth, function (req, res, next) {
    var id = req.payload._id;
    var updatedBusinesses = [];
    User.findOne({'_id': id}).select('_id name avatarVersion businesses').populate('businesses').exec(function (error, user) {
        if (error) {
            return next(error);
        }
        async.each(user.businesses, function (currBusiness, businessCallback) {
            googleplaces.placeDetailsRequest({placeid: currBusiness.placesId}, function (error, placesResult) {
                if (error) {
                    return businessCallback(error);
                }
                placesResult.result.info = currBusiness;
                updatedBusinesses.push(placesResult.result);
                businessCallback();
            });
        }, function (err) {
            if (err) {
                return next(err);
            }
            res.json(updatedBusinesses);
        });
    });
});

/**
 *
 * Updates Users availability
 *
 */

router.post('/user/availability/update', auth, function (req, res, next) {
    var id = req.payload._id;
    var availability = req.body;

    User.findOne({'_id': id}).exec(function (err, user) {
        if (err) {
            return next(err);
        }
        user.availability = availability;

        user.save(function (err, user) {
            if (err) {
                return next(err);
            }
            res.json({token: user.generateJWT()});
        });
    });
});

/**
 *   Logs in a valid user using passport.
 *
 *   Req.body.username == the email of the user, passport requires this be called username
 *
 **/

router.post('/login', function (req, res, next) {
    if (req.body.provider == 'bookd') {
        if (!req.body.username || !req.body.password) {
            return res.status(400).json({message: 'Please fill out all fields'});
        }
        passport.authenticate('local', function (err, user, info) {
            if (err) {
                return next(err);
            }
            if (user) {
                return res.json({token: user.generateJWT()});
            } else {
                return res.status(401).json({message: info.message});
            }
        })(req, res, next);
    }

    if (req.body.provider == 'facebook' || 'google_plus') {
        User.findOne({'email': req.body.username}).exec(function (err, user, info) {
            if (err) {
                return next(err);
            }
            if (user) {
                return res.json({token: user.generateJWT()});
            } else {
                return res.status(401).json({message: 'Incorrect information entered'});
            }
        });
    }
});

/**
 *   Registers a new account
 *
 *   Req.body.username == the email of the user, passport requires this be called username
 *
 **/
router.post('/register', function (req, res, next) {
    var user = new User();
    if (req.body.provider == 'bookd') {
        if (!req.body.username || !req.body.password) {
            return res.status(400).json({message: 'Please fill out all fields'});
        }
        user.setPassword(req.body.password);
    }
    if (req.body.provider == 'facebook' || req.body.provider == 'google_plus') {
        var randomstring = Math.random().toString(36).slice(-8);
        user.setPassword(randomstring);
    }

    user.email = req.body.username;
    user.name = req.body.name;
    user.provider = req.body.provider;


    user.save(function (err, user) {
        if (err) {
            return res.status(400).json({message: "Whoops, looks like you already have an account registered. Try a different provider."});
        }
        return res.json({token: user.generateJWT()});
    });
});
/**
 *   Upload a users profile picture
 *
 **/
router.post('/upload', auth, function (req, res, next) {
    var id = req.payload._id;
    var busboy = new Busboy({headers: req.headers});
    busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {

        var stream = cloudinary.uploader.upload_stream(function (result) {
            User.findOne({'_id': id}, function (err, user) {
                if (err) {
                    return handleError(err);
                }
                user.avatarVersion = result.version;
                user.save(function (err, user) {
                    res.json({token: user.generateJWT()});
                    if (err) {
                        return next(err);
                    }
                });
            });
        }, {public_id: 'profile/' + id});
        file.pipe(stream);
    });
    //busboy.on('finish',function(){
    //
    //})
    req.pipe(busboy);
});
/**
 *   Returns all categories that Bookd offers
 *
 **/

router.get('/categories/all', auth, function (req, res, next) {
    Category.find({}).exec(function (err, categories) {
        if (err) {
            return next(err);
        }
        res.json(categories);
    });
});

/**
 *   Adds a new category to the Bookd System.

 Parameters:
 id-
 name-
 description-
 image- cloudinary id
 *
 **/

router.post('/categories/add-category', auth, function (req, res, next) {
    var category = new Category();

    category.id = req.body.id;
    category.name = req.body.name;
    category.description = req.body.description;
    category.image = req.body.image;

    Category.findOne(req.body.name).exec(function (err, tempCat) {
        if (err) {
            return next(err);
        }
        if (tempCat) {
            return res.status(400).json({message: 'That category already exists!'});
        } else {
            category.save(function (err, category) {
                res.json({message: 'Success'});
            });
        }
    });
});
/**
 *   Creates a new appointment for both the Employee and Customer.
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

router.post('/business/appointments/create', auth, function (req, res, next) {
    var appointment = new Appointment();
    appointment.businessId = req.body.businessid;
    appointment.employee = req.body.employee;
    appointment.customer = req.payload._id;
    appointment.service = req.body.service;
    appointment.start = req.body.start;
    appointment.end = req.body.end;
    appointment.title = req.body.title;
    appointment.timestamp = req.body.timestamp;
    appointment.card = req.body.card;
    var room = appointment.start.date.toString() + appointment.employee.toString();
    var responseArray = [];

    function validateAppointment(requestedAppointment, userAppointments) {
        for (var appointmentIndex = 0; appointmentIndex < userAppointments.length; appointmentIndex++) {
            if (moment(userAppointments[appointmentIndex].start.time, 'hh:mm a ').
                isSame(moment(requestedAppointment.start.time, 'hh:mm a'))) {
                return res.status(400).json([{message: 'This appointment conflicts with a previously scheduled time'}, {data: [userAppointments[appointmentIndex], requestedAppointment]}]);
            }
            if (moment(requestedAppointment.start.time, 'hh:mm a').
                isBetween(moment(userAppointments[appointmentIndex].start.time, 'hh:mm a'), moment(userAppointments[appointmentIndex].end.time, 'hh:mm a'), 'minute')) {
                return res.status(400).json([{message: 'This appointment conflicts with a previously scheduled time'}, {data: [userAppointments[appointmentIndex], requestedAppointment]}]);
            }
        }
        for (var appointmentIndex = 0; appointmentIndex < userAppointments.length; appointmentIndex++) {
            if (moment(userAppointments[appointmentIndex].start.time, 'hh:mm a ').
                isSame(moment(requestedAppointment.start.time, 'hh:mm a'))) {
                return res.status(400).json([{message: 'This appointment conflicts with a previously scheduled time'}, {data: [userAppointments[appointmentIndex], requestedAppointment]}]);
            }
            if (moment(requestedAppointment.start.time, 'hh:mm a').
                isBetween(moment(userAppointments[appointmentIndex].start.time, 'hh:mm a'), moment(userAppointments[appointmentIndex].end.time, 'hh:mm a'), 'minute')) {
                return res.status(400).json([{message: 'This appointment conflicts with a previously scheduled time'}, {data: [userAppointments[appointmentIndex], requestedAppointment]}]);
            }
        }
    }

    appointment.save(function (err, appointment) {
        if (err) {
            return next(err);
        }
        User.findOne({'_id': appointment.employee}).populate({
            path: 'businessAppointments personalAppointments',
            match: {'start.date': appointment.start.date}
        }).exec(function (err, user) {
            if (err) {
                return next(err);
            }
            validateAppointment(appointment, user.businessAppointments);
            validateAppointment(appointment, user.personalAppointments);
            user.businessAppointments.push(appointment);
            user.save(function (err, response) {
                if (err) {
                    return next(err);
                }
            });
        });
        User.findOne({'_id': appointment.customer}).populate({
            path: 'businessAppointments personalAppointments',
            match: {'start.date': appointment.start.date}
        }).exec(function (err, user) {
            if (err) {
                return next(err);
            }
            validateAppointment(appointment, user.businessAppointments);
            validateAppointment(appointment, user.personalAppointments);
            user.personalAppointments.push(appointment);
            user.save(function (err, response) {
                if (err) {
                    return next(err);
                }
            });
        });
        io.sockets.in(room).emit('update');
        res.status(200).json({message: 'Success!'});
    });
});

/**
 *
 * Update an appointment - Reschedule
 *
 *
 */
router.post('/business/appointments/update', auth, function (req, res, next) {

    var updatedAppointmentStart = req.body.start;
    var updatedAppointmentEnd = req.body.end;
    var updatedAppointmentId = req.body._id;

    if (req.body.customer == req.payload._id) {
        console.log("updated");
        Appointment.findOne({'_id': updatedAppointmentId}).exec(function (err, appointment) {
            if (err) {
                return next(err);
            }
            appointment.start = updatedAppointmentStart;
            appointment.end = updatedAppointmentEnd;
            if (appointment.status == 'pending') {
                appointment.status = '';
                User.findOne({'_id': req.body.employee}).exec(function (err, user) {
                    if (err) {
                        next(err);
                    }
                    user.businessAppointments.push({_id: appointment._id});
                    user.save(function (err) {
                        if (err) {
                            return next(err);
                        }
                    });
                });
            }
            appointment.save(function (err, response) {
                if (err) {
                    return next(err);
                }
                res.status(200).json({message: 'Success'});
            });
        });
    } else {
        Appointment.findOne({'_id': updatedAppointmentId}).exec(function (err, appointment) {
            if (err) {
                return next(err);
            }
            appointment.status = 'pending';
            appointment.start = updatedAppointmentStart;
            appointment.end = updatedAppointmentEnd;
            appointment.save(function (err, response) {
                if (err) {
                    return next(err);
                }
            });
            User.findOne({'_id': req.body.employee}).exec(function (err, user) {
                if (err) {
                    return next(err);
                }
                user.businessAppointments.pull({_id: appointment._id});
                user.save(function (err, user) {
                    if (err) {
                        return next(err);
                    }
                });

            });
            User.findOne({'_id': req.body.customer}).exec(function (err, user) {
                if (err) {
                    return next(err);
                }
                //user.personalAppointments.pull({_id:appointment._id});
                //TODO notify the user that the employee has requested to reschedule
                var notification = {
                    'title': 'Appointment Reschedule Requested',
                    'appointment': appointment,
                    'proposed': {
                        'proposedStart': updatedAppointmentStart,
                        'proposedEnd': updatedAppointmentEnd
                    }
                };
                //user.notifications.push(notification);
                user.save(function (err, user) {
                    if (err) {
                        return next(err);
                    }
                    res.status(200).json({message: 'Success'});
                });
            });
        });
    }

});
/**
 *
 * Cancel an appointment - Delete
 *
 */
/**
 *
 * Update an appointment - Reschedule
 *
 *
 */
router.post('/business/appointments/cancel', auth, function (req, res, next) {
    var appointment = req.body.id;

    Appointment.findOneAndRemove({'id': appointment._id}, function (err, count) {
        if (err) {
            return next(err);
        }
        res.status(200).json({message: 'Success'});
    });
});


/**
 *   Queries & returns google places for a business based on a
 *   text search.
 *
 **/
//
router.get('/business/search', auth, function (req, res, next) {
    var query = req.param('query');
    var updatedBusinesses = [];
    var populateQuery = [{path: 'services', select: ''}, {
        path: 'employees',
        select: '_id businessAppointments name avatarVersion'
    }];
    googleplaces.textSearch({query: query}, function (error, response) {
        if (error) {
            return next(error);
        }
        async.each(response.results, function (currResponse, responseCallback) {
            Business.findOne({
                'placesId': currResponse.place_id,
                'claimed': true
            }).populate(populateQuery).exec(function (err, business) {
                if (err) {
                    return responseCallback(err);// <== calling responseCallback instead of next()
                }
                // in case of business === null/undefined, I'm not seeing any
                // callback getting called, it needs to be called inside
                // async.each() no matter which condition it is
                if (!business) {
                    // call responseCallback to continue on with async.each()
                    return responseCallback();
                }
                Service.populate(business.services, {
                    path: 'employees',
                    select: '_id businessAppointments name avatarVersion'
                }, function (err, newBusiness) {
                    if (err) {
                        return responseCallback(err);
                    }
                    googleplaces.placeDetailsRequest({placeid: business.placesId}, function (error, placesResult) {
                        if (error) {
                            return responseCallback(error);
                        }
                        placesResult.result.info = business;
                        updatedBusinesses.push(placesResult.result);
                        responseCallback();
                    });
                });
            });
        }, function (err) {
            if (err) {
                return next(err);
            }
            res.json(updatedBusinesses);
        });
        // res.json(response);
    });
});

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
// TO DO: combine with the business/search route

//router.get('/business/nearby',auth,function(req,res,next){
//  var keyword = req.param('category');
//  var location = req.param('location');
//  var radius = req.param('radius');
//  var updatedBusinesses = [];
//  var populateQuery = [{path:'services',select:''},{path:'employees',select:'_id businessAppointments firstName lastName username avatarVersion'}];
//
//  googleplaces.placeSearch({location:location,radius:radius,keyword:keyword},function(err,response){
//    if(err){return next(err);}
//    async.each(response.results,function(currResponse,responseCallback){
//        Business.findOne({"placesId":currResponse.place_id,"claimed":true}).populate(populateQuery).exec(function(err,business){
//            if(err){
//              return responseCallback(err);// <== calling responseCallback instead of next()
//            }
//            // in case of business === null/undefined, I'm not seeing any
//            // callback getting called, it needs to be called inside
//            // async.each() no matter which condition it is
//            if (!business) {
//               // call responseCallback to continue on with async.each()
//                return responseCallback();
//            }
//            Service.populate(business.services,{path:'employees',select:'_id businessAppointments firstName lastName username avatarVersion'},function(err,newBusiness){
//                if(err){
//                  return responseCallback(err);
//                }
//                googleplaces.placeDetailsRequest({placeid:business.placesId},function(error,placesResult){
//                    if(error){return responseCallback(error);}
//                    placesResult.result.info = business;
//                    updatedBusinesses.push(placesResult.result);
//                    responseCallback();
//                });
//            })
//        })
//    },function(err){
//        if(err){return next(err);}
//        res.json(updatedBusinesses);
//    });
//  });
//});

/**
 *   Returns all information about a specific Business.

 Parameters:
 placeId -
 *
 **/
router.get('/business/details', auth, function (req, res, next) {
    var id = req.param('placesId');
    Business.findOne({'placesId': id}).populate([{
        path: 'employees',
        select: '_id businessAppointments name avatarVersion'
    }, {path: 'services', select: ''}]).exec(function (error, business) {
        if (error) {
            return next(error);
        }
        googleplaces.placeDetailsRequest({placeid: business.placesId}, function (error, response) {
            if (error) {
                return next(error);
            }
            Service.populate(business.services, {
                path: 'employees',
                select: '_id businessAppointments name avatarVersion availability'
            }, function (err, finalobj) {
                if (error) {
                    return next(error);
                }
                response.result.info = business;
                res.json(response.result);
            });
        });
    });
});
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
 *   Adds a new employee to a Business.

 Parameters:
 businessId -
 employeeId -
 *
 **/

router.post('/business/add-employee', auth, function (req, res, next) {
    var businessId = req.body.businessId;
    var employeeId = req.body.employeeId;

    User.findOne({'_id': employeeId}).exec(function (err, user) {
        if (err) {
            return next(err);
        }
        user.isAssociate = true;

        user.availability = [
            {
                day: 'Monday',
                start: moment().hour(6).minute(0).format(),
                end: moment().hour(19).minute(0).format(),
                gaps: [],
                available: false
            },
            {
                day: 'Tuesday',
                start: moment().hour(6).minute(0).format(),
                end: moment().hour(19).minute(0).format(),
                gaps: [],
                available: false
            },
            {
                day: 'Wednesday',
                start: moment().hour(6).minute(0).format(),
                end: moment().hour(19).minute(0).format(),
                gaps: [],
                available: false
            },
            {
                day: 'Thursday',
                start: moment().hour(6).minute(0).format(),
                end: moment().hour(19).minute(0).format(),
                gaps: [],
                available: false
            },
            {
                day: 'Friday',
                start: moment().hour(6).minute(0).format(),
                end: moment().hour(19).minute(0).format(),
                gaps: [],
                available: false
            },
            {
                day: 'Saturday',
                start: moment().hour(6).minute(0).format(),
                end: moment().hour(19).minute(0).format(),
                gaps: [],
                available: false
            },
            {
                day: 'Sunday',
                start: moment().hour(6).minute(0).format(),
                end: moment().hour(19).minute(0).format(),
                gaps: [],
                available: false
            }
        ];
        user.save(function (err, response) {
            if (err) {
                return next(err);
            }
        });

    });

    Business.findOne({'_id': businessId}).exec(function (err, response) {
        response.employees.pushIfNotExist(employeeId, function (e) {
            return e == employeeId;
        });
        response.save(function (err) {
            if (err) {
                return next(err);
            }
        });
        Business.populate(response, [{
            path: 'employees',
            select: '_id appointments name avatarVersion availability'
        }, {path: 'services', select: ''}], function (err, busResponse) {
            if (err) {
                return next(err);
            }
            Service.populate(busResponse.services, {
                path: 'employees',
                select: '_id appointments name avatarVersion availability'
            }, function (err, services) {
                if (err) {
                    return next(err);
                }
                busResponse.services = services;
                res.json(busResponse);
            });
        });
    });
});

/**
 *   Deletes an employee from a Business.

 Parameters:
 businessId -
 employeeId -
 *
 **/

router.post('/business/remove-employee', auth, function (req, res, next) {
    var businessId = req.body.businessId;
    var employeeId = req.body.employeeId;
    var serviceIds = req.body.serviceList;

    //find business that employee is being removed from
    Business.findOne({'_id': businessId}).exec(function (err, response) {
        var index = response.employees.indexOf(employeeId);

        if (index > -1) {
            response.employees.splice(index, 1);
            response.save(function (err) {
                if (err) {
                    return next(err);
                }
            });
        } else {
            console.log('employeeID not associated with this business. id=', employeeId);
        }

        //need to convert string to objectIds for the Service 'find $in' query to work
        for (var i = 0; i < serviceIds.length; i++) {
            serviceIds[i] = mongoose.Types.ObjectId(serviceIds[i]);
        }
        //find all service(s) employee was part of
        Service.find({'_id': {$in: serviceIds}}).exec(function (err, services) {
            //services - an array of services

            for (var serviceIndex = 0; serviceIndex < services.length; serviceIndex++) {
                var service = services[serviceIndex];
                var employeeIndex = service.employees.indexOf(employeeId);

                if (employeeIndex > -1) {
                    service.employees.splice(employeeIndex, 1);
                    service.save(function (err) {
                        if (err) {
                            return next(err);
                        }
                    });
                } else {
                    console.log('employee not found in service');
                }
            }
            Business.populate(response, [{
                path: 'employees',
                select: '_id appointments name avatarVersion availability'
            }, {path: 'services', select: ''}], function (err, busResponse) {
                if (err) {
                    return next(err);
                }
                Service.populate(busResponse.services, {
                    path: 'employees',
                    select: '_id appointments name avatarVersion availability'
                }, function (err, services) {
                    if (err) {
                        return next(err);
                    }
                    busResponse.services = services;
                    res.json(busResponse);
                });
            });
        });
    });
});

/**
 *   Returns all businesses that have requested to be claimed.
 *
 **/
router.get('/business/pending-requests', auth, function (req, res, next) {
    var updatedBusinesses = [];
    Business.find({pending: true}).populate({
        path: 'owner',
        select: 'id name'
    }).exec(function (err, businesses) {
        if (err) {
            return next(err);
        }
        async.each(businesses, function (currBusiness, businessCallback) {
            googleplaces.placeDetailsRequest({placeid: currBusiness.placesId}, function (error, response) {
                if (error) {
                    return businessCallback(error);
                }
                response.result.info = currBusiness;
                updatedBusinesses.push(response.result);
                businessCallback();
            });
        }, function (err) {
            if (err) {
                return next(err);
            }
            res.json(updatedBusinesses);
        });
    });
});
/**
 *   Changes the status of a business to approved


 Parameters:
 id - The BOOKD id of a business.
 *
 **/

router.post('/business/update-request', auth, function (req, res, next) {
    Business.findOne({'_id': req.body.info._id}).exec(function (err, business) {
        business.pending = req.body.pending;
        business.claimed = true;
        User.findOne(business.owner).exec(function (err, user) {

            if (err) {
                return handleError(err);
            }
            user.businesses.push(business._id);
            user.businessPage = business.placesId;
            user.businessOwner = true;
            user.save(function (err, user) {

            });
            business.save(function (err, business) {
                if (err) {
                    return next(err);
                }
                res.json({success: 'success'});
            });
        });
    });
});

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
router.post('/business/add-service', auth, function (req, res, next) {
    //var id = req.payload._id;
    var service = new Service();

    service.name = req.body.name;
    service.duration = req.body.duration;
    service.employees = req.body.employees;
    service.description = req.body.description;
    service.price = req.body.price;
    service.businessId = req.body.businessId;

    //User.findOne({"_id": id}).exec(function(err,user){
    //if(err){return next(err);}
    Business.findOne({'_id': req.body.businessId}).exec(function (err, business) {
        if (err) {
            return next(err);
        }
        //Implement a way to check that the user requesting the new
        //service is indeed the owner of the business. May need to happen
        //on the front end.
        // if(user._id === business.owner._id){
        service.save(function (err, service) {
            if (err) {
                return next(err);
            }
            business.services.push(service);
            business.save(function (err, business) {
                if (err) {
                    return next(err);
                }
            });
        });
        Business.populate(business, [{
            path: 'employees',
            select: '_id appointments name avatarVersion availability'
        }, {path: 'services', select: ''}], function (err, responseBusiness) {
            if (err) {
                return next(err);
            }
            Service.populate(responseBusiness.services, {
                path: 'employees',
                select: '_id appointments name avatarVersion availability'
            }, function (err, services) {
                if (err) {
                    return next(err);
                }
                responseBusiness.services = services;
                res.json(responseBusiness);
            });
        });
    });
});

/**
 *
 * Update a Service
 *
 */

router.post('/business/update-service', auth, function (req, res, next) {
    var newService = {
        '_id': req.body._id,
        'businessId': req.body.businessId,
        'description': req.body.description,
        'duration': req.body.duration,
        'employees': req.body.employees,
        'name': req.body.name,
        'price': req.body.price
    };
    Service.findOneAndUpdate({'_id': newService._id}, newService, {upsert: true}).populate({
        path: 'employees',
        select: '_id businessAppointments appointments name avatarVersion availability'
    }).exec(function (err, service) {
        if (err) {
            return next(err);
        }
        res.json(service);
    });
});

/**
 * Removes a Service from a Business
 *
 */
router.post('/business/remove-service', auth, function (req, res, next) {
    var serviceId = req.body.serviceId;

    Service.remove({'_id': serviceId}).exec(function (err, result) {
        if (err) {
            return next(err);
        }
    });

    //TODO businessId, index, response are all non existent, how does this work?
    Business.findOne({'_id': businessId}).exec(function (err, business) {
        if (index > -1) {
            response.services.splice(index, 1);
            response.save(function (err) {
                if (err) {
                    return next(err);
                }
            });
        } else {
            //console.log('serviceId not associated with this business. id=', serviceId);
        }

        Business.populate(response, [{
            path: 'employees',
            select: '_id appointments name avatarVersion availability'
        }, {path: 'services', select: ''}], function (err, busResponse) {
            if (err) {
                return next(err);
            }
            Service.populate(busResponse.services, {
                path: 'employees',
                select: '_id appointments name avatarVersion availability'
            }, function (err, services) {
                if (err) {
                    return next(err);
                }
                busResponse.services = services;
                res.json(busResponse);
            });
        });
    });
});

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
router.post('/business/claim-request', auth, function (req, res, next) {
    var business = new Business();

    business.owner = req.payload._id;
    business.category = req.body.category;
    business.placesId = req.body.placesId;
    business.dateCreated = req.body.timestamp;
    business.pending = true;
    business.claimed = false;

    Business.findOne({"placesId": req.body.placesId}).exec(function (err, response) {
        if (response) {
            return res.status(400).json({message: 'This business has already been claimed or has a request pending.'});
        }
        business.save(function (err, business) {
            if (err) {
                return next(err);
            }
            res.json(business);
        });
    });
});

/***
 *
 * Get the Details for a Given Service
 *
 *
 */

router.get('/business/service-detail', auth, function (req, res, next) {
    var serviceId = req.param('service');
    Service.findOne({"_id": serviceId}).populate({
        path: 'employees',
        select: '_id appointments name avatarVersion availability provider'
    }).exec(function (err, response) {
        if (err) {
            return next(err);
        }
        res.json(response);
    });
});

module.exports = router;
