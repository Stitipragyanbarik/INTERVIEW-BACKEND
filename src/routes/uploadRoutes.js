import express from 'express';
import { uploadVideo } from '../controllers/uploadController.js';

const router = express.Router();

// Video upload route
router.post('/upload/video', uploadVideo);

export default router;
