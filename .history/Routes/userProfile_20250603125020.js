const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const authenticateJWT = require('../Middlewares/authMiddleware');

// Models
const PersonalDetails = require('../Models/User');
const BusinessIdeaDetails = require('../models/BusinessIdeaDetails');
const Post = require('../models/Post');
const Follow = require('../models/Follow'); // Assuming your follower schema

router.get('/profile', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;

    // 1. Personal Info
    const user = await PersonalDetails.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // 2. Business Info
    const business = await BusinessIdeaDetails.findOne({ userId });

    // 3. Posts
    const posts = await Post.find({ user: userId });

    // 4. Followers/Following
    const follow = await Follow.findOne({ userId }); // your Follow schema must store followers and following arrays

    const response = {
      name: user.personalDetails.Full_Name,
      email: user.personalDetails.Email,
      businessName: business?.ideaDetails?.Business_Name || '',
      businessSector: business?.ideaDetails?.Business_Sector || '',
      businessLocation: business?.ideaDetails?.Business_Location || '',
      postCount: posts.length,
      followersCount: follow?.followers?.length || 0,
      followingCount: follow?.following?.length || 0,
      posts: posts // or posts.map(p => ({ content: p.content, ... }))
    };

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
