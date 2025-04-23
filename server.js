const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');

dotenv.config(); // Load environment variables from .env


const app = express();
app.use(cors());
app.use(express.json());

// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI)

.then(() => {
  console.log("✅ MongoDB connected");

  const authRoutes = require('./routes/auth');
app.use('/api', authRoutes);
app.use('/api/posts', postRoutes);

  // ✅ Start the server AFTER DB is connected
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✅ Server listening on port ${PORT}`);
  });

})
.catch((err) => {
  console.log("❌ MongoDB connection error:", err);
});

console.log("🧠 Server file is being run");
