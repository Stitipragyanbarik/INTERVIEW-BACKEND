import Interview from '../models/Interview.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

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

// File filter (videos only for upload, images for emotion detection)
const fileFilter = (req, file, cb) => {
    console.log(`File filter: fieldname=${file.fieldname}, mimetype=${file.mimetype}, originalname=${file.originalname}`);
    if (req.originalUrl.includes('/predict_emotion')) {
        // Allow image files for emotion detection - relax filters for debugging
        const allowedImageMimes = /image\/.*/;
        const allowedImageExts = /\.(jpeg|jpg|png|gif|bmp|tiff)$/i;
        const extname = allowedImageExts.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedImageMimes.test(file.mimetype);

        console.log(`Emotion detection: extname=${extname}, mimetype=${mimetype}`);
        if (mimetype || extname) cb(null, true);  // Allow if either matches
        else cb(new Error('Only image files are allowed for emotion detection!'), false);
    } else {
        // Allow video files for upload
        const allowedVideoMimes = /video\/(mp4|avi|mov|wmv|flv|mkv|webm)/;
        const allowedVideoExts = /\.(mp4|avi|mov|wmv|flv|mkv|webm)$/i;
        const extname = allowedVideoExts.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedVideoMimes.test(file.mimetype);

        if (mimetype && extname) cb(null, true);
        else cb(new Error('Only video files are allowed!'), false);
    }
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

// Emotion Detection Proxy
export const predictEmotion = [
    upload.single('file'),  // This expects 'file' field
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No image file uploaded' });
            }

            // Read the uploaded image file
            const imageBuffer = fs.readFileSync(req.file.path);

            // Prepare form data for the FastAPI server
            const formData = new FormData();
            formData.append('file', imageBuffer, { filename: 'frame.jpg', contentType: 'image/jpeg' });

            // Send request to FastAPI emotion detection API
            const response = await axios.post('http://127.0.0.1:8000/predict_emotion/', formData, {
                headers: {
                    ...formData.getHeaders(),
                },
                timeout: 10000, // 10 seconds timeout
            });

            // Clean up the temporary file
            fs.unlinkSync(req.file.path);

            // Return the response from FastAPI
            res.status(200).json(response.data);
        } catch (error) {
            console.error('Emotion prediction error:', error.message);

            // Clean up the temporary file if it exists
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            if (error.response) {
                // Forward the error from FastAPI
                res.status(error.response.status).json(error.response.data);
            } else {
                res.status(500).json({ message: 'Failed to connect to emotion detection service' });
            }
        }
    }
];
