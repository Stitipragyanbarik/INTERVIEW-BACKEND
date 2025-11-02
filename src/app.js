import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import testRoute from "./routes/testroute.js";
import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to the Backend Server ");
});

// Routes
app.use("/", testRoute);
app.use("/", authRoutes);
app.use("/", uploadRoutes);

// Define PORT from .env or default 5000
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🔗 Working endpoint: http://localhost:${PORT}/working`);
  console.log(`🔗 Health endpoint:  http://localhost:${PORT}/health`);
});