const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const authenticateJWT = require('../Middlewares/authMiddleware');

// Models
const PersonalDetails = require('../Models/User/PersonalDetailSignup');
const BusinessIdeaDetails = require('../Models/User/BusinessDetailSignup');
const FinancialDetail = require('../Models/User/FinancialDetailSignup');

// GET user details (existing route)
router.get('/shaktidetails', authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    
    // 1. Personal Info
    const user = await PersonalDetails.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // 2. Business Info
    const business = await BusinessIdeaDetails.findOne({ userId });
    
    // 3. Financial Info
    const financial = await FinancialDetail.findOne({ userId });
    
    const response = {
      name: user.personalDetails.Full_Name,
      email: user.personalDetails.Email,
      business: business,
      financial: financial
    };
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});



// ========== BUSINESS IDEA DETAILS UPDATES ==========

// Update Business Name
router.put('/update-business-name', authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { businessName } = req.body;
    
    if (!businessName) {
      return res.status(400).json({ error: 'Business name is required' });
    }
    
    const business = await BusinessIdeaDetails.findOne({ userId });
    if (!business) return res.status(404).json({ error: 'Business details not found' });
    
    business.ideaDetails.Business_Name = businessName;
    business.updatedAt = new Date();
    await business.save();
    
    res.json({ message: 'Business name updated successfully', businessName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update business name' });
  }
});

// Update Business Sector
router.put('/update-business-sector', authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { businessSector } = req.body;
    
    if (!businessSector) {
      return res.status(400).json({ error: 'Business sector is required' });
    }
    
    const business = await BusinessIdeaDetails.findOne({ userId });
    if (!business) return res.status(404).json({ error: 'Business details not found' });
    
    business.ideaDetails.Business_Sector = businessSector;
    business.updatedAt = new Date();
    await business.save();
    
    res.json({ message: 'Business sector updated successfully', businessSector });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update business sector' });
  }
});

// Update Business City - FIXED TO MATCH SCHEMA
router.put('/update-business-city', authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { businessCity } = req.body;
    
    if (!businessCity) {
      return res.status(400).json({ error: 'Business city is required' });
    }
    
    const business = await BusinessIdeaDetails.findOne({ userId });
    if (!business) return res.status(404).json({ error: 'Business details not found' });
    
    // IMPORTANT: Using the misspelled field name as per your database schema
    business.ideaDetails.Buisness_City = businessCity;
    business.updatedAt = new Date();
    await business.save();
    
    res.json({ message: 'Business city updated successfully', businessCity });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update business city' });
  }
});

// Update Business Location - FIXED TO MATCH SCHEMA
router.put('/update-business-location', authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { businessLocation } = req.body;
    
    if (!businessLocation) {
      return res.status(400).json({ error: 'Business location is required' });
    }
    
    const business = await BusinessIdeaDetails.findOne({ userId });
    if (!business) return res.status(404).json({ error: 'Business details not found' });
    
    // IMPORTANT: Using the misspelled field name as per your database schema
    business.ideaDetails.Buisness_Location = businessLocation;
    business.updatedAt = new Date();
    await business.save();
    
    res.json({ message: 'Business location updated successfully', businessLocation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update business location' });
  }
});

// Update Idea Description
router.put('/update-idea-description', authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { ideaDescription } = req.body;
    
    if (!ideaDescription) {
      return res.status(400).json({ error: 'Idea description is required' });
    }
    
    const business = await BusinessIdeaDetails.findOne({ userId });
    if (!business) return res.status(404).json({ error: 'Business details not found' });
    
    business.ideaDetails.Idea_Description = ideaDescription;
    business.updatedAt = new Date();
    await business.save();
    
    res.json({ message: 'Idea description updated successfully', ideaDescription });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update idea description' });
  }
});

// Update Target Market
router.put('/update-target-market', authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { targetMarket } = req.body;
    
    if (!targetMarket) {
      return res.status(400).json({ error: 'Target market is required' });
    }
    
    const business = await BusinessIdeaDetails.findOne({ userId });
    if (!business) return res.status(404).json({ error: 'Business details not found' });
    
    business.ideaDetails.Target_Market = targetMarket;
    business.updatedAt = new Date();
    await business.save();
    
    res.json({ message: 'Target market updated successfully', targetMarket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update target market' });
  }
});

