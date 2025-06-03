// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { followUser, unfollowUser, getSuggestedUsers , getUsersWithFollowDetails} = require('../Controllers/follow_unfollowController');
const requireAuth = require('../Middlewares/authMiddleware');

router.put('/F/:followId', requireAuth, followUser);
router.put('/U/:followId', requireAuth, unfollowUser);
router.get('/S', requireAuth, getSuggestedUsers);
router.get('/followers_following', re)
module.exports = router;
