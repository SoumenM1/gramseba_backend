const express = require('express');
const cors = require('cors')
const http = require('http');
// const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const socketUtil = require('./utils/socket'); 
const dotenv = require('dotenv');
const { errorHandler } = require('./middlewares/errorHandler');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
// Initialize Socket.io
const io = socketUtil.init(server);

// app.use(morgan('combined'));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
}));
app.use(express.json());
app.use(cors({
  origin: ['https://grambazer.gramsaba.in','http://localhost:3000'], // Allow only your frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true, // Include credentials if needed
}));


// Setup routes
app.get('/',(req,res)=>{
    res.send('This is gram bazer server');
})
const authRoutes = require('./routes/authRoutes');
const shopRoutes = require('./routes/shopRoutes');
const videoRoutes = require('./routes/videoRoutes');
const offerRoutes = require('./routes/offerRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/offers', offerRoutes);

app.use(errorHandler);
// Socket.io connection
io.on('connection', (socket) => {
  console.log('New WebSocket connection');

  // Notify all users when a new video is uploaded
  socket.on('newVideo', (data) => {
    io.emit('notifyVideo', data);
  });

  // Notify users within 10km when a new offer is created
  socket.on('newOffer', (data) => {
    io.emit('notifyOffer', data);
  });

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
  });
});

// Server listening
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
