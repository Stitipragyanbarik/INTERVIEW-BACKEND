import mongoose from 'mongoose';

const InterviewSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    video_url: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending','recorded','analyzing', 'completed', 'failed'],
        default: 'pending',
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    analysed_at: {
        type: Date,
    },
})


const Interview = mongoose.model('Interview', InterviewSchema);
module.exports = Interview;