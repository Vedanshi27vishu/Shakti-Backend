const mongoose = require('mongoose');

const userRefSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: {
    type: String,
    required: true
  }
}, { _id: false }); // prevent automatic _id inside subdocuments

const followSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  following: [userRefSchema],   // whom this user follows (with name)
  followers: [userRefSchema]    // who follows this user (with name)
}, {
  timestamps: true
});

module.exports = mongoose.model('Follow', followSchema);
