// Updated main server file - Replace your existing server code with this

const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');

// Models
const Message = require('./Models/community/messages');
const BusinessDetailSignup = require('./Models/User/BusinessDetailSignup');

// Controllers
const googleauth = require('./Controllers/googleauth');
const scrapeData = require('./Controllers/microinvestments');
const filterLoansRouter = require('./Controllers/filter');
const PrivateschemesRouter = require('./Controllers/private_schemes');
const recentMessagesRoute = require('./Controllers/messageduser');

// Routes
const completeSignupRoute = require('./Routes/complete_signup');
const completeSignupRoute2 = require('./Routes/complete_signup2');
const completeSignupRoute3 = require('./Routes/complete_signup3');
const requireAuth = require('./Middlewares/authMiddleware');
const authRoutes = require('./Routes/authRoutes');
const searchRoutes = require('./Routes/searchRoutes');
const videoRoutes = require('./Routes/videosRoutes');
const pdfRoutes = require('./Routes/pdfsearchbuisness');
const communityRoutes = require('./Routes/communityAuthRoutes');
const indexRoutes = require('./Routes/index');
const getuser = require('./Routes/user');
const budgetRout = require('./BudgetPrediction/futureprediction');
const profit = require('./Routes/percentage');
const taskRoutes = require('./Routes/taskRoutes');
const sixmonths = require('./BudgetPrediction/lastsixmonth');
const financialRoutes = require('./Controllers/getallloans');
const loanspayment = require('./Controllers/monthlyloanpayment');
const lasttwomonthexpands = require('./Controllers/lasttwomonthexpands');
const userprofile = require('./Routes/userProfile');
const shaktidetails = require('./Routes/shaktiProfile');

// New enhanced message routes
const messageRoutes = require('./Routes/chatmessagesv');

// Socket.IO setup
const { Server } = require('socket.io');
const { 
  genericUpload, 
  uploadToCloudinary, 
  deleteFromCloudinary 
} = require('./utils/cloudinary');

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// File upload rate limiting (more strict)
const fileUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20 // limit each IP to 20 file uploads per windowMs
});
app.use('/api/messages/upload/', fileUploadLimiter);

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

const server = http.createServer(app);

// Enhanced Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  maxHttpBufferSize: 100 * 1024 * 1024, // 100MB for file uploads
  pingTimeout: 60000,
  pingInterval: 25000
});

// MongoDB connection with better error handling
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Active users tracking
const activeUsers = new Map();

// Socket authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('No token provided'));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    return next(new Error('Invalid token'));
  }
});

