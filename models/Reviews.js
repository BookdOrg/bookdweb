var mongoose = require('mongoose');

var ReviewSchema = new mongoose.Schema({
    body: String,
    author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    timestamp: String,
    associate: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
});

mongoose.model('Review', ReviewSchema);
