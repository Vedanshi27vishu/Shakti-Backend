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
  const { userId } = req;  // logged-in user
  const { followId } = req.params;

  if (userId === followId) return res.status(400).json({ message: "Cannot follow yourself" });

  try {
    // Get full names of both users
    const myName = await getFullNameByUserId(userId);
    const followUserName = await getFullNameByUserId(followId);

    if (!myName || !followUserName) {
      return res.status(404).json({ message: "User name not found" });
    }

    // Add to my "following" list
    await Follow.findOneAndUpdate(
      { user: userId },
      {
        user: userId,
        fullName: myName,
        $addToSet: {
          following: {
            userId: followId,
            fullName: followUserName
          }
        }
      },
      { upsert: true, new: true }
    );

    // Add to their "followers" list
    await Follow.findOneAndUpdate(
      { user: followId },
      {
        user: followId,
        fullName: followUserName,
        $addToSet: {
          followers: {
            userId: userId,
            fullName: myName
          }
        }
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      message: "Followed successfully",
      followedUser: {
        userId: followId,
        fullName: followUserName
      }
    });

  } catch (err) {
    console.error("Follow error:", err);
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
    const allUsers = await User.find({}, "_id fullName email"); // select necessary fields only

    const usersWithStats = await Promise.all(
      allUsers.map(async (user) => {
        const followData = await Follow.findOne({ user: user._id });
        const followersCount = followData?.followers?.length || 0;
        const followingCount = followData?.following?.length || 0;

        return {
          userId: user._id,
          fullName: user.fullName,
          email: user.email,
          followersCount,
          followingCount
        };
      })
    );

    res.status(200).json(usersWithStats);
  } catch (error) {
    console.error("Error fetching users with follow stats:", error);
    res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
};



module.exports = {
  followUser,
  unfollowUser,
  getSuggestedUsers,
  getFollowersAndFollowing
};