// Enhanced Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.user.userId}`);
  
  // Add user to active users
  activeUsers.set(socket.user.userId, {
    socketId: socket.id,
    lastSeen: new Date(),
    status: 'online'
  });
  
  socket.join(socket.user.userId);
  
  // Broadcast user online status
  socket.broadcast.emit('user-online', {
    userId: socket.user.userId,
    status: 'online'
  });

  // Handle text messages
  socket.on('private-message', async ({ toUserId, message, replyTo }) => {
    if (!toUserId || !message) {
      return socket.emit('error', { message: 'Missing toUserId or message' });
    }

    try {
      const msgData = {
        senderId: socket.user.userId,
        receiverId: toUserId,
        message,
        messageType: 'text',
        delivered: true,
        deliveredAt: new Date()
      };

      if (replyTo) {
        msgData.replyTo = replyTo;
      }

      const msg = await Message.create(msgData);
      await msg.populate('replyTo');

      const messagePayload = {
        _id: msg._id,
        from: socket.user.userId,
        to: toUserId,
        message: msg.message,
        messageType: msg.messageType,
        timestamp: msg.timestamp,
        seen: msg.seen,
        delivered: msg.delivered,
        replyTo: msg.replyTo
      };

      // Send to receiver
      io.to(toUserId).emit('private-message', messagePayload);
      
      // Send back to sender
      socket.emit('private-message', messagePayload);

    } catch (error) {
      console.error('❌ Failed to send private message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle file uploads via socket
  socket.on('upload-file', async ({ toUserId, fileData, fileType, fileName, fileSize, message }) => {
    if (!toUserId || !fileData) {
      return socket.emit('error', { message: 'Missing required file data' });
    }

    try {
      // Convert base64 to buffer
      const buffer = Buffer.from(fileData, 'base64');
      const file = { buffer, originalname: fileName };

      // Determine folder based on file type
      let folder = 'documents';
      let messageType = 'document';
      
      if (fileType.startsWith('image/')) {
        folder = 'images';
        messageType = 'image';
      } else if (fileType.startsWith('audio/')) {
        folder = 'audio';
        messageType = 'audio';
      } else if (fileType.startsWith('video/')) {
        folder = 'videos';
        messageType = 'video';
      }

      // Upload to Cloudinary
      const result = await uploadToCloudinary(file, folder);

      // Create message
      const msg = await Message.create({
        senderId: socket.user.userId,
        receiverId: toUserId,
        message: message || '',
        messageType: messageType,
        fileUrl: result.secure_url,
        fileName: fileName,
        fileSize: fileSize,
        delivered: true,
        deliveredAt: new Date()
      });

      const messagePayload = {
        _id: msg._id,
        from: socket.user.userId,
        to: toUserId,
        message: msg.message,
        messageType: msg.messageType,
        fileUrl: msg.fileUrl,
        fileName: msg.fileName,
        fileSize: msg.fileSize,
        timestamp: msg.timestamp,
        seen: msg.seen,
        delivered: msg.delivered
      };

      // Send to receiver
      io.to(toUserId).emit('file-message', messagePayload);
      
      // Send back to sender
      socket.emit('file-message', messagePayload);

    } catch (error) {
      console.error('❌ Failed to upload file:', error);
      socket.emit('error', { message: 'Failed to upload file' });
    }
  });

  // Handle message seen
  socket.on('message-seen', async ({ messageId, fromUserId }) => {
    try {
      if (messageId) {
        await Message.findByIdAndUpdate(messageId, {
          seen: true,
          seenAt: new Date()
        });
      } else if (fromUserId) {
        await Message.updateMany(
          { senderId: fromUserId, receiverId: socket.user.userId, seen: false },
          { 
            $set: { 
              seen: true,
              seenAt: new Date()
            } 
          }
        );
      }

      io.to(fromUserId).emit('messages-seen', {
        byUserId: socket.user.userId,
        messageId: messageId
      });
    } catch (error) {
      console.error('❌ Failed to update seen status:', error);
    }
  });

  // Handle message editing
  socket.on('edit-message', async ({ messageId, newMessage }) => {
    try {
      const message = await Message.findById(messageId);
      
      if (!message || message.senderId.toString() !== socket.user.userId) {
        return socket.emit('error', { message: 'Cannot edit this message' });
      }

      if (message.messageType !== 'text') {
        return socket.emit('error', { message: 'Can only edit text messages' });
      }

      const originalMessage = message.message;
      message.message = newMessage;
      message.isEdited = true;
      message.editedAt = new Date();
      message.originalMessage = originalMessage;
      
      await message.save();

      const editPayload = {
        messageId: messageId,
        newMessage: newMessage,
        isEdited: true,
        editedAt: message.editedAt
      };

      // Send to receiver
      io.to(message.receiverId).emit('message-edited', editPayload);
      
      // Send back to sender
      socket.emit('message-edited', editPayload);

    } catch (error) {
      console.error('❌ Failed to edit message:', error);
      socket.emit('error', { message: 'Failed to edit message' });
    }
  });

  // Handle message deletion
  socket.on('delete-message', async ({ messageId, deleteFor }) => {
    try {
      const message = await Message.findById(messageId);
      
      if (!message || message.senderId.toString() !== socket.user.userId) {
        return socket.emit('error', { message: 'Cannot delete this message' });
      }

      if (deleteFor === 'everyone') {
        // Delete file from Cloudinary if exists
        if (message.fileUrl) {
          try {
            const publicId = message.fileUrl.split('/').pop().split('.')[0];
            await deleteFromCloudinary(publicId);
          } catch (err) {
            console.error('Failed to delete file from Cloudinary:', err);
          }
        }
        
        message.isDeleted = true;
        message.deletedAt = new Date();
        message.deletedBy = socket.user.userId;
        message.message = 'This message was deleted';
        message.fileUrl = null;
        
        await message.save();

        const deletePayload = {
          messageId: messageId,
          deletedFor: 'everyone'
        };

        // Send to receiver
        io.to(message.receiverId).emit('message-deleted', deletePayload);
        
        // Send back to sender
        socket.emit('message-deleted', deletePayload);
      } else {
        // Delete for self only
        socket.emit('message-deleted', {
          messageId: messageId,
          deletedFor: 'self'
        });
      }

    } catch (error) {
      console.error('❌ Failed to delete message:', error);
      socket.emit('error', { message: 'Failed to delete message' });
    }
  });

  // Handle typing indicators
  socket.on('typing', ({ toUserId }) => {
    io.to(toUserId).emit('typing', {
      fromUserId: socket.user.userId
    });
  });

  socket.on('stop-typing', ({ toUserId }) => {
    io.to(toUserId).emit('stop-typing', {
      fromUserId: socket.user.userId
    });
  });

  // Handle fetching messages with pagination
  socket.on('fetch-messages', async ({ userId, page = 1, limit = 50 }) => {
    try {
      const skip = (page - 1) * limit;
      
      const msgs = await Message.find({
        $or: [
          { senderId: socket.user.userId, receiverId: userId },
          { senderId: userId, receiverId: socket.user.userId }
        ],
        isDeleted: { $ne: true }
      })
      .populate('replyTo')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

      socket.emit('old-messages', {
        messages: msgs.reverse(),
        page: page,
        hasMore: msgs.length === limit
      });
    } catch (error) {
      console.error('❌ Failed to fetch messages:', error);
      socket.emit('error', { message: 'Failed to fetch messages' });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.user.userId}`);
    
    // Update user status
    if (activeUsers.has(socket.user.userId)) {
      activeUsers.get(socket.user.userId).status = 'offline';
      activeUsers.get(socket.user.userId).lastSeen = new Date();
    }
    
    // Broadcast user offline status
    socket.broadcast.emit('user-offline', {
      userId: socket.user.userId,
      lastSeen: new Date()
    });
  });
});

// Routes
app.use('/googleauth', googleauth);
app.use('/complete', completeSignupRoute);
app.use('/complete2', completeSignupRoute2);
app.use('/complete3', completeSignupRoute3);
app.use('/auth', authRoutes);
app.use('/filter-loans', filterLoansRouter);
app.use('/private-schemes', PrivateschemesRouter);
app.use('/search', searchRoutes);
app.use('/videos', videoRoutes);
app.use('/pdfsearch', pdfRoutes);
app.use('/community', communityRoutes);
app.use('/', indexRoutes);
app.use('/user', getuser);
app.use('/api', budgetRout);
app.use('/', profit);
app.use('/tasks', taskRoutes);
app.use('/api/recentmessages', recentMessagesRoute);
app.use('/api', sixmonths);
app.use('/api/financial', financialRoutes);
app.use('/api', loanspayment);
app.use('/api', lasttwomonthexpands);
app.use('/profile', userprofile);
app.use('/shakti', shaktidetails);

// Enhanced message routes
app.use('/api/messages', messageRoutes);

// Scraper API (unchanged)
app.post('/scrape', requireAuth, async (req, res) => {
  try {
    const user = req.userId;
    const business = await BusinessDetailSignup.findOne({ user });

    const location = 'Ghaziabad';
    const targetUrl = `https://www.justdial.com/${location}/Peer-To-Peer-Investment-Service-Providers/nct-11948937?stype=category_list&redirect=301`;

    const data = await scrapeData(targetUrl);

    const response = data.map(item => ({
      name: item.name,
      location: item.location,
      link: item.link,
    }));

    res.json(response);
  } catch (err) {
    console.error('❌ Scraping failed:', err);
    res.status(500).json({ error: 'Scraping failed', details: err.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large' });
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Unexpected file field' });
  }
  
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Export for testing
module.exports = { app, server, io };