// Update USP
router.put('/update-usp', authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { usp } = req.body;
    
    if (!usp) {
      return res.status(400).json({ error: 'USP is required' });
    }
    
    const business = await BusinessIdeaDetails.findOne({ userId });
    if (!business) return res.status(404).json({ error: 'Business details not found' });
    
    business.ideaDetails.Unique_Selling_Proposition = usp;
    business.updatedAt = new Date();
    await business.save();
    
    res.json({ message: 'USP updated successfully', usp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update USP' });
  }
});

// ========== FINANCIAL PLAN UPDATES ==========

// Update Startup Cost
router.put('/update-startup-cost', authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { startupCost } = req.body;
    
    if (startupCost === undefined || startupCost === null) {
      return res.status(400).json({ error: 'Startup cost is required' });
    }
    
    const business = await BusinessIdeaDetails.findOne({ userId });
    if (!business) return res.status(404).json({ error: 'Business details not found' });
    
    business.financialPlan.Estimated_Startup_Cost = startupCost;
    business.updatedAt = new Date();
    await business.save();
    
    res.json({ message: 'Startup cost updated successfully', startupCost });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update startup cost' });
  }
});

// Update Funding Required
router.put('/update-funding-required', authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { fundingRequired } = req.body;
    
    if (fundingRequired === undefined || fundingRequired === null) {
      return res.status(400).json({ error: 'Funding required is required' });
    }
    
    const business = await BusinessIdeaDetails.findOne({ userId });
    if (!business) return res.status(404).json({ error: 'Business details not found' });
    
    business.financialPlan.Funding_Required = fundingRequired;
    business.updatedAt = new Date();
    await business.save();
    
    res.json({ message: 'Funding required updated successfully', fundingRequired });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update funding required' });
  }
});

// Update Expected Revenue
router.put('/update-expected-revenue', authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { expectedRevenue } = req.body;
    
    if (expectedRevenue === undefined || expectedRevenue === null) {
      return res.status(400).json({ error: 'Expected revenue is required' });
    }
    
    const business = await BusinessIdeaDetails.findOne({ userId });
    if (!business) return res.status(404).json({ error: 'Business details not found' });
    
    business.financialPlan.Expected_Revenue_First_Year = expectedRevenue;
    business.updatedAt = new Date();
    await business.save();
    
    res.json({ message: 'Expected revenue updated successfully', expectedRevenue });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update expected revenue' });
  }
});

// ========== OPERATIONAL PLAN UPDATES ==========

// Update Team Size
router.put('/update-team-size', authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { teamSize } = req.body;
    
    if (teamSize === undefined || teamSize === null) {
      return res.status(400).json({ error: 'Team size is required' });
    }
    
    const business = await BusinessIdeaDetails.findOne({ userId });
    if (!business) return res.status(404).json({ error: 'Business details not found' });
    
    business.operationalPlan.Team_Size = teamSize;
    business.updatedAt = new Date();
    await business.save();
    
    res.json({ message: 'Team size updated successfully', teamSize });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update team size' });
  }
});

// Update Resources Required
router.put('/update-resources-required', authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { resourcesRequired } = req.body;
    
    if (!resourcesRequired) {
      return res.status(400).json({ error: 'Resources required is required' });
    }
    
    const business = await BusinessIdeaDetails.findOne({ userId });
    if (!business) return res.status(404).json({ error: 'Business details not found' });
    
    business.operationalPlan.Resources_Required = resourcesRequired;
    business.updatedAt = new Date();
    await business.save();
    
    res.json({ message: 'Resources required updated successfully', resourcesRequired });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update resources required' });
  }
});

