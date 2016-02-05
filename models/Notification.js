/**
 * Created by Jonfor on 12/23/15.
 */
var mongoose = require('mongoose');

var NotificationSchema = new mongoose.Schema({
    content: String,
    timestamp: String,
    type: String,
    viewed: Boolean,
    date: Object,
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
});

mongoose.model('Notification', NotificationSchema);
