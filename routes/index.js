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
var _ = require('lodash');
var stripe = require('stripe')(process.env.stripeDevSecret);
var nodemailer = require('nodemailer');
var request = require('request');

var User = mongoose.model('User');
var Business = mongoose.model('Business');
var Appointment = mongoose.model('Appointment');
var Category = mongoose.model('Category');
var Service = mongoose.model('Service');
var Notification = mongoose.model('Notification');

var auth = jwt({secret: process.env.jwtSecret, userProperty: 'payload'});
var server = require('http').createServer(app);
var io = require('socket.io')(server);

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'contact.bookd@gmail.com',
        pass: process.env.emailPass
    }
});

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
var clients = [];
var employeeAppointmentsArray = [];
var userAppointmentsArray = [];
var businessAppointmentsArray = [];

io.on('connection', function (socket, data) {
    var string;
    var city, state, zip;
    var socketTimeData = {};
    io.to(socket.id).emit('authorizationReq', socket.id);
    socket.on('error', function (data) {
        console.log(data);
    });
    socket.on('authorizationRes', function (data) {
        var client = {};
        client.customId = data;
        client.id = socket.id;
        clients.push(client);
    });
    //console.log(socket);
    socket.on('online', function (data) {
        //socket.join(data.user);

        //city = data.location.city;
        //state = data.location.state;
        //zip = data.location.zip;
        //socket.join(city);
        //socket.join(state);
        //socket.join(zip);
    });
    socket.on('joinApptRoom', function (data) {
        string = data.startDate.toString() + data.employeeId.toString();
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
        if (data) {
            roomData = _.without(roomData, _.findWhere(roomData, {'user': data.user}));
        }
        io.sockets.in(string).emit('destroyOld', data);
    });
    socket.on('disconnect', function () {
        roomData = _.without(roomData, _.findWhere(roomData, {'user': socketTimeData.user}));
        io.sockets.in(string).emit('destroyOld', socketTimeData);
        clients = _.without(clients, _.findWhere(clients, {'id': socket.id}));
        socket.disconnect();
    });
    socket.on('joinCalendarRoom', function (id) {
        socket.join(id);
    });
    //Join the business dashboard room, id = Business ID
    socket.on('joinDashboardRoom', function (id) {
        socket.join(id);
    });
    socket.on('leaveDashboardRoom',function(id){
        socket.leave(id);
    });
    socket.on('apptBooked', function (appt) {
        var employeeSocket = _.findWhere(clients, {'customId': appt.employee});
        var customerSocket = _.findWhere(clients, {'customId': appt.customer});
        if (appt.personal && employeeSocket) {
            io.sockets.in(appt.businessId).emit('newAppt', appt);
            io.to(employeeSocket.id).emit('newAssociateAppt', appt);
        } else if (employeeSocket) {
            io.to(employeeSocket.id).emit('newAssociateAppt', appt);
            io.sockets.in(appt.businessId).emit('newAppt', appt);
        }
    });
    /**
     *
     * Probably consolidate update & cancel into one
     *
     */
    socket.on('apptUpdated', function (data) {
        var employeeSocket = _.findWhere(clients, {'customId': data.appointment.employee});
        var customerSocket = _.findWhere(clients, {'customId': data.appointment.customer});
        if (data.from === data.appointment.customer && employeeSocket) {
            io.to(employeeSocket.id).emit('updatedAppt', data);
            io.sockets.in(data.appointment.businessId).emit('updatedAppt', data.appointment);
        }
        if (data.from === data.appointment.employee && customerSocket) {
            io.to(customerSocket.id).emit('updatedAppt', data);
            io.sockets.in(data.appointment.businessId).emit('updatedAppt', data.appointment);
        }
        if (data.from === data.appointment.employee && !customerSocket) {
            io.sockets.in(data.appointment.businessId).emit('updatedAppt', data.appointment);
        }
        if (data.from !== data.appointment.employee && data.from !== data.appointment.customer) {
            if (customerSocket) {
                io.to(customerSocket.id).emit('updatedAppt', data);
            }
            if (employeeSocket) {
                io.to(employeeSocket.id).emit('updatedAppt', data);
            }
        }
    });
    socket.on('apptCanceled', function (data) {
        var employeeSocket = _.findWhere(clients, {'customId': data.appointment.employee});
        var customerSocket = _.findWhere(clients, {'customId': data.appointment.customer});
        io.sockets.in(data.appointment.businessId).emit('canceledAppt', data);
        if (data.from === data.appointment.customer && employeeSocket) {
            io.to(employeeSocket.id).emit('canceledAppt', data);
        }
        if (data.from === data.appointment.employee && customerSocket) {
            io.to(customerSocket.id).emit('canceledAppt', data);
        }
        if(data.from !== data.appointment.employee && data.from !== data.appointment.customer){
            if(customerSocket){
                io.to(customerSocket.id).emit('canceledAppt', data);
            }
            if(employeeSocket){
                io.to(employeeSocket.id).emit('canceledAppt', data);
            }
        }
    });
    socket.on('isEmployee', function (data) {
        User.findOne({'_id': data}).exec(function (err, user) {
            if (err) {
                console.log(err);
                //TODO send the socket error back to the client
                //return next(err);
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
                    //TODO send the socket error back to the client
                    //return next(err);
                }
                io.sockets.in(data).emit('clientUpdate', {token: user.generateJWT()});
                //if (socket.rooms.indexOf(data) >= 0) {
                //    console.log('here')
                //
                //}
            });

        });
    });
});

