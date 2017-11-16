/**
 * Created by khalilbrown on 9/4/16.
 */
var express = require('express');
var router = express.Router();
var jwt = require('express-jwt');
var async = require('async');
var moment = require('moment');
require('moment-range');
var mongoose = require('mongoose');
var _ = require('lodash');
var stripe = require('stripe')(process.env.stripeDevSecret);
var nodemailer = require('nodemailer');
var EmailTemplate = require('email-templates').EmailTemplate;
var path = require('path');
var request = require('request');
if (process.env.NODE_ENV === 'production') {
    var raven = require('raven');
    var client = new raven.Client('https://74b457b102ee49a2af0e22c5774b3817:48b5cf57fac145da923fa75bb09c1790@app.getsentry.com/90849');
    client.patchGlobal();
}

var User = mongoose.model('User');
var Business = mongoose.model('Business');
var Appointment = mongoose.model('Appointment');
// var Service = mongoose.model('Service');
// var Notification = mongoose.model('Notification');

var auth = jwt({secret: process.env.jwtSecret, userProperty: 'payload'});

var io = require('./sockets');
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

/**
 *
 *
 */
router.get('/customer', auth, function (req, res, next) {
    var user = req.query.customerId;
    var business = req.query.businessId;
    Appointment.find({'customer': user, 'businessId': business}).exec(function (error, appointments) {
        if (error) {
            return next(error);
        }
        res.json(appointments);
    })
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
router.post('/create', auth, function (req, res, next) {
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

    var firstApptTemplateDir = path.join(__dirname, '../emailTemplates', 'customer-first-appointment');
    var genApptTemplateDir = path.join(__dirname, '../emailTemplates', 'customer-general-appointment');

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
                url: 'http://' + process.env.devhost + ':3002/customers/create?email=' +
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
router.get('/all', auth, function (req, res, next) {
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
router.post('/update', auth, function (req, res, next) {

    var updatedAppointmentStart = req.body.start;
    var updatedAppointmentEnd = req.body.end;
    var updatedAppointmentId = req.body._id;
    var rescheduleTemplateDir = path.join(__dirname, '../emailTemplates', 'employee-reschedule');
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

router.post('/charge', auth, function (req, res, next) {
    var appointmentId = req.body._id;
    var appointmentCard = req.body.card;
    var price = req.body.price;
    var businessId = req.body.businessId;
    var successTemplateDir = path.join(__dirname, '../emailTemplates', 'customer-transaction-success');
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

router.post('/status-update', auth, function (req, res, next) {
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
router.post('/cancel', auth, function (req, res, next) {
    var appointment = req.body._id;
    if (req.body.customer) {
        var customer = req.body.customer._id;
    }
    var employee = req.body.employee;
    var templateDir;
    var templateObj = {};
    switch (req.payload._id) {
        case customer:
            templateDir = path.join(__dirname, '../emailTemplates', 'customer-cancel');
            break;
        case employee:
            templateDir = path.join(__dirname, '../emailTemplates', 'employee-cancel');
            break;
        default:
            templateDir = path.join(__dirname, '../emailTemplates', 'employee-cancel');
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

module.exports = router;