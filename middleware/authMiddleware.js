const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Example header: "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret_key'); // 🔐 move this to .env later
    req.user = decoded; // Save the user info to use later
    next(); // ✅ Allow access
  } catch (err) {
    console.error('❌ Invalid token:', err.message);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = verifyToken;
