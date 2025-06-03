const Post = require('../Models/community/PostSchema');
const User = require('../Models/community/communityUser');
const BusinessIdeaDetails = require('../Models/User/BusinessDetailSignup');
const personalDetails = require('../Models/User/PersonalDetailSignup');

// Create a Post
const createPost = async (req, res) => {
  try {
    const { content, mediaUrl } = req.body;
    if (!content) return res.status(400).json({ message: "Post content is required" });

    const newPost = await Post.create({
      user: req.userId,
      content,
      mediaUrl
    });

    res.status(201).json({ message: 'Post created', post: newPost });
  } catch (err) {
    console.error('Post creation failed', err);
    res.status(500).json({ message: 'Server error' });
  }
};


// Get Posts by Matching Business Sector
const getPostsByInterest = async (req, res) => {
  try {
    const userId = req.userId;

    // 1. Get user business sector
    const userBusiness = await BusinessIdeaDetails.findOne({ userId });
    if (!userBusiness) return res.status(404).json({ message: "Business idea not found" });

    const businessSector = userBusiness.ideaDetails.Business_Sector;

    // 2. Find all users with the same sector
    const matchingUsers = await BusinessIdeaDetails.find({
      "ideaDetails.Business_Sector": businessSector
    }).select('userId');

    const userIds = matchingUsers.map(user => user.userId);

    // 3. Fetch posts with populated name and counts
    const posts = await Post.find({ user: { $in: userIds } })
      .sort({ createdAt: -1 })
      .populate('user', 'Full_Name') // Poster’s name
      .populate('comments.postedBy', 'Full_Name');

    // 4. Format response to include like and comment counts
    const formattedPosts = posts.map(post => ({
      _id: post._id,
      content: post.content,
      mediaUrl: post.mediaUrl,
      interestTags: post.interestTags,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      user: post.user, // Will have Full_Name
      likeCount: post.likes.length,
      commentCount: post.comments.length,
      comments: post.comments
    }));

    res.status(200).json(formattedPosts);
  } catch (err) {
    console.error("Error fetching posts by business sector:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// Like or Unlike a Post
const likePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.userId;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const alreadyLiked = post.likes.includes(userId);
    if (alreadyLiked) {
      post.likes.pull(userId); // Unlike
    } else {
      post.likes.push(userId); // Like
    }

    await post.save();
    res.status(200).json({ message: alreadyLiked ? "Unliked" : "Liked", post });
  } catch (err) {
    console.error("Like failed", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// Comment on a Post
const commentOnPost = async (req, res) => {
  const { postId } = req.params;
  const { text } = req.body;
  const userId = req.userId;

  if (!text) return res.status(400).json({ message: "Comment text is required" });

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({ text, postedBy: userId });
    await post.save();

    res.status(200).json({ message: "Comment added", post });
  } catch (err) {
    console.error("Comment failed", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// Get Feed Posts from Followed Users
const getFeedPosts = async (req, res) => {
  const userId = req.userId;

  try {
    const user = await User.findById(userId);
    const followedUsers = user.following;

    const posts = await Post.find({ user: { $in: followedUsers } })
      .sort({ createdAt: -1 })
      .populate('user', 'name');

    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch feed" });
  }
};

module.exports = {
  createPost,
  getPostsByInterest,
  likePost,
  commentOnPost,
  getFeedPosts
};