// Update Timeline to Launch
router.put('/update-timeline-launch', authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { timelineLaunch } = req.body;
    
    if (!timelineLaunch) {
      return res.status(400).json({ error: 'Timeline to launch is required' });
    }
    
    const business = await BusinessIdeaDetails.findOne({ userId });
    if (!business) return res.status(404).json({ error: 'Business details not found' });
    
    business.operationalPlan.Timeline_To_Launch = timelineLaunch;
    business.updatedAt = new Date();
    await business.save();
    
    res.json({ message: 'Timeline to launch updated successfully', timelineLaunch });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update timeline to launch' });
  }
});

// ========== INCOME DETAILS UPDATES ==========

// Update Primary Income
router.put('/update-primary-income', authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { primaryIncome } = req.body;
    
    if (primaryIncome === undefined || primaryIncome === null) {
      return res.status(400).json({ error: 'Primary income is required' });
    }
    
    const financial = await FinancialDetail.findOne({ userId });
    if (!financial) return res.status(404).json({ error: 'Financial details not found' });
    
    financial.incomeDetails.Primary_Monthly_Income = primaryIncome;
    financial.updatedAt = new Date();
    await financial.save();
    
    res.json({ message: 'Primary income updated successfully', primaryIncome });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update primary income' });
  }
});

// Update Additional Income
router.put('/update-additional-income', authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { additionalIncome } = req.body;
    
    if (additionalIncome === undefined || additionalIncome === null) {
      return res.status(400).json({ error: 'Additional income is required' });
    }
    
    const financial = await FinancialDetail.findOne({ userId });
    if (!financial) return res.status(404).json({ error: 'Financial details not found' });
    
    financial.incomeDetails.Additional_Monthly_Income = additionalIncome;
    financial.updatedAt = new Date();
    await financial.save();
    
    res.json({ message: 'Additional income updated successfully', additionalIncome });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update additional income' });
  }
});

// ========== ASSET DETAILS UPDATES ==========

// Update Gold Asset Amount
router.put('/update-gold-amount', authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { goldAmount } = req.body;
    
    if (goldAmount === undefined || goldAmount === null) {
      return res.status(400).json({ error: 'Gold amount is required' });
    }
    
    const financial = await FinancialDetail.findOne({ userId });
    if (!financial) return res.status(404).json({ error: 'Financial details not found' });
    
    financial.assetDetails.Gold_Asset_amount = goldAmount;
    financial.updatedAt = new Date();
    await financial.save();
    
    res.json({ message: 'Gold asset amount updated successfully', goldAmount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update gold asset amount' });
  }
});

// Update Gold Asset Value
router.put('/update-gold-value', authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { goldValue } = req.body;
    
    if (goldValue === undefined || goldValue === null) {
      return res.status(400).json({ error: 'Gold value is required' });
    }
    
    const financial = await FinancialDetail.findOne({ userId });
    if (!financial) return res.status(404).json({ error: 'Financial details not found' });
    
    financial.assetDetails.Gold_Asset_App_Value = goldValue;
    financial.updatedAt = new Date();
    await financial.save();
    
    res.json({ message: 'Gold asset value updated successfully', goldValue });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update gold asset value' });
  }
});

// Update Land Asset Area
router.put('/update-land-area', authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { landArea } = req.body;
    
    if (landArea === undefined || landArea === null) {
      return res.status(400).json({ error: 'Land area is required' });
    }
    
    const financial = await FinancialDetail.findOne({ userId });
    if (!financial) return res.status(404).json({ error: 'Financial details not found' });
    
    financial.assetDetails.Land_Asset_Area = landArea;
    financial.updatedAt = new Date();
    await financial.save();
    
    res.json({ message: 'Land asset area updated successfully', landArea });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update land asset area' });
  }
});

// Update Land Asset Value
router.put('/update-land-value', authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { landValue } = req.body;
    
    if (landValue === undefined || landValue === null) {
      return res.status(400).json({ error: 'Land value is required' });
    }
    
    const financial = await FinancialDetail.findOne({ userId });
    if (!financial) return res.status(404).json({ error: 'Financial details not found' });
    
    financial.assetDetails.Land_Asset_App_Value = landValue;
    financial.updatedAt = new Date();
    await financial.save();
    
    res.json({ message: 'Land asset value updated successfully', landValue });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update land asset value' });
  }
});

// ========== LOAN UPDATES ==========

