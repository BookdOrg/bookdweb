/**
 * Created by khalilbrown on 9/3/16.
 */
var express = require('express');
var app = require('express')();
var router = express.Router();
var Busboy = require('busboy');
var moment = require('moment');
var mongoose = require('mongoose');
var nodemailer = require('nodemailer');
var EmailTemplate = require('email-templates').EmailTemplate;

var BetaUser = mongoose.model('BetaUser');

var transporter = nodemailer.createTransport({
    service: 'Zoho',
    auth: {
        user: 'contact@bookd.me',
        pass: process.env.emailPass
    }
});
var userTypes = {'barber': 'barber', 'shopOwner': 'shopOwner', 'client': 'client', 'other': 'other'};
router.post('/sign-up', function (req, res) {
    var email = req.param('email');
    var type = req.param('userType');
    var newUser = new BetaUser();
    newUser.email = email;
    newUser.type = type;
    newUser.save(function (error, user) {
        if (error) {
            next(error);
        }
    });
    res.render('signup-success.ejs', {root: __dirname});
});

module.exports = router;