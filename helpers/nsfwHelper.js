// helpers/nsfwHelper.js

const nsfw = require('nsfwjs');
const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');

let model;

// Initialize the NSFW model
const loadModel = async () => {
  if (!model) {
    model = await nsfw.load();
  }
  return model;
};

// Analyze an image for NSFW content
const analyzeImage = async (imagePath) => {
  try {
    const image = fs.readFileSync(imagePath);
    const tensor = tf.node.decodeImage(image, 3);
    const predictions = await model.classify(tensor);
    tensor.dispose();
    return predictions;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
};

module.exports = { loadModel, analyzeImage };
