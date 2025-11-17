import mongoose from 'mongoose';

const EmotionResultSchema = new mongoose.Schema({
  timestamp: { type: Number, required: true }, 
  emotion: { type: String, required: true },
  confidence: { type: Number }, // 0-1
}, { _id: false });

const EmotionSessionSchema = new mongoose.Schema({
  interview: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // session lifecycle
  status: {
    type: String,
    enum: ['created', 'started', 'processing', 'completed', 'failed'],
    default: 'created',
  },

  // timestamps for lifecycle events
  started_at: { type: Date },             // when user / client started session
  processing_started_at: { type: Date },  // when backend/worker started processing frames
  completed_at: { type: Date },           // when processing completed
  failed_at: { type: Date },

  // list of emotion detection results
  results: {
    type: [EmotionResultSchema],
    default: [],
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

export default mongoose.model('EmotionSession', EmotionSessionSchema);
