import Interview from '../models/Interview.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure temp directory exists
const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter (videos only)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /mp4|avi|mov|wmv|flv|mkv|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) cb(null, true);
    else cb(new Error('Only video files are allowed!'), false);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});


//Controller Functions

// Upload video and create session

export const uploadVideo = [
    upload.single('video'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No video uploaded' });
            }

            const newInterview = await Interview.create({
                user_id: req.user._id,
                video_url: req.file.path,  // change this when using cloud storage
                status: 'recorded',
            });

            res.status(201).json({ message: 'Video uploaded and session created', interview: newInterview });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
];

// Get all videos for a user
export const getUserVideos = async (req, res) => {
    try {
        const videos = await Interview.find({ user_id: req.user._id });
        res.status(200).json(videos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get single video by ID
export const getVideoById = async (req, res) => {
    try {
        const video = await Interview.findById(req.params.id);
        if (!video) return res.status(404).json({ message: 'Video not found' });
        res.status(200).json(video);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Start processing
export const startProcessing = async (req, res) => {
    try {
        const video = await Interview.findById(req.params.id);
        if (!video) return res.status(404).json({ message: 'Video not found' });

        video.status = 'analyzing';
        await video.save();

        res.status(200).json({ message: 'Processing started', video });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Complete analysis
export const completeAnalysis = async (req, res) => {
    try {
        const video = await Interview.findById(req.params.id);
        if (!video) return res.status(404).json({ message: 'Video not found' });

        video.status = 'completed';
        video.analysed_at = new Date();
        await video.save();

        res.status(200).json({ message: 'Analysis completed', video });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Fail processing
export const failProcessing = async (req, res) => {
    try {
        const video = await Interview.findById(req.params.id);
        if (!video) return res.status(404).json({ message: 'Video not found' });

        video.status = 'failed';
        await video.save();

        res.status(200).json({ message: 'Processing failed', video });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
