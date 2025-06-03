const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },       // who is following
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],                // whom they follow
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]                 // who follows them
});

module.exports = mongoose.model('Follow', followSchema);
