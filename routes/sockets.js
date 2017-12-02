/**
 * Created by khalilbrown on 9/3/16.
 */
//Created by Khalil -
// var express = require('express');
var app = require('express')();
// var jwt = require('express-jwt');
// var passport = require('passport');
// var cloudinary = require('cloudinary');
// var async = require('async');
var moment = require('moment');
// var crypto = require('crypto');
require('moment-range');
// var GooglePlaces = require('googleplaces');
// var googleplaces = new GooglePlaces(process.env.GOOGLE_PLACES_API_KEY, process.env.GOOGLE_PLACES_OUTPUT_FORMAT);
var mongoose = require('mongoose');
var _ = require('lodash');
// var stripe = require('stripe')(process.env.stripeDevSecret);
var nodemailer = require('nodemailer');
// var EmailTemplate = require('email-templates').EmailTemplate;
// var path = require('path');
// var request = require('request');
if (process.env.NODE_ENV === 'production') {
    var Raven = require('raven');
    Raven.config('https://f3036b05fed14259931f21238616f989:af33b643f270480297fd163281854868@sentry.io/249177').install();
}
var User = mongoose.model('User');
var Business = mongoose.model('Business');
var Appointment = mongoose.model('Appointment');
var Service = mongoose.model('Service');
var Notification = mongoose.model('Notification');

var server;
if (process.env.NODE_ENV === 'production') {
    server = require('http').createServer(app);
} else {
    var fs = require('fs');
    var options = {
        key: fs.readFileSync(process.env.keyLoc),
        cert: fs.readFileSync(process.env.certLoc)
    };
    server = require('https').createServer(options, app);
    console.log(server.listening)
}
var io = require('socket.io')(server);
var redis = require('socket.io-redis');
io.adapter(redis({host: process.env.devhost, port: 6379}));
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
console.log(server.listening);
var roomData = [];
global.clients = [];

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
        // socket.join(data.user);
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
            var holdList = _.find(roomData, {id: string});
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
            roomData = _.without(roomData, _.find(roomData, {'user': data.user}));
            io.sockets.in(data.roomId).emit('destroyOld', data);
        }
    });
    /**
     *
     * When the socket disconnects for whatever reason we want to remove them for any places where they were stored.
     *
     */
    socket.on('disconnect', function () {
        roomData = _.without(roomData, _.find(roomData, {'user': socketTimeData.user}));
        io.sockets.in(string).emit('destroyOld', socketTimeData);
        clients = _.without(clients, _.find(clients, {'id': socket.id}));
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
        var employeeSocket = _.find(clients, {'customId': appt.employee._id});
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
        var employeeSocket = _.find(clients, {'customId': data.appointment.employee._id});
        var customerSocket = _.find(clients, {'customId': data.appointment.customer._id});
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
        var employeeSocket = _.find(clients, {'customId': data.appointment.employee._id});
        var customerSocket = _.find(clients, {'customId': data.appointment.customer._id});
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
        var userSocket = _.find(clients, {'customId': data.id});
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
module.exports.clients = clients;
module.exports = io;
