
var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');

var UserSchema = new mongoose.Schema({
  username: {type: String, lowercase: true, unique: true},
  firstName: String,
  lastName: String,
  avatarVersion: String,
  rating: Number,
  businessOwner: Boolean,
  businessPage: String, 
  hash: String,
  salt: String,
  isEmployee: Boolean,
  isAdmin: Boolean,
  businesses: [{type: mongoose.Schema.Types.ObjectId, ref: 'Business'}],
  personalAppointments: [{type: mongoose.Schema.Types.ObjectId, ref: 'Appointment'}],
  businessAppointments: [{type: mongoose.Schema.Types.ObjectId, ref: 'Appointment'}],
  interests: [{type: mongoose.Schema.Types.ObjectId, ref: 'Category'}]
});

UserSchema.methods.validPassword = function(password) {
  var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');

  return this.hash === hash;
};

UserSchema.methods.setPassword = function(password){
  this.salt = crypto.randomBytes(16).toString('hex');

  this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
};

UserSchema.methods.generateJWT = function() {

  // set expiration to 60 days
  var today = new Date();
  var exp = new Date(today);
  exp.setDate(today.getDate() + 60);

  return jwt.sign({
    _id: this._id,
    username: this.username,
    firstName: this.firstName,
    lastName: this.lastName,
    isAdmin: this.isAdmin,
    businessPage: this.businessPage,
    exp: parseInt(exp.getTime() / 1000),
  }, 'SECRET');
};

mongoose.model('User', UserSchema);
