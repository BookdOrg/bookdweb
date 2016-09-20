/**
 * Created by khalilbrown on 9/3/16.
 */
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
if (process.env.NODE_ENV === 'production') {
    var raven = require('raven');
    var client = new raven.Client('https://74b457b102ee49a2af0e22c5774b3817:48b5cf57fac145da923fa75bb09c1790@app.getsentry.com/90849');
    client.patchGlobal();
}

var User = mongoose.model('User');
var Business = mongoose.model('Business');
var Appointment = mongoose.model('Appointment');
var Service = mongoose.model('Service');
var Notification = mongoose.model('Notification');

var auth = jwt({secret: process.env.jwtSecret, userProperty: 'payload'});

var io = require('./sockets');
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

/**
 *  Returns all Dashboard information
 *
 *
 */
router.get('/dashboard', auth, function (req, res, next) {
    var id = req.payload._id;
    var updatedBusinesses = [];
    User.findOne({'_id': id}).select('_id name firstName lastName avatarVersion businesses').populate([{
        path: 'businesses',
        select: 'name services employees placesId dateCreated tier owner stripeId payments stripeAccount customers'
    }])
        .exec(function (error, user) {
            if (error) {
                return next(error);
            }
            async.each(user.businesses, function (currBusiness, businessCallback) {
                Business.findOne({'_id': currBusiness._id}).select('name services employees customers placesId dateCreated tier owner stripeId stripeAccount payments')
                    .populate([{path: 'services', select: ''},
                        {
                            path: 'employees',
                            select: '_id name firstName lastName avatarVersion provider providerId availabilityArray authorizedUsers'
                        },
                        {path: 'customers', select: '_id email firstName lastName mobile name provider providerId'}
                    ]).exec(function (error, response) {
                    if (error) {
                        return businessCallback(error);
                    }
                    Service.populate(response.services, {
                        path: 'employees',
                        select: '_id name firstName lastName avatarVersion availabilityArray provider providerId authorizedUsers'
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
/**
 *
 *
 */
router.get('/dashboard/stripe-account', auth, function (req, res, next) {
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
/**
 *
 *
 */
router.get('/dashboard/stripe-balance', auth, function (req, res, next) {
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
/**
 *
 *
 */
router.get('/dashboard/stripe-balance-history', auth, function (req, res, next) {
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
/**
 *
 *
 */
router.get('/dashboard/stripe-charges', auth, function (req, res, next) {
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

/**
 *   Queries & returns google places for a business based on a
 *   text search.
 **/
router.get('/search', function (req, res, next) {
    var query = req.query.query;
    var updatedBusinesses = [];
    var populateQuery = [{path: 'services', select: ''}, {
        path: 'employees',
        select: '_id businessAppointments name firstName lastName avatarVersion provider providerId availabilityArray associateDescription authorizedUsers'
    }];

    var parameters = {
        query: query
    };
    googleplaces.textSearch(parameters, function (error, response) {
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
                    select: '_id businessAppointments name firstName lastName avatarVersion provider providerId availabilityArray associateDescription authorizedUsers'
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
router.get('/details', function (req, res, next) {
    var id = req.query.placesId;
    Business.findOne({'placesId': id}).populate([{
        path: 'employees',
        select: '_id businessAppointments name firstName lastName avatarVersion availabilityArray provider providerId associateDescription authorizedUsers'
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
                select: '_id businessAppointments name firstName lastName avatarVersion availabilityArray provider providerId associateDescription authorizedUsers'
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
router.get('/info', function (req, res, next) {
    var id = req.query.id;
    Business.findOne({'_id': id}).populate([{
        path: 'employees',
        select: '_id businessAppointments name firstName lastName avatarVersion availabilityArray providerId provider associateDescription authorizedUsers'
    }, {path: 'services', select: ''}]).exec(function (error, business) {
        if (error) {
            return next(error);
        }
        Service.populate(business.services, {
            path: 'employees',
            select: '_id businessAppointments name firstName lastName avatarVersion availabilityArray providerId provider associateDescription authorizedUsers'
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
router.post('/add-employee', auth, function (req, res, next) {
    var addEmployeeTemplateDir = path.join(__dirname, '../emailTemplates', 'add-employee');
    var businessId = req.body.businessId;
    var employeeId = req.body.employeeId;
    var businessName = req.body.businessName;
    var employeeSocketObj = _.find(clients, {'customId': employeeId});
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
                employee.authorizedUsers.pushIfNotExist(req.payload._id, function (e) {
                    return e == req.payload._id;
                });
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
                    io.sockets.to(employeeSocketObj.id).emit('update-user', employee);
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
            select: '_id appointments name firstName lastName avatarVersion availabilityArray provider providerId associateDescription authorizedUsers'
        }, {path: 'services', select: ''}], function (err, busResponse) {
            if (err) {
                return next(err);
            }
            Service.populate(busResponse.services, {
                path: 'employees',
                select: '_id appointments name firstName lastName avatarVersion availabilityArray provider providerId associateDescription authorizedUsers'
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
router.post('/customers/create', auth, function (req, res, next) {
    var name = req.query.name;
    var mobile = req.query.mobile;
    var email = req.query.email;
    var businessId = req.query.business;
    async.waterfall([
        function (done) {
            if (email !== 'null') {
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
            } else if (email == 'null' && name) {
                var user = new User();
                user.name = name;
                var firstLast = name.split(' ', 2);
                user.firstName = firstLast[0];
                user.lastName = firstLast[1];
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
            }
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
router.get('/customers', auth, function (req, res, next) {
    Business.findOne({"_id": req.query.businessId}).select('customers').populate({
        'path': "customers",
        select: 'name _id firstName lastName providerId avatarVersion provider email mobile'
    }).exec(function (err, results) {
        if (err) {
            return next(err);
        }
        res.json(results.customers);
    })
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
router.post('/remove-employee', auth, function (req, res, next) {
    var businessId = req.body.businessId;
    var employeeId = req.body.employeeId;
    var serviceIds = req.body.serviceList;
    // var employeeSocketObj = _.find(clients, {'customId': employeeId});
    var removeEmployeeTemplateDir = path.join(__dirname, '../emailTemplates', 'remove-employee');
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
                    var authorizedIndex = user.authorizedUsers.indexOf(req.payload._id);
                    if (authorizedIndex > -1) {
                        user.authorizedUsers.splice(authorizedIndex, 1);
                    }
                    var availabilityIndex = _.findIndex(user.availabilityArray, {'businessId': businessId});
                    user.availabilityArray.splice(availabilityIndex, 1);
                    if (employeeSocketObj) {
                        io.sockets.to(employeeSocketObj.id).emit('update-user', user);
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
router.post('/add-service', auth, function (req, res, next) {
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
                select: '_id appointments name firstName lastName avatarVersion availabilityArray provider providerId authorizedUsers'
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

router.post('/update-service', auth, function (req, res, next) {
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
        select: '_id businessAppointments appointments name firstName lastName avatarVersion availabilityArray provider providerId authorizedUsers'
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
router.post('/remove-service', auth, function (req, res, next) {
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
router.post('/claim-request', auth, function (req, res, next) {
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
    business.shopSize = req.body.shopSize;
    business.shopModel = req.body.shopModel;
    business.accountType = req.body.accountType;

    Business.findOne({'placesId': req.body.placesId}).exec(function (err, response) {
        var businessRequestDir = path.join(__dirname, '../emailTemplates', 'business-request');
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
router.get('/service-detail', auth, function (req, res, next) {
    var serviceId = req.query.service;
    Service.findOne({'_id': serviceId}).populate({
        path: 'employees',
        select: '_id appointments name firstName lastName avatarVersion availabilityArray provider providerId associateDescription authorizedUsers'
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
router.post('/update-payments-account', auth, function (req, res, next) {
    var bankingUpdatedSuccessDir = path.join(__dirname, '../emailTemplates', 'banking-updated-success');
    //var bankingUpdatedFailureDir = path.join(__dirname, '../emailTemplates', 'banking-updated-failure');
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

router.post('/contact', function (req, res, next) {
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
        body = '</br>' + name + '</br>' + message + '</br>' + phone + '</br>' + email;
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
            var resetPassDir = path.join(__dirname, '../emailTemplates', 'password-reset');
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

module.exports = router;