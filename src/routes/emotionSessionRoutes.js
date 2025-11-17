import express from 'express';
import auth from '../middleware/auth.js';
import { createEmotionSession, addResultsAndComplete, getSessionById } from '../controllers/emotionSessionController.js';

const router = express.Router();

router.post('/', auth, createEmotionSession);
router.get('/:id', auth, getSessionById);
router.post('/:id/results', auth, addResultsAndComplete);

export default router;
