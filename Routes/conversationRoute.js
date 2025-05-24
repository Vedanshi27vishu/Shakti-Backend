const express= require('express');
const { startConversation, sendMessage,getMyConversations } = require('../Controllers/conversation');
const requireAuth = require('../Middlewares/authMiddleware');
const upload = require('../Middlewares/cloudinaryStorage');
const router= express.Router();

router.post('/start', requireAuth ,startConversation);
router.post('/send', requireAuth,sendMessage);
router.get('/convo',requireAuth, getMyConversations);
router.post('/senddoc', requireAuth, upload.single('file'), sendMessage);

module.exports = router;




