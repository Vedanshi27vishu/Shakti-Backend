
const Follow = require('../Models/followers');
const mongoose = require("mongoose");

const getFullNameByUserId = async (userId) => {
  try {
    const user = await PersonalDetails.findById(userId).select('personalDetails.Full_Name');
    return user?.personalDetails?.Full_Name || null;
  } catch (error) {
    console.error('Error fetching user full name:', error);
    return null;
  }
};

const followUser = async (req, res) => {
  const { userId } = req;  // logged-in user
  const { followId } = req.params;

  if (userId === followId) return res.status(400).json({ message: "Cannot follow yourself" });

  try {
    // Get or create follow documents
    const userFollow = await Follow.findOneAndUpdate(
      { user: userId },
      { $addToSet: { following: followId } },
      { upsert: true, new: true }
    );

    const followUserDoc = await Follow.findOneAndUpdate(
      { user: followId },
      { $addToSet: { followers: userId } },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Followed successfully" });
  } catch (err) {
    res.status(500).json({ error: "Follow failed", details: err.message });
  }
};

const unfollowUser = async (req, res) => {
  const { userId } = req;
  const { followId } = req.params;

  try {
    await Follow.findOneAndUpdate(
      { user: userId },
      { $pull: { following: followId } }
    );

    await Follow.findOneAndUpdate(
      { user: followId },
      { $pull: { followers: userId } }
    );

    res.status(200).json({ message: "Unfollowed successfully" });
  } catch (err) {
    res.status(500).json({ error: "Unfollow failed", details: err.message });
  }
};

const getSuggestedUsers = async (req, res) => {
  try {
    const currentUserFollow = await Follow.findOne({ user: req.userId });

    const excludedIds = currentUserFollow ? currentUserFollow.following : [];

    const suggested = await User.find({
      _id: { $nin: [...excludedIds, req.userId] }
    })
      .select('name email businessIdea')
      .limit(10);

    res.status(200).json(suggested);
  } catch (error) {
    res.status(500).json({ message: "Failed to get suggestions", error });
  }
};

// ✅ Get list of users with followers/following info
const getFollowersAndFollowing = async (req, res) => {
  try {
    const userId = req.userId; // from JWT middleware

    // Find the follow document of the current user
    const followData = await Follow.findOne({ user: userId });

    if (!followData) {
      return res.status(404).json({ message: "No followers/following data found" });
    }

    // Convert all ObjectIds to string to avoid mismatch issues
    const followingIds = followData.following.map(id => new mongoose.Types.ObjectId(id));
    const followerIds = followData.followers.map(id => new mongoose.Types.ObjectId(id));

    // Fetch user names from User collection
    const followingUsers = await User.find({ _id: { $in: followingIds } }).select("name email");
    const followerUsers = await User.find({ _id: { $in: followerIds } }).select("name email");

    res.status(200).json({
      followers: followerUsers,
      following: followingUsers
    });

  } catch (error) {
    console.error("Error in followers_following:", error); // Now logs error
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
