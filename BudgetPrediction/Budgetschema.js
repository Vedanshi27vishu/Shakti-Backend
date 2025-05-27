const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  businessType: { type: String, required: true },
  profits: { type: [Number], default: [] },
  // other fields if needed
});

const Budget = mongoose.model('Budget', budgetSchema);
module.exports = Budget;
