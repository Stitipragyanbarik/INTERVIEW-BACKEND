import express from 'express';
import {
    uploadVideo,
    getUserVideos,
    getVideoById,
    startProcessing,
    completeAnalysis,
    failProcessing,
    predictEmotion
} from '../controllers/uploadController.js';

const router = express.Router();

// Upload video + create session
router.post('/upload', uploadVideo);

// Get all videos for logged-in user
router.get('/', getUserVideos);

// Get single video
router.get('/:id', getVideoById);

// Update session status
router.patch('/:id/start', startProcessing);
router.patch('/:id/complete', completeAnalysis);
router.patch('/:id/fail', failProcessing);

// Emotion Detection Proxy
router.post('/predict_emotion', predictEmotion);

export default router;