// Update Loan Monthly Payment
router.put('/update-loan-payment/:loanId', authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { loanId } = req.params;
    const { monthlyPayment } = req.body;
    
    if (monthlyPayment === undefined || monthlyPayment === null) {
      return res.status(400).json({ error: 'Monthly payment is required' });
    }
    
    const financial = await FinancialDetail.findOne({ userId });
    if (!financial) return res.status(404).json({ error: 'Financial details not found' });
    
    const loan = financial.existingloanDetails.id(loanId);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    
    loan.Monthly_Payment = monthlyPayment;
    financial.updatedAt = new Date();
    await financial.save();
    
    res.json({ message: 'Loan monthly payment updated successfully', monthlyPayment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update loan monthly payment' });
  }
});

// Update Loan Lender Name
router.put('/update-lender-name/:loanId', authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { loanId } = req.params;
    const { lenderName } = req.body;
    
    if (!lenderName) {
      return res.status(400).json({ error: 'Lender name is required' });
    }
    
    const financial = await FinancialDetail.findOne({ userId });
    if (!financial) return res.status(404).json({ error: 'Financial details not found' });
    
    const loan = financial.existingloanDetails.id(loanId);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    
    loan.Lender_Name = lenderName;
    financial.updatedAt = new Date();
    await financial.save();
    
    res.json({ message: 'Lender name updated successfully', lenderName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update lender name' });
  }
});

// Update Loan Type
router.put('/update-loan-type/:loanId', authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { loanId } = req.params;
    const { loanType } = req.body;
    
    if (!loanType) {
      return res.status(400).json({ error: 'Loan type is required' });
    }
    
    const financial = await FinancialDetail.findOne({ userId });
    if (!financial) return res.status(404).json({ error: 'Financial details not found' });
    
    const loan = financial.existingloanDetails.id(loanId);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    
    loan.Loan_Type = loanType;
    financial.updatedAt = new Date();
    await financial.save();
    
    res.json({ message: 'Loan type updated successfully', loanType });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update loan type' });
  }
});

// Update Total Loan Amount
router.put('/update-loan-amount/:loanId', authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { loanId } = req.params;
    const { totalAmount } = req.body;
    
    if (totalAmount === undefined || totalAmount === null) {
      return res.status(400).json({ error: 'Total amount is required' });
    }
    
    const financial = await FinancialDetail.findOne({ userId });
    if (!financial) return res.status(404).json({ error: 'Financial details not found' });
    
    const loan = financial.existingloanDetails.id(loanId);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    
    loan.Total_Loan_Amount = totalAmount;
    financial.updatedAt = new Date();
    await financial.save();
    
    res.json({ message: 'Total loan amount updated successfully', totalAmount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update total loan amount' });
  }
});

// Add new loan
router.post('/add-loan', authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const loanData = req.body;
    
    if (!loanData.Loan_Type || !loanData.Total_Loan_Amount || !loanData.Monthly_Payment) {
      return res.status(400).json({ error: 'Loan_Type, Total_Loan_Amount, and Monthly_Payment are required' });
    }
    
    let financial = await FinancialDetail.findOne({ userId });
    if (!financial) {
      // Create new financial record if it doesn't exist
      financial = new FinancialDetail({
        userId,
        existingloanDetails: [loanData],
        updatedAt: new Date()
      });
    } else {
      // Add new loan to existing loans array
      if (!financial.existingloanDetails) {
        financial.existingloanDetails = [];
      }
      financial.existingloanDetails.push(loanData);
      financial.updatedAt = new Date();
    }
    
    await financial.save();
    res.json({ message: 'Loan added successfully', financial });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add loan' });
  }
});

// Delete loan
router.delete('/delete-loan/:loanId', authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { loanId } = req.params;
    
    const financial = await FinancialDetail.findOne({ userId });
    if (!financial) return res.status(404).json({ error: 'Financial details not found' });
    
    const loan = financial.existingloanDetails.id(loanId);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    
    loan.deleteOne();
    financial.updatedAt = new Date();
    await financial.save();
    
    res.json({ message: 'Loan deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete loan' });
  }
});

module.exports = router;