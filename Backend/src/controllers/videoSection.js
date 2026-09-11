const cloudinary = require('cloudinary').v2;
const Problem = require("../models/problem");
const logger = require('../config/logger');
const User = require("../models/user");
const SolutionVideo = require("../models/solutionVideo");
const { sanitizeFilter } = require('mongoose');


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const generateUploadSignature = async (req, res) => {
  try {
    const { problemId } = req.params;
    
    const userId = req.result._id;
    // Verify problem exists
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Generate unique public_id for the video
    const timestamp = Math.round(new Date().getTime() / 1000);
    const publicId = `leetcode-solutions/${problemId}/${userId}_${timestamp}`;
    
    // Upload parameters
    const uploadParams = {
      timestamp: timestamp,
      public_id: publicId,
    };

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(
      uploadParams,
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({
      signature,
      timestamp,
      public_id: publicId,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      upload_url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload`,
    });

  } catch (error) {
    logger.error('Error generating upload signature', { error: error.message || error });
    res.status(500).json({ error: 'Failed to generate upload credentials' });
  }
};


const saveVideoMetadata = async (req, res) => {
  try {
    const {
      problemId,
      cloudinaryPublicId,
      secureUrl,
      duration,
    } = req.body;

    const userId = req.result._id;

    // Check if it's a YouTube link
    if (req.body.isYouTube) {
      // Check if video already exists for this problem and user
      const existingVideo = await SolutionVideo.findOne({
        problemId,
        userId
      });

      if (existingVideo) {
        return res.status(409).json({ error: 'Video already exists' });
      }

      // Extract YouTube ID to get thumbnail (basic extraction)
      let youtubeId = '';
      const ytMatch = secureUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
      if (ytMatch && ytMatch[1]) {
        youtubeId = ytMatch[1];
      }

      const dummyPublicId = `youtube_${problemId}_${Date.now()}`;
      const thumbnailUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : '';

      const videoSolution = await SolutionVideo.create({
        problemId,
        userId,
        cloudinaryPublicId: dummyPublicId,
        secureUrl,
        duration: duration || 0,
        thumbnailUrl
      });

      return res.status(201).json({
        message: 'YouTube video solution saved successfully',
        videoSolution: {
          id: videoSolution._id,
          thumbnailUrl: videoSolution.thumbnailUrl,
          duration: videoSolution.duration,
          uploadedAt: videoSolution.createdAt
        }
      });
    }

    // Verify the upload with Cloudinary
    const cloudinaryResource = await cloudinary.api.resource(
      cloudinaryPublicId,
      { resource_type: 'video' }
    );

    if (!cloudinaryResource) {
      return res.status(400).json({ error: 'Video not found on Cloudinary' });
    }

    // Check if video already exists for this problem and user
    const existingVideo = await SolutionVideo.findOne({
      problemId,
      userId,
      cloudinaryPublicId
    });

    if (existingVideo) {
      return res.status(409).json({ error: 'Video already exists' });
    }

    // const thumbnailUrl = cloudinary.url(cloudinaryResource.public_id, {
    // resource_type: 'image',  
    // transformation: [
    // { width: 400, height: 225, crop: 'fill' },
    // { quality: 'auto' },
    // { start_offset: 'auto' }  
    // ],
    // format: 'jpg'
    // });

    const thumbnailUrl = cloudinary.image(cloudinaryResource.public_id,{resource_type: "video"})

// https://cloudinary.com/documentation/video_effects_and_enhancements#video_thumbnails
    // Create video solution record
    const videoSolution = await SolutionVideo.create({
      problemId,
      userId,
      cloudinaryPublicId,
      secureUrl,
      duration: cloudinaryResource.duration || duration,
      thumbnailUrl
    });


    res.status(201).json({
      message: 'Video solution saved successfully',
      videoSolution: {
        id: videoSolution._id,
        thumbnailUrl: videoSolution.thumbnailUrl,
        duration: videoSolution.duration,
        uploadedAt: videoSolution.createdAt
      }
    });

  } catch (error) {
    logger.error('Error saving video metadata', { error: error.message || error });
    res.status(500).json({ error: 'Failed to save video metadata' });
  }
};


const deleteVideo = async (req, res) => {
  try {
    const { problemId } = req.params;
    const userId = req.result._id;

    const video = await SolutionVideo.findOneAndDelete({problemId:problemId});
    
   

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (!video.cloudinaryPublicId.startsWith('youtube_')) {
      await cloudinary.uploader.destroy(video.cloudinaryPublicId, { resource_type: 'video' , invalidate: true });
    }

    res.json({ message: 'Video deleted successfully' });

  } catch (error) {
    logger.error('Error deleting video', { error: error.message || error });
    res.status(500).json({ error: 'Failed to delete video' });
  }
};

module.exports = {generateUploadSignature,saveVideoMetadata,deleteVideo};