/**
 *  Returns all appointments for both the employee and the customer trying to schedule an appointment,
 *  Takes in the ID of the employee & the startDate to search for. User ID is grabbed from
 *  auth middleware.
 *
 **/
router.get('/user/appointments', auth, function (req, res, next) {
    var startDate = req.param('startDate');
    var employeeId = req.param('employeeId');
    var customerId = req.param('customerId');

    var personal = req.param('personal');
    var responseArray = [];

    User.findOne({'_id': employeeId}).populate({
        path: 'businessAppointments personalAppointments',
        match: {'start.date': startDate}
    }).exec(function (err, employee) {
        if (err) {
            return next(err);
        }
        if (employee) {
            responseArray.push(employee.businessAppointments);
            responseArray.push(employee.personalAppointments);
        }
        if (personal === 'true') {
            User.findOne({'_id': customerId}).populate({
                path: 'personalAppointments businessAppointments',
                match: {'start.date': startDate}
            }).exec(function (err, customer) {
                if (err) {
                    return next(err);
                }
                if(customer){
                    responseArray.push(customer.personalAppointments);
                    responseArray.push(customer.businessAppointments);
                }
                res.json(responseArray);
            });
        } else {
            res.json(responseArray);
        }

    });
});

/**
 *
 * Returns the appointments of a specified user.
 */
router.get('/user/appointments-all', auth, function (req, res, next) {
    var id;
    if (req.param('id') !== undefined) {
        id = req.param('id');
    } else {
        id = req.payload._id;
    }
    var monthYear = req.param('monthYear');
    var response = {
        personalAppointments: [],
        businessAppointments: []
    };
    Appointment.find({'customer': id, 'start.monthYear': monthYear}).exec(function (err, customerAppointments) {
        if (err) {
            return next(err);
        }
        response.personalAppointments = customerAppointments;
        Appointment.find({'employee': id, 'start.monthYear': monthYear}).exec(function (err, employeeAppointments) {
            if (err) {
                return next(err);
            }
            response.businessAppointments = employeeAppointments;
            res.json(response);
        });
    });
});

/**
 * Gets the last 100 notifications for the given user.
 */
router.get('/user/notifications', auth, function (req, res, next) {
    Notification.find({'user': req.payload._id}).sort({_id: -1}).limit(25).exec(function (err, notifications) {
        if (err) {
            return next(err);
        }

        res.json(notifications);
    });
});

/**
 * Creates a new Notification and saves it to the database.
 */
