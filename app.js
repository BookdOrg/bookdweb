var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var cloudinary = require('cloudinary');
var helmet = require('helmet');
var session = require('express-session');

mongoose.connect('mongodb://localhost/clientconnect');

require('./models/Business');
require('./models/Reviews');
require('./models/Users');
require('./models/Appointments');
require('./models/Service');
require('./models/Notification');

require('./config/passport');

var routes = require('./routes/index');
var sockets = require('./routes/sockets');
var userRoutes = require('./routes/user-routes');
var businessRoutes = require('./routes/business-routes');
var authRoutes = require('./routes/auth-routes');

var app = express();

app.use(helmet({
  frameguard: {
    action: 'deny'
  }
}));

cloudinary.config({
    cloud_name: 'dvvtn4u9h',
    api_key: '357545475786479',
    api_secret: process.env.devcloudinarySecret
});

app.locals.api_key = cloudinary.config().api_key;
app.locals.cloud_name = cloudinary.config().cloud_name;
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon(__dirname + '/public/images/favicon.ico'));
if (process.env.NODE_ENV === 'development') {
    app.use(logger('dev'));
} else {
    app.use(logger('combined'));
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(session({
    secret: '87a8ce31eb24443cef222fa8cbae5da1e4876f92ec87b0b81c37ce137d52c23d',
    resave: false,
    saveUninitialized: false
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));
app.use(express.static(path.join(__dirname, 'node_modules')));

var allowCrossDomain = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Authorization,Content-Type');
    next();
};

app.use(allowCrossDomain);
app.use(passport.initialize());
app.use(passport.session());
app.use('/user',userRoutes);
app.use('/business',businessRoutes);
app.use('/auth',authRoutes);
app.use('/socket',sockets);
app.all('/*', function (req, res) {
    //TODO Find out why this works
    //Returns a 404 if a js or css file can't be found
    if (req.path.indexOf('.js') > -1 || req.path.indexOf('.css') > -1) {
        res.status(404);
    }

    res.render('index.ejs', {root: __dirname});
});

/// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
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
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
console.log('Server started using settings: Port: ' + process.env.devlocalPort + "\nhost: "
    + process.env.devhost + "\nenvironment: " + process.env.NODE_ENV);
module.exports = app;
