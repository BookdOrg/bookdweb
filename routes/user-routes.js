/**
 * Created by khalilbrown on 9/3/16.
 */
var express = require('express');
var router = express.Router();
var jwt = require('express-jwt');
var cloudinary = require('cloudinary');
var Busboy = require('busboy');
var async = require('async');
var moment = require('moment');
require('moment-range');
var mongoose = require('mongoose');
var _ = require('lodash');
var request = require('request');
if (process.env.NODE_ENV === 'production') {
    var Raven = require('raven');
    Raven.config('https://f3036b05fed14259931f21238616f989:af33b643f270480297fd163281854868@sentry.io/249177').install();
}

var User = mongoose.model('User');
var Appointment = mongoose.model('Appointment');
var Notification = mongoose.model('Notification');

var auth = jwt({secret: process.env.jwtSecret, userProperty: 'payload'});

var io = require('./sockets');

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

/**
 *  Returns all appointments for both the employee and the customer trying to schedule an appointment,
 *  Takes in the ID of the employee & the startDate to search for. User ID is grabbed from
 *  auth middleware.
 *
 **/
router.get('/appointments', auth, function (req, res, next) {
    var startDate = req.query.startDate;
    var employeeId = req.query.employeeId;
    var customerId = req.query.customerId;

    var personal = req.query.personal;
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
router.get('/appointments-all', auth, function (req, res, next) {
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
router.get('/notifications', auth, function (req, res, next) {
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
router.post('/notifications/create', function (req, res, next) {
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
router.get('/notifications/viewed', auth, function (req, res, next) {
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
router.post('/notification/viewed', auth, function (req, res, next) {
    var id = req.body.id;
    Notification.findOneAndUpdate({_id: id}, {$set: {viewed: true}},
        function (err) {
            if (err) {
                return next(err);
            }
            res.status(200).send('Success');
        });
});

/**
 * Returns the profile of a specified user.
 **/
router.get('/profile', auth, function (req, res, next) {
    var id = req.query.id;
    User.findOne({'_id': id})
        .select('_id name firstName lastName provider email avatarVersion appointments associatePhotos providerId associateDescription')
        .populate({path: 'appointments'}).exec(function (err, user) {
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
router.post('/profile/update', auth, function (req, res, next) {
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
router.get('/search', auth, function (req, res) {
    var email = req.query.email;
    User.findOne({'email': email}).select('_id name firstName lastName avatarVersion provider providerId').exec(function (error, user) {
        if (error) {
            res.status(400).json(error);
        } else {
            res.json(user);
        }
    });
});
router.post('/description/update', auth, function (req, res, next) {
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
router.post('/claimed-success', function (req, res, next) {
    var user = _.find(clients, {'customId': req.query.user});
    if (user) {
        User.findOne({'_id': user.customId}).exec(function (error, activeUser) {
            if (error) {
                return next(error);
            }
            activeUser.hash = '';
            io.sockets.to(user.id).emit('update-user', activeUser);
            res.json({message: 'Success'});
        });
    }
});

router.get('/google-photo', function (req, res) {
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

router.post('/availability/update', auth, function (req, res, next) {
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

router.get('/password/:token', function (req, res, next) {
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

router.post('/password/new', function (req, res, next) {
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

router.post('/password/change', function (req, res) {
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

/**
 *
 * Mobile Specific Routes
 *
 */

router.get('/appointments-scroll', auth, function (req, res, next) {
    var lastSeen = parseInt(req.query.lastSeen);
    var userId = req.payload._id;
    var responseObj = {
        docs: null,
        lastSeen: null
    };
    User.findOne({_id: userId}).exec(function (err, user) {
        if (err) {
            return next(err);
        }
        if (user.appointments.length > 0) {
            Appointment.find({$or: [{customer: userId}, {employee: userId}]}, {}, {
                skip: lastSeen,
                limit: 10,
                sort: {'start.full': -1}
            }, function (err, results) {
                if (err) {
                    return next(err);
                }
                responseObj.docs = results;
                res.json(responseObj);
            });
        }
    })

});
module.exports = router;