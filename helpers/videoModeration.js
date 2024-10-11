// helpers/videoModeration.js

const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const { analyzeImage, loadModel } = require('./nsfwHelper');
const fs = require('fs');

// Function to extract frames from a video at regular intervals
const extractFrames = (videoPath, framesDir, interval = 5) => {
  return new Promise((resolve, reject) => {
    // Ensure the frames directory exists
    if (!fs.existsSync(framesDir)) {
      fs.mkdirSync(framesDir, { recursive: true });
    }

    ffmpeg(videoPath)
      .on('end', () => {
        resolve();
      })
      .on('error', (err) => {
        reject(err);
      })
      .screenshots({
        count: 10, // Number of frames to extract
        folder: framesDir,
        size: '320x240',
        timemarks: generateTimemarks(videoPath, 10), // Extract frames at equal intervals
      });
  });
};

// Helper to generate timemarks based on video duration and number of frames
const generateTimemarks = (videoPath, count) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);
      const duration = metadata.format.duration;
      const interval = duration / (count + 1);
      const timemarks = [];
      for (let i = 1; i <= count; i++) {
        timemarks.push((i * interval).toFixed(2));
      }
      resolve(timemarks);
    });
  });
};

// Function to perform content moderation on video
const moderateVideo = async (videoPath) => {
  try {
    // Load NSFW model
    await loadModel();

    // Directory to store extracted frames
    const framesDir = path.join(path.dirname(videoPath), 'frames');
    
    // Extract frames
    await extractFrames(videoPath, framesDir, 10);
    
    // Get list of extracted frames
    const frameFiles = fs.readdirSync(framesDir).filter(file => /\.(png|jpg|jpeg)$/.test(file));

    let isInappropriate = false;
    let issues = [];

    for (const frameFile of frameFiles) {
      const framePath = path.join(framesDir, frameFile);
      const predictions = await analyzeImage(framePath);

      // Check predictions for NSFW content
      predictions.forEach(prediction => {
        if (prediction.className === 'Porn' || prediction.className === 'Sexy') {
          if (prediction.probability > 0.7) { // Threshold can be adjusted
            isInappropriate = true;
            issues.push({ frame: frameFile, class: prediction.className, probability: prediction.probability });
          }
        }
      });

      // If inappropriate content is detected, no need to check further
      if (isInappropriate) break;
    }

    // Cleanup extracted frames
    fs.rmSync(framesDir, { recursive: true, force: true });

    return { isInappropriate, issues };
  } catch (error) {
    console.error('Error moderating video:', error);
    throw error;
  }
};

module.exports = { moderateVideo };
