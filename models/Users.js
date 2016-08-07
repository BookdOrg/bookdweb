var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt');
var UserSchema = new mongoose.Schema({
    name: String,
    firstName: String,
    lastName: String,
    mobile: String,
    email: {type: String, unique: true},
    avatarVersion: String,
    provider: String,
    providerId: String,
    rating: Number,
    businessOwner: Boolean,
    hash: String,
    isAssociate: Boolean,
    isPropietor: Boolean,
    isAdmin: Boolean,
    settings: Object,
    availabilityArray: [],
    associatePhotos: [],
    associateDescription: String,
    businesses: [{type: mongoose.Schema.Types.ObjectId, ref: 'Business'}],
    authorizedUsers: [],
    appointments: [{type: mongoose.Schema.Types.ObjectId, ref: 'Appointment'}],
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

UserSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.hash);
};

UserSchema.methods.setPassword = function (password) {
    this.hash = bcrypt.hashSync(password, 10);
};

UserSchema.methods.generateJWT = function () {

    // set expiration to 1 days
    var today = new Date();
    var exp = new Date(today);
    exp.setDate(today.getDate() + 1);

    return jwt.sign({
        _id: this._id,
        exp: parseInt(exp.getTime() / 1000)
    }, process.env.jwtSecret);
};

mongoose.model('User', UserSchema);
