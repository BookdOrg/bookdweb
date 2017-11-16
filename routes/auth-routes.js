/**
 * Created by khalilbrown on 9/3/16.
 */
var express = require('express');
var router = express.Router();
var jwt = require('express-jwt');
var passport = require('passport');
var moment = require('moment');
require('moment-range');
var mongoose = require('mongoose');
var _ = require('lodash');
var nodemailer = require('nodemailer');
var EmailTemplate = require('email-templates').EmailTemplate;
var path = require('path');
if (process.env.NODE_ENV === 'production') {
    var raven = require('raven');
    var client = new raven.Client('https://74b457b102ee49a2af0e22c5774b3817:48b5cf57fac145da923fa75bb09c1790@app.getsentry.com/90849');
    client.patchGlobal();
}

var User = mongoose.model('User');

var auth = jwt({secret: process.env.jwtSecret, userProperty: 'payload'});

var wellknown = require('nodemailer-wellknown');
// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
    service: 'Zoho',
    auth: {
        user: 'contact@bookd.me',
        pass: process.env.emailPass
    }
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
        User.findOne({'email': req.body.username}).select('_id name firstName lastName email firstName lastName availabilityArray appointments businessOwner provider providerId notifications businesses isAssociate')
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
    var welcomeTemplateDir = path.join(__dirname, '../emailTemplates', 'welcome');
    if (req.body.provider === 'bookd') {
        if (!req.body.username || !req.body.password) {
            return res.status(400).json({message: 'Please fill out all fields'});
        }
        user.setPassword(req.body.password);
    }
    //TODO how should we handle passwords when a user logs in with an oauth provider? - Currently setting to random value. Can be overwitten by reset password
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
    user.dateCreated = moment().format('MMM Do YYYY, h:mm:ss a');

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

module.exports = router;