//TODO handle the case where there is no userID, appointment being scheduled for NON-Bookd customer
router.post('/user/notifications/create', auth, function (req, res, next) {
    var notification = new Notification();
    //Content of the notification.
    notification.content = req.body.content;
    //Timestamp of when notifications was created which is always now.
    notification.timestamp = moment().format('MM/DD/YYYY, h:mm A');
    //Type of notification. To be used for indicating importance.
    notification.type = req.body.type;
    //Whether the notification was viewed or not.
    notification.viewed = 'false';
    //Send only an email if the customer is not signed up with Bookd.
    //if (!req.body.id) {
    //    sendEmail(notification);
    //    return;
    //}
    User.findOne({'_id': req.body.id}).exec(function (err, user) {
        if (err) {
            next(err);
        }
        if(user){
            notification.user = user;
        }
        notification.save(function (err, response) {
            if (err) {
                return next(err);
            }
            console.log('Successfully saved notification!');
        });

        if (req.body.sendEmail && user !== null) {
            sendEmail(notification);
        } else {
            res.send('Successfully saved notification!');
        }
    });

    function sendEmail(notification) {
        var subject,
            body;

        subject = 'Bookd Notification';
        body = notification.content;
        var mailOptions = {
            from: 'Book\'d', // sender address
            to: notification.user.email, // list of receivers
            subject: subject, // Subject line
            html: body // html body
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            }

            res.send(info);
        });
    }
});

/**
 * Modify all the new Notifications by changing viewed to true.
 */
router.get('/user/notifications/viewed', auth, function (req, res, next) {
    var id = req.payload._id;
    Notification.update({user: id, viewed: false}, {$set: {viewed: true}}, {multi: true},
        function (err) {
            if (err) {
                console.log(err);
            }
            res.send('Changed notifications to viewed=true successfully');
        });
});

/**
 * Modify a single new Notifications by changing viewed to true.
 */
router.post('/user/notification/viewed', auth, function (req, res, next) {
    var id = req.body.id;
    Notification.findOneAndUpdate({_id: id}, {$set: {viewed: true}},
        function (err) {
            if (err) {
                console.log(err);
            }
            res.send('Changed notification to viewed=true successfully');
        });
});

/**
 * Returns the profile of a specified user.
 **/
