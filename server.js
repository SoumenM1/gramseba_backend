const cluster = require('cluster');
const os = require('os');
const express = require('express');
const cors = require('cors');
const http = require('http');
const net = require('net'); // Required for creating a TCP server
const dotenv = require('dotenv');
const { errorHandler } = require('./middlewares/errorHandler');
const connectDB = require('./config/db');
const socketUtil = require('./utils/socket'); // Assuming socket.js exports init function


dotenv.config();
connectDB();

const numCPUs = os.cpus().length;
const PORT = process.env.PORT || 5000;

// Simple hash function based on IP address
const hash = (ip) => {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Create a TCP server to distribute connections
  const server = net.createServer({ pauseOnConnect: true }, (connection) => {
    // Get the remote IP address
    const remoteAddress = connection.remoteAddress || connection.socket.remoteAddress;
    
    // Hash the IP and assign to a worker
    const workerIndex = hash(remoteAddress) % numCPUs;
    const worker = cluster.workers[Object.keys(cluster.workers)[workerIndex]];
    
    // Send the connection to the selected worker
    worker.send('sticky-session:connection', connection);
  });

  server.listen(PORT, () => {
    console.log(`Master listening on port ${PORT}`);
  });

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Starting a new worker.`);
    cluster.fork();
  });

} else {
  // Worker processes

  const app = express();
  const server = http.createServer(app);
  const io = socketUtil.init(server); // Initialize Socket.io

  // Middleware
  app.use(express.json());
  app.use(cors());

  // Setup routes
  app.get('/', (req, res) => {
    res.send('This is gram bazer server');
  });

  const authRoutes = require('./routes/authRoutes');
  const shopRoutes = require('./routes/shopRoutes');
  const videoRoutes = require('./routes/videoRoutes');
  const offerRoutes = require('./routes/offerRoutes');
  // const uploadRoutes = require('./routes/uploadRoutes'); // If you have upload routes
  // const userRoutes = require('./routes/userRoutes'); // If you have user routes
  // const kycRoutes = require('./routes/kycRoutes'); // If you have KYC routes

  app.use('/api/auth', authRoutes);
  app.use('/api/shops', shopRoutes);
  app.use('/api/videos', videoRoutes);
  app.use('/api/offers', offerRoutes);
  // app.use('/api/uploads', uploadRoutes);
  // app.use('/api/users', userRoutes);
  // app.use('/api/kyc', kycRoutes);

  // Error handler
  app.use(errorHandler);

  // Socket.io connection
  io.on('connection', (socket) => {
    console.log(`Worker ${process.pid} - New WebSocket connection`);

    // Notify all users when a new video is uploaded
    socket.on('newVideo', (data) => {
      io.emit('notifyVideo', data);
    });

    // Notify users within 10km when a new offer is created
    socket.on('newOffer', (data) => {
      io.emit('notifyOffer', data);
    });

    socket.on('disconnect', () => {
      console.log(`Worker ${process.pid} - WebSocket disconnected`);
    });
  });

  // Listen for connections sent from master
  process.on('message', (message, connection) => {
    if (message !== 'sticky-session:connection') return;

    server.emit('connection', connection);
    connection.resume();
  });

  // Start the server
  server.listen(0, () => { // Port is handled by the master
    console.log(`Worker ${process.pid} started`);
  });
}
