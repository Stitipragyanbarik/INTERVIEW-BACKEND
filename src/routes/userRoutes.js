import express from "express";
import { getUserProfile } from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js"; // we'll handle this next

const router = express.Router();

// Protected route — only logged-in users can access
router.get("/profile", authMiddleware, getUserProfile);
export default router;