router.get('/user/profile', auth, function (req, res, next) {
    var id = req.param('id');
    User.findOne({'_id': id})
        .select('_id name provider email avatarVersion personalAppointments businessAppointments associatePhotos providerId')
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
 * Updates the profile of a specified user.
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
 * Returns a user object
 *
 * Parameters:
 * id - The id of the employee.
 **/
router.get('/user/search', auth, function (req, res, next) {
    var email = req.param('email');
    User.findOne({'email': email}).select('_id name avatarVersion provider providerId').exec(function (error, user) {
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
            Business.findOne({'_id': currBusiness._id}).populate([{path: 'services', select: ''}, {
                path: 'employees',
                select: '_id name avatarVersion provider providerId availability'
            }]).exec(function (error, response) {
                if (error) {
                    return businessCallback(error);
                }
                Service.populate(response.services, {
                    path: 'employees',
                    select: '_id name avatarVersion availability provider providerId'
                }, function (err) {
                    if (err) {
                        return businessCallback(err);
                    }
                    updatedBusinesses.push(response);
                    businessCallback();
                });
            });
        }, function (err) {
            if (err) {
                return next(err);
            }
            res.json(updatedBusinesses);
        });
    });
});
router.get('/user/google-photo', auth, function (req, res, next) {
    var id = req.param('id');
    request('https://www.googleapis.com/plus/v1/people/' + id + '?fields=image&key=' + process.env.GOOGLE_PLACES_API_KEY, function (err, response) {
        if (err) {
            return next(err);
        }
        res.json(JSON.parse(response.body));
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
    if (req.body.provider === 'bookd') {
        if (!req.body.username || !req.body.password) {
            return res.status(400).json({message: 'Please fill out all fields.'});
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
    } else if (req.body.provider === 'facebook' || 'google_plus') {
        User.findOne({'email': req.body.username}).exec(function (err, user, info) {
            if (err) {
                return next(err);
            }
            if (user) {
                return res.json({token: user.generateJWT()});
            } else {
                return res.status(401).json({message: 'Your account does not exist. Please sign up.'});
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
    if (req.body.provider === 'bookd') {
        if (!req.body.username || !req.body.password) {
            return res.status(400).json({message: 'Please fill out all fields'});
        }
        user.setPassword(req.body.password);
    }
    //TODO how should we handle passwords when a user logs in with an oauth provider?
    if (req.body.provider === 'facebook' || req.body.provider === 'google_plus') {
        var randomstring = Math.random().toString(36).slice(-8);
        user.setPassword(randomstring);
        user.providerId = req.body.providerId;
    }

    user.email = req.body.username;
    user.name = req.body.name;
    user.provider = req.body.provider;

    user.save(function (err, user) {
        if (err) {
            return res.status(400).json({message: 'Whoops, looks like you already have an account registered. Try a different provider.'});
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
                    return next(err);
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
 * Creates a new appointment for both the Employee and Customer.
 * Takes in the appointment object.
 *
 * Parameters:
 * businessId -
 * employee -
 * customer -
 * start -
 * end -
 * title -
 * timestamp -
 * card -
 **/
router.post('/business/appointments/create', auth, function (req, res, next) {
    var appointment = new Appointment();
    appointment.businessId = req.body.businessId;
    appointment.employee = req.body.employee;

    appointment.customer = req.body.customer;
    appointment.service = req.body.service;
    appointment.start = req.body.start;
    appointment.end = req.body.end;
    appointment.title = req.body.title;
    appointment.timestamp = req.body.timestamp;

    appointment.card = req.body.stripeToken;
    appointment.price = req.body.price;

    appointment.status = 'active';

    var room = appointment.start.date.toString() + appointment.employee.toString();

    function validateAppointment(requestedAppointment, userAppointments) {
        var appointmentIndex;
        for (appointmentIndex = 0; appointmentIndex < userAppointments.length; appointmentIndex++) {
            if (moment(userAppointments[appointmentIndex].start.time, 'hh:mm a ').isSame(moment(requestedAppointment.start.time, 'hh:mm a'))) {
                return res.status(400).json([{message: 'This appointment conflicts with a previously scheduled time'}, {data: [userAppointments[appointmentIndex], requestedAppointment]}]);
            }
            if (moment(requestedAppointment.start.time, 'hh:mm a').isBetween(moment(userAppointments[appointmentIndex].start.time, 'hh:mm a'), moment(userAppointments[appointmentIndex].end.time, 'hh:mm a'), 'minute')) {
                return res.status(400).json([{message: 'This appointment conflicts with a previously scheduled time'}, {data: [userAppointments[appointmentIndex], requestedAppointment]}]);
            }
        }
        for (appointmentIndex = 0; appointmentIndex < userAppointments.length; appointmentIndex++) {
            if (moment(userAppointments[appointmentIndex].start.time, 'hh:mm a ').isSame(moment(requestedAppointment.start.time, 'hh:mm a'))) {
                return res.status(400).json([{message: 'This appointment conflicts with a previously scheduled time'}, {data: [userAppointments[appointmentIndex], requestedAppointment]}]);
            }
            if (moment(requestedAppointment.start.time, 'hh:mm a').isBetween(moment(userAppointments[appointmentIndex].start.time, 'hh:mm a'), moment(userAppointments[appointmentIndex].end.time, 'hh:mm a'), 'minute')) {
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
        if (appointment.customer !== null) {
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
        }
        io.sockets.in(room).emit('update');
        res.status(200).json(appointment);
    });
});
router.get('/business/appointments/all', auth, function (req, res, next) {
    var businessId = req.param('id');
    var monthYear = req.param('monthYear');
    Appointment.find({
        'businessId': businessId,
        'start.monthYear': monthYear,
        $or: [{'status': 'paid'}, {'status': 'active'}]
    }).exec(function (error, response) {
        if (error) {
            return next(error);
        }
        res.json(response);
    });
});

/**
 * Update an appointment - Reschedule
 */
router.post('/business/appointments/update', auth, function (req, res, next) {

    var updatedAppointmentStart = req.body.start;
    var updatedAppointmentEnd = req.body.end;
    var updatedAppointmentId = req.body._id;

    if (req.body.customer && req.body.customer == req.payload._id) {
        Appointment.findOne({'_id': updatedAppointmentId}).exec(function (err, appointment) {
            if (err) {
                return next(err);
            }
            appointment.start = updatedAppointmentStart;
            appointment.end = updatedAppointmentEnd;

            if (appointment.status == 'pending') {
                appointment.status = 'active';
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
                res.status(200).json(response);
            });
        });
    } else {
        Appointment.findOne({'_id': updatedAppointmentId}).exec(function (err, appointment) {
            if (err) {
                return next(err);
            }
            if (req.body.customer) {
                appointment.status = 'pending';
            }
            appointment.start = updatedAppointmentStart;
            appointment.end = updatedAppointmentEnd;
            if (req.body.customer) {
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
            }
            if (req.body.customer) {
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
                        //res.status(200).json({message: 'Success'});
                    });
                });
            }
            appointment.save(function (err, response) {
                if (err) {
                    return next(err);
                }
                res.status(200).json(response);
            });
        });
    }

});

router.post('/business/appointment/charge', auth, function (req, res, next) {
    //var card =  req.body.card;
    var appointmentId = req.body._id;
    var appointmentCard = req.body.card;
    var price = req.body.price;
    stripe.charges.create({
        amount: price,
        currency: 'usd',
        source: appointmentCard.id,
        description: 'Book\'d Appointment'
    }, function (err, charge) {
        if (err && err.type === 'StripeCardError') {
            // The card has been declined
            return (next(err));
        }
        Appointment.findOne({'_id': appointmentId}).exec(function (err, appointment) {
            if (err) {
                return next(err);
            }
            appointment.status = 'paid';

            appointment.save(function (err, resAppointment) {
                if (err) {
                    return next(err);
                }
                res.json(resAppointment);
            });
        });
    });
});

router.post('/business/appointment/status-update', auth, function (req, res, next) {
    var appointmentId = req.body._id;
    Appointment.findOne({'_id': appointmentId}).exec(function (err, appointment) {
        if (err) {
            return next(err);
        }
        appointment.status = req.body.status;

        appointment.save(function (err, resAppointment) {
            if (err) {
                return next(err);
            }
            res.json(resAppointment);
        });
    });
});
/**
 * Cancel an appointment - Delete
 */
router.post('/business/appointments/cancel', auth, function (req, res, next) {
    var appointment = req.body._id;
    var customer = req.body.customer;
    var employee = req.body.employee;

    if (customer !== '') {
        User.findOne({'_id': customer}).exec(function (err, user) {
            if (err) {
                return next(err);
            }

            var index = user.personalAppointments.indexOf(appointment);

            if (index > -1) {
                user.personalAppointments.splice(index, 1);
                user.save(function (err) {
                    if (err) {
                        return next(err);
                    }
                });
            } else {
                console.log('appointment not associated with this user. id=', appointment);
            }

        });
    }
    User.findOne({'_id': employee}).exec(function (err, user) {
        if (err) {
            return next(err);
        }

        var index = user.businessAppointments.indexOf(appointment);

        if (index > -1) {
            user.businessAppointments.splice(index, 1);
            user.save(function (err) {
                if (err) {
                    return next(err);
                }
            });
        } else {
            console.log('appointment not associated with this user. id=', appointment);
        }
    });
    Appointment.findOneAndRemove({'_id': appointment}, function (err, resAppointment) {
        if (err) {
            return next(err);
        }
        res.status(200).json(resAppointment);
    });
});


/**
 *   Queries & returns google places for a business based on a
 *   text search.
 **/
router.get('/business/search', function (req, res, next) {
    var query = req.param('query');
    var updatedBusinesses = [];
    var populateQuery = [{path: 'services', select: ''}, {
        path: 'employees',
        select: '_id businessAppointments name avatarVersion provider providerId availability'
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
                    select: '_id businessAppointments name avatarVersion provider providerId availability'
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
 * Returns all information about a specific Business.
 * Parameters:
 * placeId -
 **/
router.get('/business/details', function (req, res, next) {
    var id = req.param('placesId');
    Business.findOne({'placesId': id}).populate([{
        path: 'employees',
        select: '_id businessAppointments name avatarVersion availability provider providerId'
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
                select: '_id businessAppointments name avatarVersion availability provider providerId'
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

/**
 *   Returns all Bookd information about a specific Business.
 * Parameters:
 * placeId -
 **/
router.get('/business/info', function (req, res, next) {
    var id = req.param('id');
    Business.findOne({'_id': id}).populate([{
        path: 'employees',
        select: '_id businessAppointments name avatarVersion availability providerId provider'
    }, {path: 'services', select: ''}]).exec(function (error, business) {
        if (error) {
            return next(error);
        }
        Service.populate(business.services, {
            path: 'employees',
            select: '_id businessAppointments name avatarVersion availability providerId provider'
        }, function (err, finalobj) {
            if (error) {
                return next(error);
            }
            res.json(business);
        });
    });
});

/**
 * Adds a new employee to a Business.
 * Parameters:
 * businessId -
 * employeeId -
 **/
router.post('/business/add-employee', auth, function (req, res, next) {
    var businessId = req.body.businessId;
    var employeeId = req.body.employeeId;

    Business.findOne({'_id': businessId}).exec(function (err, response) {
        if (err) {
            return next(err);
        }
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
            select: '_id appointments name avatarVersion availability provider providerId'
        }, {path: 'services', select: ''}], function (err, busResponse) {
            if (err) {
                return next(err);
            }
            Service.populate(busResponse.services, {
                path: 'employees',
                select: '_id appointments name avatarVersion availability provider providerId'
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

/**
 *
 * This Async route may be causing us issues in that sometimes the service with the employee removed gets
 * saved after the response has already sent -- how can we ensure the loop with the service save
 * functions always finishes before we send the response.
 *
 */
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
                    service.save(function (err, result) {
                        if (err) {
                            return next(err);
                        }
                    });
                } else {
                    console.log('employee not found in service');
                }
            }
            res.json({message: "Success"});
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
            business.services.pushIfNotExist(service, function (e) {
                return e == service;
            });
            business.save(function (err, business) {
                if (err) {
                    return next(err);
                }
            });
            Service.populate(service, {
                path: 'employees',
                select: '_id appointments name avatarVersion availability provider providerId'
            }, function (err, responseService) {
                if (err) {
                    return next(err);
                }
                res.json(responseService)
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
    Service.findOneAndUpdate({'_id': newService._id}, newService, {new: true}).populate({
        path: 'employees',
        select: '_id businessAppointments appointments name avatarVersion availability provider providerId'
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
    var businessId = req.body.businessId;
    Service.remove({'_id': serviceId}).exec(function (err, result) {
        if (err) {
            return next(err);
        }
    });

    //TODO businessId, index, response are all non existent, how does this work?
    Business.findOne({'_id': businessId}).exec(function (err, business) {
        var index = business.services.indexOf(serviceId);
        if (index > -1) {
            business.services.splice(index, 1);
            business.save(function (err) {
                if (err) {
                    return next(err);
                }
            });
        } else {
            //console.log('serviceId not associated with this business. id=', serviceId);
        }
    });

    res.json({message: 'Success'});
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

    business.name = req.body.name;
    business.owner = req.payload._id;
    business.placesId = req.body.placesId;
    business.dateCreated = req.body.timestamp;
    business.pending = true;
    business.claimed = false;
    business.tier = req.body.tier;

    Business.findOne({'placesId': req.body.placesId}).exec(function (err, response) {
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
 * Get the Details for a Given Service
 */
router.get('/business/service-detail', auth, function (req, res, next) {
    var serviceId = req.param('service');
    Service.findOne({'_id': serviceId}).populate({
        path: 'employees',
        select: '_id appointments name avatarVersion availability provider providerId'
    }).exec(function (err, response) {
        if (err) {
            return next(err);
        }
        res.json(response);
    });
});

module.exports = router;
