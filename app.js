var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var cloudinary = require('cloudinary');

mongoose.connect('mongodb://localhost/clientconnect');

require('./models/Business');
require('./models/Reviews');
require('./models/Users');
require('./models/Categories');
require('./models/Appointments');
require('./models/Service');
require('./models/Notification');

require('./config/passport');

var routes = require('./routes/index');

var app = express();

cloudinary.config({
    cloud_name:'dvvtn4u9h',
    api_key: '357545475786479',
    api_secret: process.env.devcloudinarySecret
});

app.locals.api_key = cloudinary.config().api_key;
app.locals.cloud_name = cloudinary.config().cloud_name;
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));
app.use(express.static(path.join(__dirname, 'node_modules')));

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Authorization,Content-Type');
    next();
};

app.use(allowCrossDomain);
app.use(passport.initialize());
app.use('/', routes);
app.all('/*', function (req, res) {
    //TODO Find out why this works
    //Returns a 404 if a js or css file can't be found
    if (req.path.indexOf('.js') > -1 || req.path.indexOf('.css') > -1) {
        res.status(404);
    }

    res.render('index.ejs', {root: __dirname});
});

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        console.log(err.stack);
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
console.log('Server started using settings: Port: ' +process.env.devlocalPort + "\nhost: "
    + process.env.devhost + "\nenvironment: " + process.env.NODE_ENV);
module.exports = app;
