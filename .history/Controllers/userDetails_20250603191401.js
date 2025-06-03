const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const authenticateJWT = require('../Middlewares/authMiddleware');

// Models
const PersonalDetails = require('../Models/User/PersonalDetailSignup');
const BusinessIdeaDetails = require('../Models/User/BusinessDetailSignup');
const FinancialDetail= require('../Models/User/FinancialDetailSignup');

router.get('/shaktidetails', authenticateJWT , async (req, res)=>{
try{
  const userId= req.userId;

     // 1. Personal Info
     const user = await PersonalDetails.findById(userId);
     if (!user) return res.status(404).json({ error: 'User not found' });

     // 2. Business Info
    const business = await BusinessIdeaDetails.findOne({ userId });

    // 3. Financial Info
    const financial = await FinancialDetail.findOne({ userId });
}
})