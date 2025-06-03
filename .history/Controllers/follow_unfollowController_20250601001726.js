const Follow = require('../Models/followers');
const mongoose = require("mongoose");
const PersonalDetails = require('../Models/User/PersonalDetailSignup');

// Helper to get full name from PersonalDetails model
const getFullNameByUserId = async (userId) => {
  try {
    const user = await PersonalDetails.findById(userId).select('personalDetails.Full_Name');
    return user?.personalDetails?.Full_Name || null;
  } catch (error) {
    console.error('Error fetching user full name:', error);
    return null;
  }
};

// FOLLOW a user
const followUser = async (req, res) => {
  const { userId } = req;  // logged-in user
  const { followId } = req.params;

  if (userId === followId) {
    return res.status(400).json({ message: "Cannot follow yourself" });
  }

  try {
    // Get full names
    const loggedInUserName = await getFullNameByUserId(userId);
    const followUserName = await getFullNameByUserId(followId);

    // Push to following of current user
    await Follow.findOneAndUpdate(
      { user: userId },
      {
        fullName: loggedInUserName,
        $addToSet: {
          following: {
            userId: followId,
            fullName: followUserName
          }
        }
      },
      { upsert: true, new: true }
    );

    // Push to followers of followed user
    await Follow.findOneAndUpdate(
      { user: followId },
      {
        fullName: followUserName,
        $addToSet: {
          followers: {
            userId: userId,
            fullName: loggedInUserName
          }
        }
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Followed successfully" });

  } catch (err) {
    res.status(500).json({ error: "Follow failed", details: err.message });
  }
};


// UNFOLLOW a user
const unfollowUser = async (req, res) => {
  const { userId } = req;
  const { followId } = req.params;

  try {
    await Follow.findOneAndUpdate(
      { user: userId },
      { $pull: { following: { userId: followId } } }
    );

    await Follow.findOneAndUpdate(
      { user: followId },
      { $pull: { followers: { userId: userId } } }
    );

    res.status(200).json({ message: "Unfollowed successfully" });

  } catch (err) {
    res.status(500).json({ error: "Unfollow failed", details: err.message });
  }
};

// GET suggested users (not followed yet)
const getSuggestedUsers = async (req, res) => {
  try {
    const currentUserFollow = await Follow.findOne({ user: req.userId });
    const excludedIds = currentUserFollow
      ? currentUserFollow.following.map(u => u.userId)
      : [];

    const suggested = await PersonalDetails.find({
      _id: { $nin: [...excludedIds, req.userId] }
    }).select('personalDetails.Full_Name');

    const suggestions = suggested.map(user => ({
      userId: user._id,
      fullName: user.personalDetails.Full_Name
    }));

    res.status(200).json(suggestions);

  } catch (error) {
    res.status(500).json({ message: "Failed to get suggestions", error });
  }
};

// GET followers and following with full names
const getFollowersAndFollowing = async (req, res) => {
  try {
    const userId = req.userId;

    const followData = await Follow.findOne({ user: userId });

    if (!followData) {
      return res.status(404).json({ message: "No followers/following data found" });
    }

    res.status(200).json({
      fullName: followData.fullName,
      followers: followData.followers,
      following: followData.following
    });

  } catch (error) {
    console.error("Error in getFollowersAndFollowing:", error);
    res.status(500).json({
      message: "Error fetching followers data",
      error: error.message || error.toString(),
    });
  }
};

module.exports = {
  followUser,
  unfollowUser,
  getSuggestedUsers,
  getFollowersAndFollowing
};
