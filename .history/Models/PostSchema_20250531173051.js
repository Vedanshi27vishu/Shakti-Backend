const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'UserCommunity', required: true },

  content: { type: String, required: true },
  mediaUrl: { type: String },

  interestTags: [String],

  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserCommunity' }],

  comments: [
    {
      text: String,
      postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserCommunity' },
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
