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
var raven = require('raven');
var client = new raven.Client('https://74b457b102ee49a2af0e22c5774b3817:48b5cf57fac145da923fa75bb09c1790@app.getsentry.com/90849');
client.patchGlobal();

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
    var key = process.env.keyLoc;
    var cert = process.env.certLoc;
    var options = {
        key: fs.readFileSync(key.toString()),
        cert: fs.readFileSync(cert.toString())
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
module.exports = router;
