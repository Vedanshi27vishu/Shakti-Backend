const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  Lender_Name:         { type: String, required: true },
  Loan_Type:           { type: String, required: true },
  Total_Loan_Amount:   { type: Number, required: true },
  Monthly_Payment:     { type: Number, required: true }
}, { _id: false });

const FinancialDetailsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PersonalDetails',
    required: true
  },
  incomeDetails: {
    Primary_Monthly_Income:     { type: Number, required: true },
    Additional_Monthly_Income:  { type: Number, required: true }
  },
  assetDetails: {
    Gold_Asset_amount:     { type: Number, required: true },
    Gold_Asset_App_Value:  { type: Number, required: true },
    Land_Asset_Area:       { type: Number, required: true },
    Land_Asset_App_Value:  { type: Number, required: true }
  },
  existingloanDetails: {
    type: [loanSchema], // ✅ array of loan documents
    required: true,
    validate: {
      validator: v => Array.isArray(v) && v.length > 0,
      message: 'At least one loan must be provided.'
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('FinancialDetails', FinancialDetailsSchema);
