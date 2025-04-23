const jwt = require('jsonwebtoken');
const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');

// ✅ POST /api/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, nickname } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword, nickname });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ POST /api/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("📩 Login attempt:", email, password);

    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ Email not found");
      return res.status(400).json({ message: 'Email not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Invalid password");
      return res.status(401).json({ message: 'Invalid password' });
    }

    // ✅ Generate JWT Token here inside the route
    const token = jwt.sign(
      { userId: user._id },
      'your_jwt_secret_key', // 💡 Replace with process.env.JWT_SECRET later
      { expiresIn: '1h' }
    );

    console.log("✅ Login successful");
    res.status(200).json({
      message: 'Login successful',
      token,
      user: { email: user.email, nickname: user.nickname }
    });
  } catch (err) {
    console.error("🔥 Error in /login:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Protected route example
router.get('/me', verifyToken, (req, res) => {
    res.json({
      message: 'Token verified! 👋',
      userId: req.user.userId
    });
  });

  
// ✅ Export router at the end
module.exports = router;
