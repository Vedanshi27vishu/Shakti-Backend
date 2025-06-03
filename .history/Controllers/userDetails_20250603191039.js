const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const authenticateJWT = require('../Middlewares/authMiddleware');

// Models
const PersonalDetails = require('../Models/User/PersonalDetailSignup');
const BusinessIdeaDetails = require('../Models/User/BusinessDetailSignup');
const Post = require('../Models/PostSchema');
const Follow = require('../Models/followers'); 