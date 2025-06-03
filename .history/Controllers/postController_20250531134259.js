const Post = require('../Models/PostSchema');
const BusinessIdeaDetails = require('../Models/User/BusinessDetailSignup');
const PersonalDetails = require('../Models/User/PersonalDetailSignup');

// Create Post
const createPost = async (req, res) => {
  try {
    const { content, mediaUrl } = req.body;
    if (!content) return res.status(400).json({ message: "Post content is required" });

    const newPost = await Post.create({
      userP: req.userId, // from middleware
      content,
      mediaUrl
    });

    res.status(201).json({ message: 'Post created', post: newPost });
  } catch (err) {
    console.error('Post creation failed', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Posts by Interest (same business sector)
const Post = require('../Models/community/PostSchema');
const BusinessIdeaDetails = require('../Models/User/BusinessDetailSignup');
const PersonalDetails = require('../Models/User/PersonalDetailSignup'); // ensure name is correct

const getPostsByInterest = async (req, res) => {
  try {
    const userId = req.userId; // userId from JWT middleware

    // Step 1: Find the business sector of the current user
    const userBusiness = await BusinessIdeaDetails.findOne({ userId });
    if (!userBusiness) {
      return res.status(404).json({ message: "Business idea not found for this user" });
    }

    const businessSector = userBusiness.ideaDetails.Business_Sector;

    // Step 2: Get all users in the same business sector
    const matchingUsers = await BusinessIdeaDetails.find({
      "ideaDetails.Business_Sector": businessSector
    }).select('userId'); // userId in BusinessIdeaDetails points to PersonalDetails

    const userIds = matchingUsers.map(user => user.userId.toString());

    // Step 3: Fetch posts created by users in that sector
    const posts = await Post.find({ userP: { $in: userIds } })
      .sort({ createdAt: -1 })
      .populate('userP', 'Full_Name') // Full_Name from PersonalDetails
      .populate('comments.postedBy', 'Full_Name');

    res.status(200).json(posts);
  } catch (err) {
    console.error("Error fetching posts by business sector:", err);
    res.status(500).json({ message: "Server error" });
  }
};



// Like/Unlike Post
const likePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.userId;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const alreadyLiked = post.likes.includes(userId);
    if (alreadyLiked) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.status(200).json({ message: alreadyLiked ? "Unliked" : "Liked", post });
  } catch (err) {
    console.error("Like failed", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// Comment on Post
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

module.exports = {
  createPost,
  getPostsByInterest,
  likePost,
  commentOnPost
};
