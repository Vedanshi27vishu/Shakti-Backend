// Routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const Message = require('../Models/community/');
const requireAuth = require('../Middlewares/authMiddleware');
const { 
  imageUpload, 
  documentUpload, 
  audioUpload, 
  videoUpload,
  deleteFromCloudinary 
} = require('../utils/cloudinary');

// Middleware to check message ownership
const checkMessageOwnership = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    if (message.senderId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    req.message = message;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get conversation between two users
router.get('/conversation/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      $or: [
        { senderId: req.userId, receiverId: userId },
        { senderId: userId, receiverId: req.userId }
      ],
      isDeleted: { $ne: true }
    })
    .populate('replyTo', 'message messageType fileUrl fileName')
    .populate('senderId', 'name avatar')
    .populate('receiverId', 'name avatar')
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    res.json({
      messages: messages.reverse(),
      page: parseInt(page),
      hasMore: messages.length === parseInt(limit),
      total: await Message.countDocuments({
        $or: [
          { senderId: req.userId, receiverId: userId },
          { senderId: userId, receiverId: req.userId }
        ],
        isDeleted: { $ne: true }
      })
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Upload image
router.post('/upload/image', requireAuth, imageUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { receiverId, message = '' } = req.body;
    
    const newMessage = await Message.create({
      senderId: req.userId,
      receiverId,
      message,
      messageType: 'image',
      fileUrl: req.file.path,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      delivered: true,
      deliveredAt: new Date()
    });

    await newMessage.populate('senderId', 'name avatar');
    
    res.status(201).json({
      success: true,
      message: newMessage
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Upload document
router.post('/upload/document', requireAuth, documentUpload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document file provided' });
    }

    const { receiverId, message = '' } = req.body;
    
    const newMessage = await Message.create({
      senderId: req.userId,
      receiverId,
      message,
      messageType: 'document',
      fileUrl: req.file.path,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      delivered: true,
      deliveredAt: new Date()
    });

    await newMessage.populate('senderId', 'name avatar');
    
    res.status(201).json({
      success: true,
      message: newMessage
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Upload audio
router.post('/upload/audio', requireAuth, audioUpload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { receiverId, message = '' } = req.body;
    
    const newMessage = await Message.create({
      senderId: req.userId,
      receiverId,
      message,
      messageType: 'audio',
      fileUrl: req.file.path,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      delivered: true,
      deliveredAt: new Date()
    });

    await newMessage.populate('senderId', 'name avatar');
    
    res.status(201).json({
      success: true,
      message: newMessage
    });
  } catch (error) {
    console.error('Error uploading audio:', error);
    res.status(500).json({ error: 'Failed to upload audio' });
  }
});

// Upload video
router.post('/upload/video', requireAuth, videoUpload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const { receiverId, message = '' } = req.body;
    
    const newMessage = await Message.create({
      senderId: req.userId,
      receiverId,
      message,
      messageType: 'video',
      fileUrl: req.file.path,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      delivered: true,
      deliveredAt: new Date()
    });

    await newMessage.populate('senderId', 'name avatar');
    
    res.status(201).json({
      success: true,
      message: newMessage
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// Edit message
router.put('/edit/:messageId', requireAuth, checkMessageOwnership, async (req, res) => {
  try {
    const { newMessage } = req.body;
    
    if (req.message.messageType !== 'text') {
      return res.status(400).json({ error: 'Can only edit text messages' });
    }

    const originalMessage = req.message.message;
    req.message.message = newMessage;
    req.message.isEdited = true;
    req.message.editedAt = new Date();
    req.message.originalMessage = originalMessage;
    
    await req.message.save();
    
    res.json({
      success: true,
      message: req.message
    });
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ error: 'Failed to edit message' });
  }
});

// Delete message
router.delete('/delete/:messageId', requireAuth, checkMessageOwnership, async (req, res) => {
  try {
    const { deleteFor = 'self' } = req.body;
    
    if (deleteFor === 'everyone') {
      // Delete file from Cloudinary if exists
      if (req.message.fileUrl) {
        try {
          const publicId = req.message.fileUrl.split('/').pop().split('.')[0];
          await deleteFromCloudinary(publicId);
        } catch (err) {
          console.error('Failed to delete file from Cloudinary:', err);
        }
      }
      
      req.message.isDeleted = true;
      req.message.deletedAt = new Date();
      req.message.deletedBy = req.userId;
      req.message.message = 'This message was deleted';
      req.message.fileUrl = null;
      
      await req.message.save();
    }
    
    res.json({
      success: true,
      deletedFor: deleteFor,
      messageId: req.message._id
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Add reaction to message
router.post('/react/:messageId', requireAuth, async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Remove existing reaction from same user
    message.reactions = message.reactions.filter(
      reaction => reaction.userId.toString() !== req.userId
    );

    // Add new reaction
    message.reactions.push({
      userId: req.userId,
      emoji: emoji,
      timestamp: new Date()
    });

    await message.save();
    
    res.json({
      success: true,
      reaction: {
        userId: req.userId,
        emoji: emoji,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// Remove reaction from message
router.delete('/react/:messageId', requireAuth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Remove reaction from user
    message.reactions = message.reactions.filter(
      reaction => reaction.userId.toString() !== req.userId
    );

    await message.save();
    
    res.json({
      success: true,
      message: 'Reaction removed'
    });
  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(500).json({ error: 'Failed to remove reaction' });
  }
});

// Mark messages as seen
router.put('/seen/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    await Message.updateMany(
      { 
        senderId: userId, 
        receiverId: req.userId, 
        seen: false 
      },
      { 
        $set: { 
          seen: true,
          seenAt: new Date()
        } 
      }
    );
    
    res.json({
      success: true,
      message: 'Messages marked as seen'
    });
  } catch (error) {
    console.error('Error marking messages as seen:', error);
    res.status(500).json({ error: 'Failed to mark messages as seen' });
  }
});

// Get unread message count
router.get('/unread/count', requireAuth, async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({
      receiverId: req.userId,
      seen: false,
      isDeleted: { $ne: true }
    });
    
    res.json({ unreadCount });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Get recent conversations
router.get('/conversations/recent', requireAuth, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: new mongoose.Types.ObjectId(req.userId) },
            { receiverId: new mongoose.Types.ObjectId(req.userId) }
          ],
          isDeleted: { $ne: true }
        }
      },
      {
        $addFields: {
          otherUser: {
            $cond: {
              if: { $eq: ['$senderId', new mongoose.Types.ObjectId(req.userId)] },
              then: '$receiverId',
              else: '$senderId'
            }
          }
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: '$otherUser',
          lastMessage: { $first: '$ROOT' },
          unreadCount: {
            $sum: {
              $cond: {
                if: {
                  $and: [
                    { $eq: ['$receiverId', new mongoose.Types.ObjectId(req.userId)] },
                    { $eq: ['$seen', false] }
                  ]
                },
                then: 1,
                else: 0
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $project: {
          _id: 1,
          lastMessage: 1,
          unreadCount: 1,
          userInfo: {
            name: 1,
            avatar: 1,
            email: 1
          }
        }
      },
      {
        $sort: { 'lastMessage.timestamp': -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);
    
    res.json({ conversations });
  } catch (error) {
    console.error('Error getting recent conversations:', error);
    res.status(500).json({ error: 'Failed to get recent conversations' });
  }
});

// Search messages
router.get('/search', requireAuth, async (req, res) => {
  try {
    const { query, userId, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const searchConditions = {
      $or: [
        { senderId: req.userId },
        { receiverId: req.userId }
      ],
      message: { $regex: query, $options: 'i' },
      isDeleted: { $ne: true }
    };
    
    if (userId) {
      searchConditions.$or = [
        { senderId: req.userId, receiverId: userId },
        { senderId: userId, receiverId: req.userId }
      ];
    }
    
    const messages = await Message.find(searchConditions)
      .populate('senderId', 'name avatar')
      .populate('receiverId', 'name avatar')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Message.countDocuments(searchConditions);
    
    res.json({
      messages,
      page: parseInt(page),
      hasMore: messages.length === parseInt(limit),
      total
    });
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({ error: 'Failed to search messages' });
  }
});

// Forward message
router.post('/forward/:messageId', requireAuth, async (req, res) => {
  try {
    const { receiverIds } = req.body; // Array of user IDs to forward to
    const originalMessage = await Message.findById(req.params.messageId);
    
    if (!originalMessage) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    const forwardedMessages = [];
    
    for (const receiverId of receiverIds) {
      const forwardedMessage = await Message.create({
        senderId: req.userId,
        receiverId: receiverId,
        message: originalMessage.message,
        messageType: originalMessage.messageType,
        fileUrl: originalMessage.fileUrl,
        fileName: originalMessage.fileName,
        fileSize: originalMessage.fileSize,
        forwardedFrom: originalMessage._id,
        delivered: true,
        deliveredAt: new Date()
      });
      
      await forwardedMessage.populate('senderId', 'name avatar');
      forwardedMessages.push(forwardedMessage);
    }
    
    res.json({
      success: true,
      forwardedMessages
    });
  } catch (error) {
    console.error('Error forwarding message:', error);
    res.status(500).json({ error: 'Failed to forward message' });
  }
});

// Get message delivery status
router.get('/status/:messageId', requireAuth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId)
      .select('delivered deliveredAt seen seenAt');
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json({
      delivered: message.delivered,
      deliveredAt: message.deliveredAt,
      seen: message.seen,
      seenAt: message.seenAt
    });
  } catch (error) {
    console.error('Error getting message status:', error);
    res.status(500).json({ error: 'Failed to get message status' });
  }
});

module.exports = router;