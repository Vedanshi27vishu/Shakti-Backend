const PersonalDetails = require('../models/User/PersonalDetailSignup');
const FinancialDetails = require('../models/User/FinancialDetailSignup');
const BusinessIdeaDetails = require('../models/User/BusinessIdeaSignup');
const SignupDB = require('../models/User/SignupDB');
const tempUsers = require('../tempUserStorage'); // assuming you have this

const signup3User = async (req, res) => {
  try {
    const sessionId = req.body.sessionId;
    const user = tempUsers.get(sessionId);

    if (!user) {
      return res.status(400).json({ message: 'Session expired or invalid. Please restart signup.' });
    }

    // 1. Save Personal Details
    const personal = new PersonalDetails(user.PersonalDetails);
    const savedPersonal = await personal.save();

    // 2. Save Financial Details (properly formatted)
    const financial = new FinancialDetails({
      userId: savedPersonal._id,
      incomeDetails: user.FinancialDetails.incomeDetails,
      assetDetails: user.FinancialDetails.assetDetails,
      existingloanDetails: user.FinancialDetails.existingloanDetails
    });

    const savedFinancial = await financial.save();

    // 3. Save Business Idea
    const business = new BusinessIdeaDetails({
      userId: savedPersonal._id,
      ...req.body // business idea comes from final form
    });

    const savedBusiness = await business.save();

    // 4. (Optional) Save summary
    const signupSummary = new SignupDB({
      userId: savedPersonal._id,
      email: savedPersonal.email,
      status: 'completed'
    });

    await signupSummary.save();

    // Cleanup
    tempUsers.delete(sessionId);

    res.status(201).json({
      message: 'Signup completed successfully.',
      userId: savedPersonal._id
    });

  } catch (err) {
    console.error('Signup3 Error:', err);
    res.status(500).json({ message: 'Signup failed at final step', error: err.message });
  }
};

module.exports = { signup3User };
