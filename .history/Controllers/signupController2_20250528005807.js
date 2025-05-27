const tempUsers = require('../tempUserStore');

const signup2User = async (req, res) => {
  try {
    const { sessionId, incomeDetails, assetDetails, existingloanDetails } = req.body;

    // Validate sessionId
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    // Validate incomeDetails
    if (
      !incomeDetails ||
      incomeDetails.Primary_Monthly_Income === undefined ||
      incomeDetails.Additional_Monthly_Income === undefined
    ) {
      return res.status(400).json({ message: 'Income details are required and must be complete' });
    }

    // Validate assetDetails
    if (
      !assetDetails ||
      assetDetails.Gold_Asset_amount === undefined ||
      assetDetails.Gold_Asset_App_Value === undefined ||
      assetDetails.Land_Asset_Area === undefined ||
      assetDetails.Land_Asset_App_Value === undefined
    ) {
      return res.status(400).json({ message: 'Asset details are required and must be complete' });
    }

    // Validate existingloanDetails (must be an array with at least one entry)
    if (
      !Array.isArray(existingloanDetails) ||
      existingloanDetails.length === 0 ||
      !existingloanDetails.every(loan =>
        loan.Monthly_Payment !== undefined &&
        loan.Lender_Name !== undefined &&
        loan.Loan_Type !== undefined &&
        loan.Total_Loan_Amount !== undefined
      )
    ) {
      return res.status(400).json({ message: 'All loan details must be complete and in array format' });
    }

    // Get the user from the temp store using sessionId
    const user = tempUsers.get(sessionId);
    if (!user) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Make sure Form 1 data exists
    if (!user.personalDetails || !user.professionalDetails || !user.passwordDetails) {
      return res.status(400).json({ message: 'Incomplete form 1 data. Start over.' });
    }

    // Store FinancialDetails in the user object
    user.FinancialDetails = {
      incomeDetails,
      assetDetails,
      existingloanDetails,
    };

    // Save updated user to tempUsers
    tempUsers.set(sessionId, user);
    res.status(200).json({ message: 'Form 2 saved' });

  } catch (err) {
    console.error('Signup2 Error:', err);
    res.status(500).json({ message: 'Server error!' });
  }
};

module.exports = { signup2User };
