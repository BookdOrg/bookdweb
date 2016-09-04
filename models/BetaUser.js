/**
 * Created by khalilbrown on 9/3/16.
 */
var mongoose = require('mongoose');
var BetaUserSchema = new mongoose.Schema({
    email: {type: String, unique: true},
    type: String
});

mongoose.model('BetaUser', BetaUserSchema);
