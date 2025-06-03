const Post = require('../Models/community/PostSchema');
const User = require('../Models/community/communityUser');
const BusinessIdeaDetails = require('../Models/User/BusinessDetailSignup');
const PersonalDetails = require('../Mode');

// Create a Post
const createPost = async (req, res) => {
  try {
    const { content, mediaUrl } = req.body;
    if (!content) return res.status(400).json({ message: "Post content is required" });

    console.log('Creating post for user ID:', req.userId); // Debug log

    const newPost = await Post.create({
      user: req.userId,
      content,
      mediaUrl
    });

    console.log('Post created:', newPost); // Debug log

    // Try to populate the created post
    const populatedPost = await Post.findById(newPost._id)
      .populate('user'); // First try simple population

    console.log('Populated post:', populatedPost); // Debug log

    res.status(201).json({ 
      message: 'Post created', 
      post: {
        ...populatedPost.toObject(),
        likesCount: populatedPost.likes.length,
        commentsCount: populatedPost.comments.length
      }
    });
  } catch (err) {
    console.error('Post creation failed', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Posts by Matching Business Sector - with debugging
const getPostsByInterest = async (req, res) => {
  try {
    const userId = req.userId;
    console.log('Fetching posts for user:', userId);

    // Step 1: Get logged-in user's business sector
    const userBusiness = await BusinessIdeaDetails.findOne({ userId });
    if (!userBusiness) return res.status(404).json({ message: "Business idea not found" });

    const businessSector = userBusiness.ideaDetails.Business_Sector;
    console.log('Business sector:', businessSector);

    // Step 2: Find all users in the same business sector
    const matchingUsers = await BusinessIdeaDetails.find({
      "ideaDetails.Business_Sector": businessSector
    }).select('userId');

    const userIds = matchingUsers.map(user => user.userId);
    console.log('Matching user IDs:', userIds);

    // Step 3: First, let's check what posts exist
    const allPosts = await Post.find({ user: { $in: userIds } });
    console.log('Found posts:', allPosts.map(p => ({ id: p._id, user: p.user })));

    // Step 4: Try different population approaches
    let posts;
    
    // Method 1: Try simple user population first
    try {
      posts = await Post.find({ user: { $in: userIds } })
        .sort({ createdAt: -1 })
        .populate('user');
      
      console.log('Method 1 - Simple populate result:', posts.map(p => ({ 
        id: p._id, 
        user: p.user,
        userPopulated: !!p.user 
      })));
      
      // If user is populated, try to get personal details
      if (posts.length > 0 && posts[0].user) {
        // Method 2: Populate personal details
        posts = await Post.find({ user: { $in: userIds } })
          .sort({ createdAt: -1 })
          .populate({
            path: 'user',
            populate: {
              path: 'personalDetails',
              model: 'PersonalDetails',
              select: 'Full_Name'
            }
          });
      }
    } catch (populateError) {
      console.error('Population error:', populateError);
      // Fallback: get posts without population
      posts = await Post.find({ user: { $in: userIds } }).sort({ createdAt: -1 });
    }

    // Method 3: Manual lookup if population fails
    const postsWithUserInfo = await Promise.all(posts.map(async (post) => {
      let userName = 'Unknown User';
      
      if (post.user) {
        // If user is populated, get name from personalDetails
        if (post.user.personalDetails && post.user.personalDetails.Full_Name) {
          userName = post.user.personalDetails.Full_Name;
        } else {
          // Try to find personal details manually
          const personalDetails = await PersonalDetails.findOne({ userId: post.user._id || post.user });
          if (personalDetails && personalDetails.Full_Name) {
            userName = personalDetails.Full_Name;
          }
        }
      } else if (post.user) {
        // If user field exists but not populated, try manual lookup
        const personalDetails = await PersonalDetails.findOne({ userId: post.user });
        if (personalDetails && personalDetails.Full_Name) {
          userName = personalDetails.Full_Name;
        }
      }

      return {
        ...post.toObject(),
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
        userName: userName
      };
    }));

    console.log('Final posts with user info:', postsWithUserInfo.map(p => ({ 
      id: p._id, 
      userName: p.userName 
    })));

    res.status(200).json(postsWithUserInfo);
  } catch (err) {
    console.error("Error fetching posts by business sector:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Alternative method to get all posts with manual user lookup
const getAllPostsWithManualLookup = async (req, res) => {
  try {
    console.log('Fetching all posts with manual lookup...');
    
    const posts = await Post.find({}).sort({ createdAt: -1 });
    console.log('Found posts:', posts.length);
    
    const postsWithUserInfo = await Promise.all(posts.map(async (post) => {
      let userName = 'Unknown User';
      let userEmail = null;
      
      if (post.user) {
        console.log('Looking up user details for:', post.user);
        
        // Try to find personal details using the user ID
        const personalDetails = await PersonalDetails.findOne({ userId: post.user });
        console.log('Personal details found:', personalDetails);
        
        if (personalDetails) {
          userName = personalDetails.Full_Name || 'Unknown User';
          userEmail = personalDetails.Email;
        }
      }

      return {
        ...post.toObject(),
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
        userName: userName,
        userEmail: userEmail
      };
    }));

    console.log('Posts with user info:', postsWithUserInfo.map(p => ({ 
      id: p._id, 
      userName: p.userName,
      userEmail: p.userEmail
    })));

    res.status(200).json(postsWithUserInfo);
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Debug function to check data relationships
const debugDataRelationships = async (req, res) => {
  try {
    console.log('=== DEBUGGING DATA RELATIONSHIPS ===');
    
    // Check posts
    const posts = await Post.find({}).limit(2);
    console.log('Sample posts:', posts.map(p => ({ 
      _id: p._id, 
      user: p.user, 
      userType: typeof p.user 
    })));
    
    // Check users
    const users = await User.find({}).limit(2);
    console.log('Sample users:', users.map(u => ({ 
      _id: u._id, 
      personalDetails: u.personalDetails 
    })));
    
    // Check personal details
    const personalDetails = await PersonalDetails.find({}).limit(2);
    console.log('Sample personal details:', personalDetails.map(pd => ({ 
      _id: pd._id, 
      userId: pd.userId, 
      Full_Name: pd.Full_Name 
    })));
    
    // Try to match a post user with personal details
    if (posts.length > 0 && posts[0].user) {
      const matchingPersonalDetails = await PersonalDetails.findOne({ 
        userId: posts[0].user 
      });
      console.log('Matching personal details for first post:', matchingPersonalDetails);
    }
    
    res.status(200).json({
      message: 'Debug info logged to console',
      postsCount: posts.length,
      usersCount: users.length,
      personalDetailsCount: personalDetails.length
    });
  } catch (err) {
    console.error('Debug error:', err);
    res.status(500).json({ message: 'Debug failed' });
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
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    // Manual user lookup instead of population
    let userName = 'Unknown User';
    if (post.user) {
      const personalDetails = await PersonalDetails.findOne({ userId: post.user });
      if (personalDetails && personalDetails.Full_Name) {
        userName = personalDetails.Full_Name;
      }
    }

    res.status(200).json({
      message: alreadyLiked ? "Unliked" : "Liked",
      post: {
        ...post.toObject(),
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
        userName: userName
      }
    });
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

    post.comments.push({
      text,
      postedBy: userId
    });

    await post.save();

    // Manual user lookup
    let userName = 'Unknown User';
    if (post.user) {
      const personalDetails = await PersonalDetails.findOne({ userId: post.user });
      if (personalDetails && personalDetails.Full_Name) {
        userName = personalDetails.Full_Name;
      }
    }

    res.status(200).json({
      message: "Comment added",
      post: {
        ...post.toObject(),
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
        userName: userName
      }
    });
  } catch (err) {
    console.error("Comment failed", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

module.exports = {
  createPost,
  getPostsByInterest,
  getAllPostsWithManualLookup,
  debugDataRelationships,
  likePost,
  commentOnPost
};