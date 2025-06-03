require('dotenv').config();
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const requireAuth = (req, res, next) => {
  const { authorization } = req.headers;
  console.log("Authorization header:", authorization);

  if (!authorization) {
    return res.status(401).json({ message: "Authorization token required" });
  }

  const token = authorization.split(" ")[1];
  console.log("Extracted token:", token);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Decoded token payload:", decoded);

    const { userId } = decoded;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token payload: missing userId" });
    }

    req.userId = userId;
    next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    res.status(401).json({ message: "Invalid token" });
  }
};


module.exports = requireAuth;