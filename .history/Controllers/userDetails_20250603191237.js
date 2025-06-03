const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const authenticateJWT = require('../Middlewares/authMiddleware');

// Models
const PersonalDetails = require('../Models/User/PersonalDetailSignup');
const BusinessIdeaDetails = require('../Models/User/BusinessDetailSignup');
const FinancialDetail= require('../Models/User/FinancialDetailSignup');

router.get('/shaktidetails', authenticateJWT , async (req, res)=>{

})