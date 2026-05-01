const express = require('express');
const axios = require('axios'); 
const Redis = require('ioredis');
const router = express.Router();
const requireAuth = require('../Middlewares/authMiddleware');
const BuisnessIdeaDeatails = require('../Models/User/BusinessDetailSignup');
const PersonalDetails = require('../Models/User/PersonalDetailSignup');
const FinancialDetails = require('../Models/User/FinancialDetailSignup');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY5;
const SERP_API_KEY = process.env.GOOGLE_API_KEY;
// const redis = new Redis({
//   host: '172.17.0.1',
//   port: 6379
// });
let redis;
if (process.env.REDIS_URL) {
  // Production: Render provides REDIS_URL
  redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    retryStrategy(times) {
      if (times > 3) {
        console.warn('⚠️ Redis connection failed, continuing without cache');
        return null;
      }
      return Math.min(times * 100, 2000);
    }
  });
}
else {
  
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) {
        console.warn('⚠️ Redis connection failed, continuing without cache');
        return null;
      }
      return Math.min(times * 100, 2000);
    }
  });
}

redis.on('error', (err) => {
  console.warn('⚠️ Redis error:', err.message);
});

redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});
// END OF REPLACEMENT
router.post('/', requireAuth, async (req, res) => {
  const userID = req.userId;
  const cacheKey = `loan-schemes:${userID}`;

  try {
    // Check if cached data exists
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.status(200).json(JSON.parse(cached));
      }
    } catch (cacheErr) {
      console.warn('⚠️ Redis read failed:', cacheErr.message);
    }

    // Fetch user data
    const Business = await BuisnessIdeaDeatails.findOne({ userId: userID });
    const personal = await PersonalDetails.findById(userID);
    const financial = await FinancialDetails.findOne({ userId: userID });
    const totalAssets = financial?.assetDetails?.Gold_Asset_App_Value + financial?.assetDetails?.Land_Asset_App_Value;

    const state = Business?.ideaDetails?.Business_Location?.toLowerCase() || 'state';

    const prompt = `
You are a helpful assistant that recommends Indian Government loan schemes.

**Guidelines:**
- Only suggest **official government loan schemes** hosted on domains like '.gov.in', '.nic.in', and also '${state}.gov.in'.
- Response must be in **strictly valid JSON format** — no markdown, no explanations, no triple backticks.
- Do not include any text or headings outside the JSON array.
- All fields must be enclosed in double quotes.
- Eligibility should be returned as an **array of bullet points** (string items).
- Include 7 to 10 relevant loan schemes based on the user profile firstly central government schemes and then state 

**User Details:**
- Gender: ${personal?.personalDetails?.gender || 'male'}
- Business Type: ${Business?.ideaDetails?.Business_Sector || 'not specified'}
- Location: ${Business?.ideaDetails?.Business_Location || 'not specified'}
- Age: ${personal?.personalDetails?.age || 'not specified'}
- Education: ${personal?.professionalDetails?.Educational_Qualifications || 'not specified'}
- State: ${Business?.ideaDetails?.Business_Location || 'not specified'}
- Total Assets value: ${totalAssets || 'not specified'}
- Require_Loan: ${Business?.financialPlan?.Estimated_Startup_Cost || 'not specified'}
- Previous loan history: ${financial?.existingloanDetails?.reduce((s, l) => s + (l.Total_Loan_Amount || 0), 0) || 'not specified'}

**Return Format:**
[
  {
    "name": "Loan Scheme Name",
    "description": "Brief description of the loan scheme.",
    "eligibility": [
      "Eligibility point 1",
      "Eligibility point 2",
      "Eligibility point 3"
    ],
    "link": "https://example.gov.in"
  }
]
`.trim();

    // Step 1: Call Gemini API
    let schemes;
    try {
      const geminiResponse = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        { contents: [{ parts: [{ text: prompt }] }] },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const replyText = geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!replyText) throw new Error('No valid response from Gemini');

      let cleanedText = replyText.replace(/```json|```/g, '').trim();
      cleanedText = cleanedText.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
      schemes = JSON.parse(cleanedText);
    } catch (err) {
      console.warn('⚠️ Gemini failed, using dummy data:', err.message);
      schemes = [
        { name: "PM Mudra Yojana", description: "Loans up to ₹10 lakh for small/micro enterprises.", eligibility: ["Indian citizen", "Non-corporate small business", "Non-farm income generating activities"], link: "https://www.mudra.org.in" },
        { name: "Stand-Up India", description: "Bank loans between ₹10 lakh and ₹1 crore for SC/ST and women entrepreneurs.", eligibility: ["SC/ST or women entrepreneur", "Greenfield enterprise", "Non-farm sector"], link: "https://www.standupmitra.in" },
        { name: "PM SVANidhi", description: "Working capital loan for street vendors.", eligibility: ["Street vendor", "Vending certificate required"], link: "https://pmsvanidhi.mohua.gov.in" },
        { name: "CGTMSE", description: "Collateral-free credit for micro and small enterprises.", eligibility: ["Existing or new MSE", "Loan up to ₹2 crore"], link: "https://www.cgtmse.in" },
        { name: "PMEGP", description: "Subsidy-linked loan for new micro enterprises.", eligibility: ["Age above 18", "Minimum 8th pass for projects above ₹10 lakh"], link: "https://www.kviconline.gov.in/pmegpeportal" }
      ];
    }

    // Step 2: Verify links using SerpAPI
    const updatedSchemes = await Promise.all(schemes.map(async scheme => {
      const query = `${scheme.name} site:.gov.in OR site:.nic.in`;
      try {
        const serpResponse = await axios.get('https://serpapi.com/search', {
          params: {
            engine: 'google',
            q: query,
            api_key: SERP_API_KEY
          }
        });

        const firstGovLink = serpResponse.data.organic_results?.find(result =>
          result.link.includes('.gov.in') || result.link.includes('.nic.in')
        )?.link;

        return {
          ...scheme,
          link: firstGovLink || scheme.link
        };
      } catch (err) {
        console.error(`Error verifying link for ${scheme.name}:`, err.response?.data || err.message);
        return scheme;
      }
    }));

    const finalResponse = { recommendedLoans: updatedSchemes };

    // Step 3: Cache result in Redis for 24 hours (86400 seconds)
    try {
      await redis.set(cacheKey, JSON.stringify(finalResponse), 'EX', 86400);
    } catch (cacheErr) {
      console.warn('⚠️ Redis write failed:', cacheErr.message);
    }

    res.json(finalResponse);

  } catch (err) {
    console.error("Error processing request:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to get loan schemes" });
  }
});

module.exports = router;
