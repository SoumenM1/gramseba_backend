// middlewares/errorHandler.js
const errorHandler = (err, req, res, next) => {
    // Default error status and message
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
  
    // Log the error (optional, for debugging purposes)
    console.error(err);
  
    // Send error response
    res.status(statusCode).json({
      success: false,
      message,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack // Hide stack trace in production
    });
  };
  
  module.exports = { errorHandler };
  