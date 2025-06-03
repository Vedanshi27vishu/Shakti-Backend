// Add to routes/user.js
router.get('/all-users', requireAuth, async (req, res) => {
  const currentUserId = req.userId;

  try {
    const otherUsers = await User.find({ _id: { $ne: currentUserId } }).select('name');

    res.status(200).json({ users: otherUsers });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;