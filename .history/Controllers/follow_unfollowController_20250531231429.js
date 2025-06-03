const Follow = require('../Models/followers');
const mongoose = require("mongoose");
const PersonalDetails = require('../Models/User/PersonalDetailSignup');


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
  const { userId } = req;
  const { followId } = req.params;

  if (userId === followId) {
    return res.status(400).json({ message: "Cannot follow yourself" });
  }

  try {
    const followerName = await getFullNameByUserId(userId);
    const followeeName = await getFullNameByUserId(followId);

    // 👇 Upsert for the logged-in user (ensures fullName is set)
    await Follow.findOneAndUpdate(
      { user: userId },
      {
        $set: { fullName: followerName || "Unknown" },
        $addToSet: { following: { userId: followId, fullName: followeeName || "Unknown" } }
      },
      { upsert: true, new: true }
    );

    // 👇 Upsert for the followed user
    await Follow.findOneAndUpdate(
      { user: followId },
      {
        $set: { fullName: followeeName || "Unknown" },
        $addToSet: { followers: { userId: userId, fullName: followerName || "Unknown" } }
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      message: "Followed successfully",
      followedUser: {
        userId: followId,
        fullName: followeeName || "Unknown"
      }
    });

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

    const followingIds = followData.following.map(id => new mongoose.Types.ObjectId(id));
    const followerIds = followData.followers.map(id => new mongoose.Types.ObjectId(id));

    // Fetch full names for following
    const followingUsers = await Promise.all(
      followingIds.map(async (id) => {
        const fullName = await getFullNameByUserId(id);
        return {
          userId: id,
          fullName: fullName || "Unknown User"
        };
      })
    );

    // Fetch full names for followers
    const followerUsers = await Promise.all(
      followerIds.map(async (id) => {
        const fullName = await getFullNameByUserId(id);
        return {
          userId: id,
          fullName: fullName || "Unknown User"
        };
      })
    );

    res.status(200).json({
      followers: followerUsers,
      following: followingUsers
    });

  } catch (error) {
    console.error("Error in followers_following:", error);
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
