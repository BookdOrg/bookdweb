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
var crypto = require('crypto');
require('moment-range');
var GooglePlaces = require('googleplaces');
var googleplaces = new GooglePlaces(process.env.GOOGLE_PLACES_API_KEY, process.env.GOOGLE_PLACES_OUTPUT_FORMAT);
var mongoose = require('mongoose');
var _ = require('lodash');
var stripe = require('stripe')(process.env.stripeDevSecret);
var nodemailer = require('nodemailer');
var EmailTemplate = require('email-templates').EmailTemplate;
var path = require('path');
var request = require('request');

var User = mongoose.model('User');
var Business = mongoose.model('Business');
var Appointment = mongoose.model('Appointment');
var Service = mongoose.model('Service');
var Notification = mongoose.model('Notification');

var auth = jwt({secret: process.env.jwtSecret, userProperty: 'payload'});
var server;
if (process.env.NODE_ENV === 'development') {
    server = require('http').createServer(app);
} else {
    var fs = require('fs');
    var options = {
        key: fs.readFileSync('/etc/ssl/private/domain.key'),
        cert: fs.readFileSync('/etc/ssl/certs/chained.pem')
    };
    server = require('https').createServer(options, app);
}
var io = require('socket.io')(server);
var wellknown = require('nodemailer-wellknown');
var config = wellknown('Zoho');
// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
    service: 'Zoho',
    auth: {
        user: 'contact@bookd.me',
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
server.listen(process.env.devsocketPort);
var roomData = [];
var clients = [];

io.on('connection', function (socket) {
    var string;
    //var city, state, zip;
    var socketTimeData = {};
    io.to(socket.id).emit('authorizationReq', socket.id);
    socket.on('authorizationRes', function (data) {
        var client = {};
        client.customId = data;
        client.id = socket.id;
        clients.push(client);
        User.findOne({'_id': data}).exec(function (err, user) {
            if (err) {
                io.to(socket.id).emit('noUser', {message: "No User Found"});
            }
            if (user) {
                user.hash = '';
                io.to(socket.id).emit('update-user', user);
            }
        });
    });
    socket.on('online', function () {
        //socket.join(data.user);
        //city = data.location.city;
        //state = data.location.state;
        //zip = data.location.zip;
        //socket.join(city);
        //socket.join(state);
        //socket.join(zip);
    });
    /**
     *
     * Join the socket room corresponding to the employee ID and the date selected from the front-end
     *
     */
    socket.on('joinApptRoom', function (data) {
        if (data.previousDate) {
            socket.leave(data.previousDate.toString() + data.employeeId.toString(), function (err) {
                if (err) {
                    //console.log(err)
                }
            });
        }
        string = data.startDate.toString() + data.employeeId.toString();
        if (string) {
            socket.join(string);
            var holdList = _.where(roomData, {id: string});
            io.to(socket.id).emit('oldHold', holdList);
        } else {
            socket.emit('appointmentRoomReq');
        }

    });
    /**
     *
     * Leave the socket room corresponding to the employee ID and the date selected from the front-end
     *
     */
    socket.on('leaveApptRoom', function (data) {
        socket.leave(data, function (err) {
            if (err) {
                //console.log(err);
            }
        });
    });
    /**
     *
     * When an available time is taken update all sockets in the corresponding room
     *
     */
    socket.on('timeTaken', function (data) {
        socketTimeData = data;
        roomData.push({id: data.roomId, user: data.user, data: data});
        io.sockets.in(data.roomId).emit('newHold', data);
    });
    /**
     *
     * When an available time is de-selected tell all sockets in the room to remove the hold
     *
     */
    socket.on('timeDestroyed', function (data) {
        if (data) {
            roomData = _.without(roomData, _.findWhere(roomData, {'user': data.user}));
            io.sockets.in(data.roomId).emit('destroyOld', data);
        }
    });
    /**
     *
     * When the socket disconnects for whatever reason we want to remove them for any places where they were stored.
     *
     */
    socket.on('disconnect', function () {
        roomData = _.without(roomData, _.findWhere(roomData, {'user': socketTimeData.user}));
        io.sockets.in(string).emit('destroyOld', socketTimeData);
        clients = _.without(clients, _.findWhere(clients, {'id': socket.id}));
        socket.disconnect();
    });
    socket.on('joinCalendarRoom', function (id) {
        socket.join(id);
    });
    /**
     *
     * Join the business dashboard room, id = Business ID
     *
     */
    socket.on('joinDashboardRoom', function (id) {
        var room = id.toString();
        socket.join(room, function (err) {
            if (err) {
                //console.log(err);
            }
        });
    });
    /**
     *
     * Leave the business dashboard room, id = Business ID
     *
     */
    socket.on('leaveDashboardRoom', function (id) {
        var room = id.toString();
        socket.leave(room, function (err) {
            if (err) {
                //console.log(err);
            }
        });
    });
    /**
     *
     * When an appointment is booked remove the socket from the room, tell other sockets to update.
     *
     */
    socket.on('apptBooked', function (appt) {
        var employeeSocket = _.findWhere(clients, {'customId': appt.employee._id});
        socket.leave(appt.roomId, function (err) {
            if (err) {
                //console.log(err);
            }
        });
        io.sockets.in(appt.roomId).emit('newRoomAppt', appt);
        if (appt.customer !== null) {
            io.sockets.in(appt.businessId).emit('newAppt', appt);
        }
        if (employeeSocket) {
            io.to(employeeSocket.id).emit('newAssociateAppt', appt);
        }
    });
    /**
     *
     * When a socket is re-scheduled we need to update relevant users who are logged in
     *
     */
    socket.on('apptUpdated', function (data) {
        var employeeSocket = _.findWhere(clients, {'customId': data.appointment.employee._id});
        var customerSocket = _.findWhere(clients, {'customId': data.appointment.customer._id});
        socket.leave(data.roomId, function (err) {
            if (err) {
                //console.log(err);
            }
        });
        io.sockets.in(data.roomId).emit('update');
        io.sockets.in(data.appointment.businessId).emit('updatedAppt', data);
        if (data.from === data.appointment.customer._id && employeeSocket) {
            io.to(employeeSocket.id).emit('updatedCalAppt', data);
        }
        if (data.from === data.appointment.employee._id && customerSocket) {
            io.to(customerSocket.id).emit('updatedCalAppt', data);
        }
        if (data.from !== data.appointment.employee._id && data.from !== data.appointment.customer._id) {
            if (customerSocket) {
                io.to(customerSocket.id).emit('updatedCalAppt', data);
            }
            if (employeeSocket) {
                io.to(employeeSocket.id).emit('updatedCalAppt', data);
            }
        }
    });
    /**
     *
     * When a socket is canceled we need to update relevant users who are logged in
     *
     */
    socket.on('apptCanceled', function (data) {
        var employeeSocket = _.findWhere(clients, {'customId': data.appointment.employee._id});
        var customerSocket = _.findWhere(clients, {'customId': data.appointment.customer._id});
        socket.leave(data.roomId);
        io.sockets.in(data.roomId).emit('update');
        io.sockets.in(data.appointment.businessId).emit('canceledAppt', data);
        if (data.from === data.appointment.customer._id && employeeSocket) {
            io.to(employeeSocket.id).emit('canceledAppt', data);
        }
        if (data.from === data.appointment.employee._id && customerSocket) {
            io.to(customerSocket.id).emit('canceledAppt', data);
        }
        if (data.from !== data.appointment.employee._id && data.from !== data.appointment.customer._id) {
            if (customerSocket) {
                io.to(customerSocket.id).emit('canceledAppt', data);
            }
            if (employeeSocket) {
                io.to(employeeSocket.id).emit('canceledAppt', data);
            }
        }
    });
    /**
     *
     * When a new notification is created, send it to the appropriate user socket.
     *
     */
        //TODO debug this, find out why it's not working.
    socket.on('newNotifGenerated', function (data) {
        var userSocket = _.findWhere(clients, {'customId': data.id});
        if (userSocket) {
            var notification = new Notification();
            //Content of the notification.
            notification.content = data.notification;
            //Date of calendar notification
            if (data.date) {
                notification.date = data.date;
            }
            //Timestamp of when notifications was created which is always now.
            notification.timestamp = moment().format('MM/DD/YYYY, h:mm A');
            //Type of notification. To be used for indicating importance.
            notification.type = data.type;
            //Whether the notification was viewed or not.
            notification.viewed = 'false';
            io.to(userSocket.id).emit('newNotif', notification);
        }
    });
});

/**
 *  Returns all appointments for both the employee and the customer trying to schedule an appointment,
 *  Takes in the ID of the employee & the startDate to search for. User ID is grabbed from
 *  auth middleware.
 *
 **/
router.get('/user/appointments', auth, function (req, res, next) {
    var startDate = req.query.startDate;
    var employeeId = req.query.employeeId;
    var customerId = req.query.customerId;

    var personal = req.query.personal;
    var responseArray = [];
    async.waterfall([
        function (done) {
            Appointment.find({
                employee: employeeId,
                'start.date': startDate,
                $or: [{'status': 'paid'}, {'status': 'active'}, {'status': 'pending'}]
            })
                .populate([
                    {path: 'customer', select: '_id firstName lastName name email'},
                    {path: 'employee', select: '_id firstName lastName name email'}])
                .exec(function (err, appointments) {
                    done(err, appointments);
                });
        },
        function (employeeAppointments, done) {
            var responseArray = [];
            responseArray.push(employeeAppointments);
            if (personal === 'true') {
                Appointment.find({
                    customer: customerId,
                    'start.date': startDate,
                    $or: [{'status': 'paid'}, {'status': 'active'}, {'status': 'pending'}]
                })
                    .populate([
                        {path: 'customer', select: '_id firstName lastName name email'},
                        {path: 'employee', select: '_id firstName lastName name email'}])
                    .exec(function (err, appointments) {
                        if (err) {
                            done(err, 'done')
                        }
                        responseArray.push(appointments);
                        res.json(responseArray);
                    });
            } else {
                res.json(responseArray);
            }
        }
    ], function (err) {
        if (err) {
            return next(err);
        }
    });
});

/**
 *
 * Returns the appointments of a specified user.
 */
router.get('/user/appointments-all', auth, function (req, res, next) {
    var start = new Date(req.query.start);
    var end = new Date(req.query.end);
    var isoStart = moment(start).format();
    var isoEnd = moment(end).format();
    var id;
    if (req.query.id !== undefined) {
        id = req.query.id;
    } else {
        id = req.payload._id;
    }
    var response = {
        personalAppointments: [],
        businessAppointments: []
    };
    Appointment.find({
        'customer': id,
        'start.full': {'$gte': isoStart, $lt: isoEnd},
        $or: [{'status': 'paid'}, {'status': 'active'}, {'status': 'pending'}]
    }).populate([
        {path: 'customer', select: '_id firstName lastName name email'},
        {path: 'employee', select: '_id firstName lastName name email'}])
        .exec(function (err, customerAppointments) {
        if (err) {
            //console.log(err);
            return next(err);
        }
        response.personalAppointments = customerAppointments;
        Appointment.find({
            'employee': id,
            'start.full': {$gte: isoStart, $lt: isoEnd}
        }).populate([
            {path: 'customer', select: '_id firstName lastName name email'},
            {path: 'employee', select: '_id firstName lastName name email'}])
            .exec(function (err, employeeAppointments) {
            if (err) {
                //console.log(err);
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
    Notification.find({'user': req.payload._id}).sort({timestamp: -1, viewed: -1}).exec(function (err, notifications) {
        if (err) {
            return next(err);
        }

        res.json(notifications);
    });
});

/**
 * Creates a new Notification and saves it to the database.
 */
router.post('/user/notifications/create', auth, function (req, res, next) {
    var notification = new Notification();
    //Content of the notification.
    notification.content = req.body.content;
    //Date of the calendar notification
    notification.date = req.body.date;
    //Timestamp of when notifications was created which is always now.
    notification.timestamp = moment().format();
    //Type of notification. To be used for indicating importance.
    notification.type = req.body.type;
    //Whether the notification was viewed or not.
    notification.viewed = 'false';

    User.findOne({'_id': req.body.id}).exec(function (err, user) {
        if (err) {
            next(err);
        }
        if (user) {
            notification.user = user;
        }
        notification.save(function (err) {
            if (err) {
                return next(err);
            }
        });
        res.status(200).send('Success!');
    });
});

/**
 * Modify all the new Notifications by changing viewed to true.
 */
router.get('/user/notifications/viewed', auth, function (req, res, next) {
    var id = req.payload._id;
    Notification.update({user: id, viewed: false}, {$set: {viewed: true}}, {multi: true},
        function (err) {
            if (err) {
                return next(err);
            }
            res.status(200).send('Success');
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
                return next(err);
            }
            res.status(200);
        });
});

/**
 * Returns the profile of a specified user.
 **/
router.get('/user/profile', auth, function (req, res, next) {
    var id = req.query.id;
    User.findOne({'_id': id})
        .select('_id name firstName lastName provider email avatarVersion personalAppointments businessAppointments associatePhotos providerId associateDescription')
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
    var email = req.query.email;
    User.findOne({'email': email}).select('_id name firstName lastName avatarVersion provider providerId').exec(function (error, user) {
        if (error) {
            res.status(400).json(error);
        } else {
            res.json(user);
        }
    });
});
router.post('/user/description/update', auth, function (req, res, next) {
    var id = req.payload._id;
    var description = req.body.description;
    User.findOne({'_id': id}).exec(function (err, user) {
        if (err) {
            return next(err);
        }
        user.associateDescription = description;
        user.save(function (err, user) {
            if (err) {
                return next(err);
            }
            res.json(user.associateDescription);
        });

    });
});
router.post('/user/claimed-success', function (req, res, next) {
    var user = _.findWhere(clients, {'customId': req.query.user});
    if (user) {
        User.findOne({'_id': user.customId}).exec(function (error, activeUser) {
            if (error) {
                return next(error);
            }
            activeUser.hash = '';
            io.to(user.id).emit('update-user', activeUser);
            res.json({message: 'Success'});
        });
    }
});
/**
 *  Returns all Dashboard information
 *
 *
 */
router.get('/business/dashboard', auth, function (req, res, next) {
    var id = req.payload._id;
    var updatedBusinesses = [];
    User.findOne({'_id': id}).select('_id name firstName lastName avatarVersion businesses').populate([{
        path: 'businesses',
        select: 'name services employees placesId dateCreated tier owner stripeId payments stripeAccount'
    }])
        .exec(function (error, user) {
            if (error) {
                return next(error);
            }
            async.each(user.businesses, function (currBusiness, businessCallback) {
                Business.findOne({'_id': currBusiness._id}).select('name services employees placesId dateCreated tier owner stripeId stripeAccount payments')
                    .populate([{path: 'services', select: ''}, {
                        path: 'employees',
                        select: '_id name firstName lastName avatarVersion provider providerId availabilityArray'
                    }]).exec(function (error, response) {
                        if (error) {
                            return businessCallback(error);
                        }
                        Service.populate(response.services, {
                            path: 'employees',
                            select: '_id name firstName lastName avatarVersion availabilityArray provider providerId'
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
router.get('/business/dashboard/stripe-account', auth, function (req, res, next) {
    var stripeId = req.query.stripeId;
    stripe.accounts.retrieve(
        stripeId,
        function (err, account) {
            if (err) {
                res.status(400).json(err);
            } else {
                res.json(account);
            }
        }
    );
});
router.get('/business/dashboard/stripe-balance', auth, function (req, res, next) {
    var stripeId = req.query.stripeId;
    stripe.balance.retrieve(
        stripeId,
        function (err, balance) {
            if (err) {
                res.status(400).json(err);
            } else {
                res.json(balance);
            }
        }
    );
});
router.get('/business/dashboard/stripe-balance-history', auth, function (req, res, next) {
    var stripeId = req.query.stripeId;
    stripe.balance.listTransactions(stripeId, {},
        function (err, transactions) {
            if (err) {
                res.status(400).json(err);
            } else {
                res.json(transactions)
            }
        }
    )
});
router.get('/business/dashboard/stripe-charges', auth, function (req, res, next) {
    var stripeId = req.query.stripeId;
    stripe.charges.list(stripeId,
        {limit: 3},
        function (err, charges) {
            if (err) {
                res.status(400).json(err);
            } else {
                res.json(charges);
            }
        }
    );
});
router.get('/user/google-photo', function (req, res, next) {
    var id = req.query.id;
    request('https://www.googleapis.com/plus/v1/people/' + id + '?fields=image&key=' + process.env.GOOGLE_PLACES_API_KEY, function (err, response) {
        if (err) {
            res.status(400).json(err);
        } else {
            res.json(JSON.parse(response.body));
        }
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
                return res.json({token: user.generateJWT(), user: user});
            } else {
                return res.status(401).json({message: info.message});
            }
        })(req, res, next);
    } else if (req.body.provider === 'facebook' || 'google_plus') {
        User.findOne({'email': req.body.username}).select('_id name firstName lastName email firstName lastName availabilityArray businessAppointments personalAppointments businessOwner provider providerId notifications businesses isAssociate')
            .exec(function (err, user) {
            if (err) {
                return next(err);
            }
            if (user) {
                return res.json({token: user.generateJWT(), user: user});
            } else {
                return res.status(401).json({message: 'Your account does not exist. Please sign up or check to make sure you aren\'t logged in to the wrong Facebook/Google account.'});
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
router.post('/register', function (req, res) {
    var user = new User();
    var welcomeTemplateDir = path.join(__dirname, '../templates', 'welcome');
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
    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.provider = req.body.provider;

    user.save(function (err, user) {
        if (err) {
            return res.status(400).json({message: 'Whoops, looks like you already have an account registered. Please Login'});
        }
        var subject,
            body;
        var welcome = new EmailTemplate(welcomeTemplateDir);
        var name = user.name.split(' ', 1);
        var usrObj = {
            name: name
        };
        welcome.render(usrObj, function (err, results) {
            subject = 'Welcome to Bookd!';
            body = results.html;
            var mailOptions = {
                from: 'Bookd <contact@bookd.me>', // sender address
                to: user.email, // list of receivers
                subject: subject, // Subject line
                html: body // html body
            };

            // send mail with defined transport object
            transporter.sendMail(mailOptions, function (error, response) {
                if (error) {
                    //console.log(error);
                }
            });
        });
        user.hash = "";
        return res.json({token: user.generateJWT(), user: user});
    });
});
/**
 *   Upload a users profile picture
 *
 **/
router.post('/upload', auth, function (req, res, next) {
    var id = req.payload._id;
    var busboy = new Busboy({headers: req.headers});
    busboy.on('file', function (fieldname, file) {

        var stream = cloudinary.uploader.upload_stream(function (result) {
            User.findOne({'_id': id}, function (err, user) {
                if (err) {
                    return next(err);
                }
                user.avatarVersion = result.version;
                user.save(function (err, user) {
                    res.json(user.avatarVersion);
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
 * Creates a new 4ointment for both the Employee and Customer.
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
    //console.log(req.payload);
    appointment.businessId = req.body.businessId;
    appointment.employee = req.body.employee;

    appointment.customer = req.body.customer;
    appointment.service = req.body.service;
    appointment.start = req.body.start;
    appointment.end = req.body.end;
    appointment.title = req.body.title;
    appointment.timestamp = req.body.timestamp;
    appointment.isoStart = req.body.isoStart;
    appointment.card = req.body.stripeToken;
    appointment.price = req.body.price;
    appointment.externalCustomer = req.body.externalCustomer;

    appointment.status = 'active';

    var firstApptTemplateDir = path.join(__dirname, '../templates', 'customer-first-appointment');
    var genApptTemplateDir = path.join(__dirname, '../templates', 'customer-general-appointment');

    var firstApptTemplate = new EmailTemplate(firstApptTemplateDir);
    var genApptTemplate = new EmailTemplate(genApptTemplateDir);
    var templateObj = {};
    templateObj.appointment = moment(appointment.start.full).format('MMM Do YYYY, h:mm a');

    var room = appointment.start.date.toString() + appointment.employee.toString();
    async.waterfall([
        function (done) {
            appointment.save(function (err, appointment) {
                done(err, appointment)
            })
        },
        function (appointment, done) {
            User.findOne({'_id': appointment.employee})
                .exec(function (err, user) {
                    if (err) {
                        done(err, 'done');
                    }
                    templateObj.employeeName = user.name;
                    templateObj.employeeName = templateObj.employeeName.split(' ', 1);
                    user.appointments.push(appointment);
                    appointment.employee = user;
                    user.save(function (err) {
                        done(err, appointment);
                    })
                })
        }, function (appointment, done) {
            if (appointment.customer !== null) {
                User.findOne({'_id': appointment.customer}).populate({
                    path: 'businessAppointments personalAppointments',
                    match: {'start.date': appointment.start.date}
                }).exec(function (err, user) {
                    if (err) {
                        done(err, 'done');
                    }
                    appointment.customer = user;
                    templateObj.user = user.name;
                    templateObj.user = templateObj.user.split(' ', 1);

                    user.appointments.push(appointment);
                    if (user.appointments.length <= 1) {
                        firstApptTemplate.render(templateObj, function (err, results) {
                            var mailOptions = {
                                from: 'Bookd <contact@bookd.me>', // sender address
                                to: user.email, // list of receivers
                                subject: 'Bookd Appointment', // Subject line
                                html: results.html // html body
                            };
                            // send mail with defined transport object
                            transporter.sendMail(mailOptions, function (error) {
                                if (error) {
                                    console.log(error);
                                }
                            });
                        })
                    } else {
                        genApptTemplate.render(templateObj, function (err, results) {
                            var mailOptions = {
                                from: 'Bookd <contact@bookd.me>', // sender address
                                to: user.email, // list of receivers
                                subject: 'Bookd Appointment', // Subject line
                                html: results.html // html body
                            };
                            // send mail with defined transport object
                            transporter.sendMail(mailOptions, function (error) {
                                if (error) {
                                    console.log(error);
                                }
                            });
                        })
                    }
                    user.save(function (err) {
                        if (err) {
                            done(err, 'done');
                        }
                        done(err, appointment);
                    });
                });
            } else {
                done(null, appointment)
            }
        },
        function (appointment) {
            if (appointment.customer) {
                appointment.customer.hash = '';
            }
            var bearer = req.get('Authorization');
            var options = {
                method: 'POST',
                url: 'http://' + process.env.devhost + ':3002/business/customers/create?email=' +
                appointment.customer.email + '&business=' + appointment.businessId,
                headers: {
                    'Authorization': bearer
                }
            };
            request(options, function (err, response) {
                if (err) {
                    console.log(err);
                }
                //console.log(response);
            });
            appointment.employee.hash = '';
            io.sockets.in(room).emit('update');
            res.status(200).json(appointment);
        }
    ], function (err) {
        if (err) {
            return next(err);
        }
    });
});
router.get('/business/appointments/all', auth, function (req, res, next) {
    var businessId = req.query.id;
    var start = new Date(req.query.start);
    var end = new Date(req.query.end);
    var isoStart = moment(start).format();
    var isoEnd = moment(end).format();
    Appointment.find({
        'businessId': businessId,
        'start.full': {'$gte': isoStart, $lt: isoEnd},
        $or: [{'status': 'paid'}, {'status': 'active'}, {'status': 'pending'}]
    }).populate([
        {path: 'customer', select: '_id firstName lastName name email'},
        {path: 'employee', select: '_id firstName lastName name email'}
    ]).exec(function (error, response) {
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
    var rescheduleTemplateDir = path.join(__dirname, '../templates', 'employee-reschedule');
    var templateObj = {};
    if (req.body.customer && req.body.customer._id === req.payload._id || req.body.customer === req.payload._id) {
        Appointment.findOne({'_id': updatedAppointmentId}).populate([
            {path: 'customer', select: '_id firstName lastName name email'},
            {path: 'employee', select: '_id firstName lastName name email'}
        ]).exec(function (err, appointment) {
            if (err) {
                return next(err);
            }
            appointment.start = updatedAppointmentStart;
            appointment.end = updatedAppointmentEnd;

            if (appointment.status == 'pending') {
                appointment.status = 'active';
                User.findOne({'_id': req.body.employee._id}).exec(function (err, user) {
                    if (err) {
                        next(err);
                    }
                    user.appointments.push({_id: appointment._id});
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
        Appointment.findOne({'_id': updatedAppointmentId}).populate([[
            {path: 'customer', select: '_id firstName lastName name email'},
            {path: 'employee', select: '_id firstName lastName name email'}
        ]]).exec(function (err, appointment) {
            if (err) {
                return next(err);
            }
            if (req.body.customer) {
                appointment.status = 'pending';
            }
            appointment.start = updatedAppointmentStart;
            appointment.end = updatedAppointmentEnd;
            if (req.body.customer) {
                User.findOne({'_id': req.body.employee._id}).exec(function (err, user) {
                    if (err) {
                        return next(err);
                    }
                    templateObj.appointment = appointment;
                    templateObj.employee = user.name;
                    user.appointments.pull({_id: appointment._id});
                    user.save(function (err) {
                        if (err) {
                            return next(err);
                        }
                    });

                });
            }
            if (req.body.customer) {
                var reScheduleTemplate = new EmailTemplate(rescheduleTemplateDir);
                User.findOne({'_id': req.body.customer}).exec(function (err, user) {
                    if (err) {
                        return next(err);
                    }
                    user.save(function (err) {
                        if (err) {
                            return next(err);
                        }
                        templateObj.customer = user.name;
                        reScheduleTemplate.render(templateObj, function (err, results) {
                            var subject = 'Appointment Reschduled';
                            var body = results.html;
                            var mailOptions = {
                                from: 'Bookd <contact@bookd.me>', // sender address
                                to: user.email, // list of receivers
                                subject: subject, // Subject line
                                html: body // html body
                            };

                            // send mail with defined transport object
                            transporter.sendMail(mailOptions, function (error, response) {
                                if (error) {
                                    //console.log(error);
                                }
                            });
                        })
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
    var appointmentId = req.body._id;
    var appointmentCard = req.body.card;
    var price = req.body.price;
    var businessId = req.body.businessId;
    var successTemplateDir = path.join(__dirname, '../templates', 'customer-transaction-success');
    var fee = (price * .05) + 30;

    var successTemplate = new EmailTemplate(successTemplateDir);

    Business.findOne({'_id': businessId}).exec(function (err, business) {
        var stripeId = business.stripeId;
        stripe.charges.create({
            amount: price,
            currency: 'usd',
            source: appointmentCard.id,
            application_fee: fee,
            destination: stripeId,
            description: 'Bookd Appointment'
        }, function (err, charge) {
            if (err && err.type === 'StripeCardError') {
                // The card has been declined
                res.status(400).json(err);
            } else {
                Appointment.findOne({'_id': appointmentId}).populate([[
                    {path: 'customer', select: '_id firstName lastName name email'},
                    {path: 'employee', select: '_id firstName lastName name email'}
                ]]).exec(function (err, appointment) {
                    if (err) {
                        return next(err);
                    }
                    appointment.status = 'paid';
                    appointment.customer.hash = '';
                    appointment.employee.hash = '';
                    appointment.save(function (err, resAppointment) {
                        if (err) {
                            return next(err);
                        }
                        var templateObj = {
                            price: price / 100,
                            brand: charge.source.brand,
                            lastFour: charge.source.last4
                        };
                        sendSuccessEmail(templateObj);
                        res.json(resAppointment);
                    });
                });
            }
        });
    });

    function sendSuccessEmail(templateObj) {
        User.findOne({"_id": req.body.customer._id}).exec(function (error, user) {
            if (user) {
                templateObj.user = user.name.split(' ', 1);
                successTemplate.render(templateObj, function (error, results) {
                    var mailOptions = {
                        from: 'Bookd <contact@bookd.me>', // sender address
                        to: user.email, // list of receivers
                        subject: 'Bookd Transaction', // Subject line
                        html: results.html // html body
                    };
                    // send mail with defined transport object
                    transporter.sendMail(mailOptions, function (error) {
                        if (error) {
                            console.log(error);
                        }
                    });
                });
            }
        });
    }
});

router.post('/business/appointment/status-update', auth, function (req, res, next) {
    var appointmentId = req.body._id;
    Appointment.findOne({'_id': appointmentId}).populate([[
        {path: 'customer', select: '_id firstName lastName name email'},
        {path: 'employee', select: '_id firstName lastName name email'}
    ]]).exec(function (err, appointment) {
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
    if (req.body.customer) {
        var customer = req.body.customer._id;
    }
    var employee = req.body.employee;
    var templateDir;
    var templateObj = {};
    switch (req.payload._id) {
        case customer:
            templateDir = path.join(__dirname, '../templates', 'customer-cancel');
            break;
        case employee:
            templateDir = path.join(__dirname, '../templates', 'employee-cancel');
            break;
        default:
            templateDir = path.join(__dirname, '../templates', 'employee-cancel');
    }
    if (customer !== null) {
        User.findOne({'_id': customer}).exec(function (err, user) {
            if (err) {
                return next(err);
            }
            if (user) {
                templateObj.user = user;
                var index = user.appointments.indexOf(appointment);
            }
            if (index > -1) {
                user.appointments.splice(index, 1);
                user.save(function (err) {
                    if (err) {
                        return next(err);
                    }
                });
            } else {
                //console.log('appointment not associated with this user. id=', appointment);
            }

        });
    }
    User.findOne({'_id': employee}).exec(function (err, user) {
        if (err) {
            return next(err);
        }

        var index = user.appointments.indexOf(appointment);

        if (index > -1) {
            user.appointments.splice(index, 1);
            user.save(function (err) {
                if (err) {
                    return next(err);
                }
            });
        } else {
            //console.log('appointment not associated with this user. id=', appointment);
        }
    });
    Appointment.findOneAndUpdate({'_id': appointment}, {$set: {status: 'canceled'}}, {new: true}, function (err, resAppointment) {
        if (err) {
            return next(err);
        }
        templateObj.appointment = resAppointment;
        if (templateObj.user) {
            templateObj.user.name = templateObj.user.name.split(' ', 1);
            var template = new EmailTemplate(templateDir);
            template.render(templateObj, function (err, results) {
                var mailOptions = {
                    from: 'Bookd <contact@bookd.me>', // sender address
                    to: templateObj.user.email, // list of receivers
                    subject: 'Appointment Canceled', // Subject line
                    html: results.html // html body
                };

                // send mail with defined transport object
                transporter.sendMail(mailOptions, function (error) {
                    if (error) {
                        //return next(error);
                    }
                });
            });
        }
        res.status(200).json(resAppointment);
    });
});


/**
 *   Queries & returns google places for a business based on a
 *   text search.
 **/
router.get('/business/search', function (req, res, next) {
    var query = req.query.query;
    var updatedBusinesses = [];
    var populateQuery = [{path: 'services', select: ''}, {
        path: 'employees',
        select: '_id businessAppointments name firstName lastName avatarVersion provider providerId availabilityArray associateDescription'
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
                    select: '_id businessAppointments name firstName lastName avatarVersion provider providerId availabilityArray associateDescription'
                }, function (err) {
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
    var id = req.query.placesId;
    Business.findOne({'placesId': id}).populate([{
        path: 'employees',
        select: '_id businessAppointments name firstName lastName avatarVersion availabilityArray provider providerId associateDescription'
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
                select: '_id businessAppointments name firstName lastName avatarVersion availabilityArray provider providerId associateDescription'
            }, function (error) {
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
    var id = req.query.id;
    Business.findOne({'_id': id}).populate([{
        path: 'employees',
        select: '_id businessAppointments name firstName lastName avatarVersion availabilityArray providerId provider associateDescription'
    }, {path: 'services', select: ''}]).exec(function (error, business) {
        if (error) {
            return next(error);
        }
        Service.populate(business.services, {
            path: 'employees',
            select: '_id businessAppointments name firstName lastName avatarVersion availabilityArray providerId provider associateDescription'
        }, function (error) {
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
    var addEmployeeTemplateDir = path.join(__dirname, '../templates', 'add-employee');
    var businessId = req.body.businessId;
    var employeeId = req.body.employeeId;
    var businessName = req.body.businessName;
    var employeeSocketObj = _.findWhere(clients, {'customId': employeeId});
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
            User.findOne({'_id': employeeId}).exec(function (err, employee) {
                if (err) {
                    return next(err);
                }
                if (!employee.isAssociate) {
                    employee.isAssociate = true;
                }
                var availability = [
                    {
                        day: 'Monday',
                        start: moment().hour(6).minute(0).format('hh:mm a'),
                        end: moment().hour(19).minute(0).format('hh:mm a'),
                        gaps: [],
                        available: false
                    },
                    {
                        day: 'Tuesday',
                        start: moment().hour(6).minute(0).format('hh:mm a'),
                        end: moment().hour(19).minute(0).format('hh:mm a'),
                        gaps: [],
                        available: false
                    },
                    {
                        day: 'Wednesday',
                        start: moment().hour(6).minute(0).format('hh:mm a'),
                        end: moment().hour(19).minute(0).format('hh:mm a'),
                        gaps: [],
                        available: false
                    },
                    {
                        day: 'Thursday',
                        start: moment().hour(6).minute(0).format('hh:mm a'),
                        end: moment().hour(19).minute(0).format('hh:mm a'),
                        gaps: [],
                        available: false
                    },
                    {
                        day: 'Friday',
                        start: moment().hour(6).minute(0).format('hh:mm a'),
                        end: moment().hour(19).minute(0).format('hh:mm a'),
                        gaps: [],
                        available: false
                    },
                    {
                        day: 'Saturday',
                        start: moment().hour(6).minute(0).format('hh:mm a'),
                        end: moment().hour(19).minute(0).format('hh:mm a'),
                        gaps: [],
                        available: false
                    },
                    {
                        day: 'Sunday',
                        start: moment().hour(6).minute(0).format('hh:mm a'),
                        end: moment().hour(19).minute(0).format('hh:mm a'),
                        gaps: [],
                        available: false
                    }];
                employee.availabilityArray.push({
                    'businessName': businessName,
                    'businessId': businessId,
                    'availability': availability
                });
                if (employeeSocketObj) {
                    io.to(employeeSocketObj.id).emit('update-user', employee);
                }
                employee.save(function (err, user) {
                    if (err) {
                        return next(err);
                    }
                    var addEmployeeTemplate = new EmailTemplate(addEmployeeTemplateDir);
                    var templateObj = {
                        name: user.name.split(' ', 1),
                        business: businessName
                    };
                    addEmployeeTemplate.render(templateObj, function (error, results) {
                        var mailOptions = {
                            from: 'Bookd <contact@bookd.me>', // sender address
                            to: user.email, // list of receivers
                            subject: 'Bookd Associates', // Subject line
                            html: results.html // html body
                        };

                        // send mail with defined transport object
                        transporter.sendMail(mailOptions, function (error) {
                            if (error) {
                                //return next(error);
                            }
                        });
                    });
                });
            });
        });
        Business.populate(response, [{
            path: 'employees',
            select: '_id appointments name firstName lastName avatarVersion availabilityArray provider providerId associateDescription'
        }, {path: 'services', select: ''}], function (err, busResponse) {
            if (err) {
                return next(err);
            }
            Service.populate(busResponse.services, {
                path: 'employees',
                select: '_id appointments name firstName lastName avatarVersion availabilityArray provider providerId associateDescription'
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
router.post('/business/customers/create', auth, function (req, res, next) {
    var name, mobile;
    if (req.query.name) {
        name = req.query.name;
    }
    if (req.query.mobile) {
        mobile = req.query.mobile;
    }
    var email = req.query.email;
    var businessId = req.query.business;
    async.waterfall([
        function (done) {
            User.findOne({'email': email}).exec(function (err, customer) {
                if (err) {
                    done(err, 'done');
                }
                if (!customer) {
                    var user = new User();
                    user.name = name;
                    var firstLast = name.split(' ', 2);
                    user.firstName = firstLast[0];
                    user.lastName = firstLast[1];
                    user.email = email;
                    user.mobile = mobile;
                    user.provider = 'business';
                    var randomstring = Math.random().toString(36).slice(-8);
                    user.setPassword(randomstring);
                    user.save(function (err, createdUser) {
                        if (err) {
                            done(err, 'done');
                        }
                        done(err, createdUser)
                    });
                } else {
                    done(err, customer);
                }
            })
        },
        function (customer, done) {
            Business.findOne({'_id': businessId}).exec(function (err, business) {
                if (err) {
                    done(err, 'done');
                }
                business.customers.pushIfNotExist(customer, function (e) {
                    return e.toString() == customer._id.toString();
                });
                business.save(function (err, business) {
                    if (err) {
                        done(err, 'done');
                    }
                    res.json(customer);
                })
            })
        }
    ], function (err) {
        if (err) {
            return next(err);
        }
    });
});
router.get('/business/customers/search', auth, function (req, res, next) {
    Business.findOne({"_id": req.query.businessId}).select('customers').populate({
        'path': "customers",
        select: 'name _id firstName lastName providerId avatarVersion provider email mobile'
    }).exec(function (err, results) {
        var customers = [];
        _.forEach(results.customers, function (customer, key) {
            if (customer.name.toLowerCase().indexOf(req.query.search.toLowerCase()) !== -1) {
                customers.push(customer);
            }
        });
        res.json(customers);
    })
});
router.post('/user/availability/update', auth, function (req, res, next) {
    var availabilityObj = req.body.availability;
    var employeeId = req.body.id;
    var businessId = req.body.businessId;
    var businessName = req.body.businessName;

    User.findOne({'_id': employeeId}).exec(function (err, employee) {
        if (err) {
            return next(err);
        }
        var newAvailability = {
            businessName: businessName,
            businessId: businessId,
            availability: availabilityObj
        };
        var availabilityIndex = _.findIndex(employee.availabilityArray, {'businessId': businessId});
        employee.availabilityArray.set(availabilityIndex, newAvailability);
        employee.save(function (err, responseEmployee) {
            if (err) {
                return next(err);
            }
            res.json(responseEmployee.availabilityArray);
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
    var employeeSocketObj = _.findWhere(clients, {'customId': employeeId});
    var removeEmployeeTemplateDir = path.join(__dirname, '../templates', 'remove-employee');
    //find business that employee is being removed from
    Business.findOne({'_id': businessId}).exec(function (err, response) {
        if (err) {
            return next(err);
        }
        var index = response.employees.indexOf(employeeId);

        if (index > -1) {
            response.employees.splice(index, 1);
            response.save(function (err) {
                if (err) {
                    return next(err);
                }
                User.findOne({"_id": employeeId}).exec(function (err, user) {
                    if (err) {
                        return next(err);
                    }
                    var availabilityIndex = _.findIndex(user.availabilityArray, {'businessId': businessId});
                    user.availabilityArray.splice(availabilityIndex, 1);
                    if (employeeSocketObj) {
                        io.to(employeeSocketObj.id).emit('update-user', user);
                    }
                    user.save(function (err) {
                        if (err) {
                            res.status(400).json(err);
                        }
                    });
                    var removeEmployeeTemplate = new EmailTemplate(removeEmployeeTemplateDir);
                    var templateObj = {
                        name: user.name.split(' ', 1),
                        business: response.name
                    };
                    removeEmployeeTemplate.render(templateObj, function (error, results) {
                        var mailOptions = {
                            from: 'Bookd <contact@bookd.me>', // sender address
                            to: user.email, // list of receivers
                            subject: 'Bookd Associates', // Subject line
                            html: results.html // html body
                        };

                        // send mail with defined transport object
                        transporter.sendMail(mailOptions, function (error) {
                            if (error) {
                                //return next(error);
                            }
                        });
                    });
                })
            });
        } else {
            //console.log('employeeID not associated with this business. id=', employeeId);
        }

        //need to convert string to objectIds for the Service 'find $in' query to work
        for (var i = 0; i < serviceIds.length; i++) {
            serviceIds[i] = mongoose.Types.ObjectId(serviceIds[i]);
        }
        //find all service(s) employee was part of
        Service.find({'_id': {$in: serviceIds}}).exec(function (err, services) {
            if (err) {
                return next(err);
            }
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
                    //console.log('employee not found in service');
                }
            }
            res.json({message: 'Success'});
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

    //User.findOne({'_id': id}).exec(function(err,user){
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
            business.save(function (err) {
                if (err) {
                    return next(err);
                }
            });
            Service.populate(service, {
                path: 'employees',
                select: '_id appointments name firstName lastName avatarVersion availabilityArray provider providerId'
            }, function (err, responseService) {
                if (err) {
                    return next(err);
                }
                res.json(responseService);
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
        select: '_id businessAppointments appointments name firstName lastName avatarVersion availabilityArray provider providerId'
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
    //TODO give the status a pending deletion status
    //Service.remove({'_id': serviceId}).exec(function (err, result) {
    //    if (err) {
    //        return next(err);
    //    }
    //});

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
            ////console.log('serviceId not associated with this business. id=', serviceId);
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
    business.dateCreated = req.body.now;
    business.address = req.body.address;
    business.phoneNumber = req.body.phoneNumber;
    business.pending = true;
    business.claimed = false;
    business.tier = req.body.tier;

    Business.findOne({'placesId': req.body.placesId}).exec(function (err, response) {
        var businessRequestDir = path.join(__dirname, '../templates', 'business-request');
        if (err) {
            return next(err);
        }
        if (response) {
            return res.status(400).json({message: 'This business has already been claimed or has a request pending.'});
        }
        business.save(function (err, business) {
            if (err) {
                return next(err);
            }
            res.json(business);
            User.findOne({'_id': business.owner}).exec(function (err, user) {
                var templateObj = {
                    user: user.name.split(' ', 1),
                    business: business.name
                };
                var businessRequestTemplate = new EmailTemplate(businessRequestDir);
                businessRequestTemplate.render(templateObj, function (err, results) {
                    var mailOptions = {
                        from: 'Bookd <contact@bookd.me>', // sender address
                        to: user.email, // list of receivers
                        subject: 'Bookd Claim Request', // Subject line
                        html: results.html // html body
                    };
                    // send mail with defined transport object
                    transporter.sendMail(mailOptions, function (error) {
                        if (error) {
                            ////console.log(error);
                        }
                    });
                });
            });
        });
    });
});

/***
 * Get the Details for a Given Service
 */
router.get('/business/service-detail', auth, function (req, res, next) {
    var serviceId = req.query.service;
    Service.findOne({'_id': serviceId}).populate({
        path: 'employees',
        select: '_id appointments name firstName lastName avatarVersion availabilityArray provider providerId associateDescription'
    }).exec(function (err, response) {
        if (err) {
            return next(err);
        }
        res.json(response);
    });
});

/**
 *
 * Create a Business's Managed Account
 *
 */
router.post('/business/update-payments-account', auth, function (req, res, next) {
    var bankingUpdatedSuccessDir = path.join(__dirname, '../templates', 'banking-updated-success');
    //var bankingUpdatedFailureDir = path.join(__dirname, '../templates', 'banking-updated-failure');
    var bankingUpdatedSuccessTemplate = new EmailTemplate(bankingUpdatedSuccessDir);
    var businessId = req.body.businessId;
    var bankInfo = req.body.bankAccount;
    var stripeInfo = req.body.stripeAccount;
    var bankingTemplateObj = {};
    var month = moment(stripeInfo.dob).month() + 1;
    var day = moment(stripeInfo.dob).date();
    var year = moment(stripeInfo.dob).year();
    var fullName = stripeInfo.firstName + ' ' + stripeInfo.lastName;
    var acceptanceTimeStamp = Math.floor(Date.now() / 1000);
    var remoteAddress = req.connection.remoteAddress;

    Business.findOne({'_id': businessId}).exec(function (err, business) {
        if (err) {
            return next(err);
        }
        stripe.accounts.update(business.stripeId, {
            external_account: {
                object: 'bank_account',
                account_number: bankInfo.checking,
                country: 'US',
                currency: 'USD',
                account_holder_type: bankInfo.type,
                name: fullName,
                routing_number: bankInfo.routing
            },
            legal_entity: {
                dob: {
                    day: day,
                    month: month,
                    year: year
                },
                first_name: stripeInfo.firstName,
                last_name: stripeInfo.lastName,
                type: stripeInfo.type
            },
            tos_acceptance: {
                date: acceptanceTimeStamp,
                ip: remoteAddress
            },
            business_name: business.name
        }, function (err, stripeResponse) {
            if (err) {
                res.json(err);
            } else {
                business.payments = true;
                business.save(function (err) {
                    if (err) {
                        return next(err);
                    }
                    res.json(stripeResponse);
                    bankingTemplateObj.businessName = business.name;
                    bankingTemplateObj.legalEntity = stripeResponse.legal_entity;
                    bankingTemplateObj.lastFour = stripeResponse.bank_accounts.data[0].last4;
                    bankingTemplateObj.bankName = stripeResponse.bank_accounts.data[0].bank_name;
                    sendEmail(bankingTemplateObj);

                });
            }
        });
        function sendEmail(bankingTemplateObj) {
            User.findOne({"_id": req.payload._id}).exec(function (error, user) {
                bankingTemplateObj.user = user.name;
                bankingUpdatedSuccessTemplate.render(bankingTemplateObj, function (error, results) {
                    var mailOptions = {
                        from: 'Bookd <contact@bookd.me>', // sender address
                        to: user.email, // list of receivers
                        subject: 'Bookd Updated Information', // Subject line
                        html: results.html // html body
                    };
                    // send mail with defined transport object
                    transporter.sendMail(mailOptions, function (error) {
                        if (error) {
                            console.log(error);
                        }
                    });
                });
            });
        }


    });
});

router.post('/business/contact', function (req, res, next) {
    var name = req.body.name;
    var phone = req.body.phone;
    var email = req.body.email;
    var message = req.body.message;
    if (message) {
        sendEmail(name, phone, email, message);
        res.json(200);
    } else {
        res.json(400);
    }
    function sendEmail(name, phone, email, message) {
        var subject,
            body;

        subject = 'Business Inquiry';
        body = '<br>' + name + '</br>' + '<br>' + message + '</br>' + '<br>' + phone + '</br>' + '<br>' + email + '</br>';
        var mailOptions = {
            from: 'Bookd <contact@bookd.me>', // sender address
            to: 'Bookd <contact@bookd.me>', // list of receivers
            subject: subject, // Subject line
            html: body // html body
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, function (error) {
            if (error) {
                //return next(error);
            }
        });
    }
});

router.post('/user/password', function (req, res, next) {
    async.waterfall([
        function (done) {
            crypto.randomBytes(20, function (err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function (token, done) {
            User.findOne({'email': req.body.email}, function (err, user) {
                if (!user) {
                    console.log('No user with that email exists!');
                    return res.send('Success');
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                user.save(function (err) {
                    done(err, token, user);
                });
            });
        },
        function (token, user, done) {
            var resetPassDir = path.join(__dirname, '../templates', 'password-reset');
            var resetPasswordTemplate = new EmailTemplate(resetPassDir);
            var data = {
                token: token,
                user: user
            };
            resetPasswordTemplate.render(data, function (err, template) {
                if (err) {
                    console.log(err);
                }

                var mailOptions = {
                    to: user.email,
                    from: 'Bookd <contact@bookd.me>',
                    subject: 'Bookd Password Reset',
                    html: template.html
                };
                // send mail with defined transport object
                transporter.sendMail(mailOptions, function (error) {
                    if (error) {
                        console.log(error);
                        done(err, 'done');
                    }
                    res.json({message: 'Success'});
                });
            });
        }
    ], function (err) {
        if (err) return next(err);
        res.send(err);
    });
});

router.get('/user/password/:token', function (req, res, next) {
    User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function (err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            res.status(401).json({error: 'Password reset token is invalid or has expired.'});
        }
        res.json({message: 'Success!'});
    });
});

router.post('/user/password/new', function (req, res, next) {
    User.findOne({
        resetPasswordToken: req.body.token,
        resetPasswordExpires: {$gt: Date.now()}
    }).exec(function (err, user) {
        if (err) {
            console.log(err);
        }
        if (!user) {
            res.status(401).json({error: 'Password reset token is invalid or has expired.'});
        } else {
            user.setPassword(req.body.password);
            user.resetPasswordToken = '';
            user.resetPasswordExpires = null;
            user.save();
            res.json({message: 'Success!'});
        }
    });
});

router.post('/user/password/change', function (req, res, next) {
    User.findOne({
        _id: req.body.id
    }).exec(function (err, user) {
        if (err) {
            console.log(err);
        }

        if (user.validPassword(req.body.currPass)) {
            user.setPassword(req.body.newPass);
            user.save();
            res.json({message: 'Success!'});
        } else {
            res.status(401).json({error: 'Current password is incorrect!'});
        }
    });
});

module.exports = router;
