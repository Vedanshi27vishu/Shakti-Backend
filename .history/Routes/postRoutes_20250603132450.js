const express = require('express');
const { createPost, getPostsByInterest, likePost, commentOnPost, updateComment } = require('../Controllers/postController');
const requireAuth = require('../Middlewares/authMiddleware');
const router = express.Router();

router.post('/create', requireAuth, createPost);
router.get('/Interestfeed', requireAuth, getPostsByInterest);
router.post('/L/:postId', requireAuth, likePost);
router.post('/C/:postId', requireAuth, commentOnPost);
router.put('/posts/:postId/comments/:commentId', re, updateComment);

module.exports = router;