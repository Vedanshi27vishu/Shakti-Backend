const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: { // Consistent key name
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PersonalDetails',
    required: true
  },
  content: { type: String, required: true },
  mediaUrl: String,
  interestTags: [String],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PersonalDetails' }],
  comments: [
    {
      text: String,
      postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'PersonalDetails' },
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
