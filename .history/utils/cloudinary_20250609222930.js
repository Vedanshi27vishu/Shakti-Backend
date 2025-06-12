// utils/cloudinary.js
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage configuration for different file types
const createStorage = (folder, allowedFormats) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `chat-app/${folder}`,
      allowed_formats: allowedFormats,
      resource_type: 'auto',
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    },
  });
};

// Different storages for different file types
const imageStorage = createStorage('images', ['jpg', 'jpeg', 'png', 'gif', 'webp']);
const documentStorage = createStorage('documents', ['pdf', 'doc', 'docx', 'txt', 'rtf']);
const audioStorage = createStorage('audio', ['mp3', 'wav', 'ogg', 'm4a']);
const videoStorage = createStorage('videos', ['mp4', 'avi', 'mov', 'wmv', 'flv']);

// File size limits (in bytes)
const fileLimits = {
  image: 10 * 1024 * 1024, // 10MB
  document: 50 * 1024 * 1024, // 50MB
  audio: 25 * 1024 * 1024, // 25MB
  video: 100 * 1024 * 1024, // 100MB
};

// Multer configurations
const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: fileLimits.image },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

const documentUpload = multer({
  storage: documentStorage,
  limits: { fileSize: fileLimits.document },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                         'text/plain', 'application/rtf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only document files are allowed!'), false);
    }
  }
});

const audioUpload = multer({
  storage: audioStorage,
  limits: { fileSize: fileLimits.audio },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'), false);
    }
  }
});

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: fileLimits.video },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  }
});

// Generic upload function
const genericUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: fileLimits.document },
});

// Upload to Cloudinary function
const uploadToCloudinary = async (file, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `chat-app/${folder}`,
        resource_type: 'auto',
        quality: 'auto',
        fetch_format: 'auto'
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(file.buffer);
  });
};

// Delete from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  imageUpload,
  documentUpload,
  audioUpload,
  videoUpload,
  genericUpload,
  uploadToCloudinary,
  deleteFromCloudinary,
  fileLimits
};
