const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  Lender_Name: { type: String, required: true },
  Loan_Type: { type: String, required: true },
  Total_Loan_Amount: { type: Number, required: true },
  Monthly_Payment: { type: Number, required: true }
});

const financialDetailSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PersonalDetails',
    required: true
  },
  incomeDetails: {
    Primary_Monthly_Income: { type: Number, required: true },
    Additional_Monthly_Income: { type: Number, required: true }
  },
  assetDetails: {
    Gold_Asset_amount: { type: Number, required: true },
    Gold_Asset_App_Value: { type: Number, required: true },
    Land_Asset_Area: { type: Number, required: true },
    Land_Asset_App_Value: { type: Number, required: true }
  },
  existingloanDetails: [loanSchema]  // ✅ define as an array of objects
});

module.exports = mongoose.model('FinancialDetails', financialDetailSchema);
