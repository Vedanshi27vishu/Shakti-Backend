
const express = require('express');
const authenticateJWT = require('../Middlewares/authMiddleware');


app.get('/api/profile', authenticateJWT, async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);

    const userId = req.user.userId; // You must include userId in JWT when logging in

    // 1. User Info
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // 2. User Posts
    const posts = await db.collection('posts').find({ userId: new ObjectId(userId) }).toArray();
    const postCount = posts.length;

    // 3. Follower Data
    const follow = await db.collection('follows').findOne({ userId: new ObjectId(userId) });
    const followersCount = follow?.followers?.length || 0;
    const followingCount = follow?.following?.length || 0;

    // 4. Profile Response
    res.json({
      name: user.name,
      email: user.email,
      businessForm: {
        businessName: user.businessForm?.businessName || '',
        category: user.businessForm?.category || '',
        summary: user.businessForm?.summary || ''
      },
      followersCount,
      followingCount,
      postCount,
      posts
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await client.close();
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
