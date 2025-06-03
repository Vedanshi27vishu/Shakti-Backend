// routes/user.js
const express = require('express');
const router = express.Router();
const requireAuth = require('../Middlewares/authMiddleware');

// Mongoose models
const User = require('../Models/User/PersonalDetailSignup');
const Business = require('../Models/User/BusinessDetailSignup');
const Financial = require('../Models/User/FinancialDetailSignup');

router.get('/me', requireAuth, async (req, res) => {
  const userId = req.userId;

  try {
    const user = await User.findById(userId).select('-password'); // exclude password if it exists
    const businessDetails = await Business.findOne({ userId });   // assuming you store userId in these docs
    const financialDetails = await Financial.findOne({ userId });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({
      user,
      businessDetails,
      financialDetails,
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
// all user that exist that you can follow
router.get('/all-users', requireAuth, async (req, res) => {
  const currentUserId = req.userId;

  try {
    // Get all other users and only select the Full_Name field
    const users = await User.find(
      { _id: { $ne: currentUserId } }
    ).select('personalDetails.Full_Name');

    // Clean response: just return full names
    const names = users.map(user => ({
      id: user._id,
      fullName: user.personalDetails.Full_Name
      email: user.
    }));

    res.status(200).json({ users: names });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



module.exports = router;
