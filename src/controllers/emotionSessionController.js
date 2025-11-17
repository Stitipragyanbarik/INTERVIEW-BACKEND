import EmotionSession from '../models/EmotionSession.js';
import Interview from '../models/Interview.js';
import mongoose from 'mongoose';

// Create a new emotion session (user starts the session)
export const createEmotionSession = async (req, res) => {
  try {
    const { interviewId } = req.body;
    if (!interviewId || !mongoose.Types.ObjectId.isValid(interviewId)) {
      return res.status(400).json({ message: 'Valid interviewId is required' });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    // ensure the requester owns the interview
    if (String(interview.user_id) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const session = await EmotionSession.create({
      interview: interview._id,
      user_id: req.user._id,
      status: 'started',
      started_at: new Date(),
    });

    return res.status(201).json({ message: 'Emotion session created', session });
  } catch (err) {
    console.error('createEmotionSession', err);
    return res.status(500).json({ message: err.message });
  }
};

// Append results and optionally mark session complete (all done by user/frontend)
export const addResultsAndComplete = async (req, res) => {
  try {
    const { results, complete = false } = req.body; // results: array of {timestamp, emotion, confidence}
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid session id' });
    }

    const session = await EmotionSession.findById(id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (String(session.user_id) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (Array.isArray(results) && results.length > 0) {
      session.results.push(
        ...results.map(r => ({
          timestamp: r.timestamp,
          emotion: r.emotion,
          confidence: r.confidence ?? null,
        }))
      );
    }

    if (complete) {
      session.status = 'completed';
      session.completed_at = new Date();

      // Update interview as completed too
      const interview = await Interview.findById(session.interview);
      if (interview) {
        interview.status = 'completed';
        interview.analysed_at = new Date();
        await interview.save();
      }
    }

    await session.save();
    return res.status(200).json({ message: 'Session updated', session });
  } catch (err) {
    console.error('addResultsAndComplete', err);
    return res.status(500).json({ message: err.message });
  }
};

// Get session status & results (owner-only)
export const getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });

    const session = await EmotionSession.findById(id).populate('interview');
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (String(session.user_id) !== String(req.user._id)) return res.status(403).json({ message: 'Not authorized' });

    return res.status(200).json({ session });
  } catch (err) {
    console.error('getSessionById', err);
    return res.status(500).json({ message: err.message });
  }
};
