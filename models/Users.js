var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');

var UserSchema = new mongoose.Schema({
    name: String,
    email: {type: String, unique: true},
    avatarVersion: String,
    provider: String,
    rating: Number,
    businessOwner: Boolean,
    hash: String,
    salt: String,
    isAssociate: Boolean,
    isAdmin: Boolean,
    settings: Object,
    notifications: [],
    availability: Object,
    businesses: [{type: mongoose.Schema.Types.ObjectId, ref: 'Business'}],
    personalAppointments: [{type: mongoose.Schema.Types.ObjectId, ref: 'Appointment'}],
    businessAppointments: [{type: mongoose.Schema.Types.ObjectId, ref: 'Appointment'}]
});

UserSchema.methods.validPassword = function (password) {
    var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');

    return this.hash === hash;
};

UserSchema.methods.setPassword = function (password) {
    this.salt = crypto.randomBytes(16).toString('hex');

    this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
};

UserSchema.methods.generateJWT = function () {

    // set expiration to 1 days
    var today = new Date();
    var exp = new Date(today);
    exp.setDate(today.getDate() + 1);

    return jwt.sign({
        _id: this._id,
        avatarVersion: this.avatarVersion,
        businessOwner: this.businessOwner,
        businessPage: this.businessPage,
        exp: parseInt(exp.getTime() / 1000),
        isAdmin: this.isAdmin,
        isAssociate: this.isAssociate,
        name: this.name,
        provider: this.provider,
        email: this.email,
        availability:this.availability
    }, 'SECRET');
};

mongoose.model('User', UserSchema);
