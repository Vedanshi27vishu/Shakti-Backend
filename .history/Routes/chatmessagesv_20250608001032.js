// Routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const Message = require('../Models/community/messages');
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
    })