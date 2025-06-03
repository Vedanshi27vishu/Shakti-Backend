
const Follow = require('../Models/');

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
const getUsersWithFollowDetails = async (req, res) => {
  try {
    const followDocs = await Follow.find({
      $or: [
        { followers: { $exists: true, $not: { $size: 0 } } },
        { following: { $exists: true, $not: { $size: 0 } } }
      ]
    })
      .populate('user', 'name email')
      .populate('followers', 'name email')
      .populate('following', 'name email');

    const result = followDocs.map(doc => ({
      id: doc.user._id,
      name: doc.user.name,
      email: doc.user.email,
      follower: {
        count: doc.followers.length,
        users: doc.followers.map(f => ({
          id: f._id,
          name: f.name,
          email: f.email
        }))
      },
      following: {
        count: doc.following.length,
        users: doc.following.map(f => ({
          id: f._id,
          name: f.name,
          email: f.email
        }))
      }
    }));

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Error fetching followers data", error });
  }
};

module.exports = {
  followUser,
  unfollowUser,
  getSuggestedUsers,
  getUsersWithFollowDetails
};
