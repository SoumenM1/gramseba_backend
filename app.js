const express = require('express');
const cors = require('cors')
const http = require('http');
const socketUtil = require('./utils/socket'); 
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
// Initialize Socket.io
const io = socketUtil.init(server);

// app.use(morgan('combined'));
// app.use(rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again after 15 minutes',
// }));
app.use(express.json());

  app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}))

// Setup routes
app.get('/',(req,res)=>{
    res.send('This is grambazer server');
})
const authRoutes = require('./routes/authRoutes');
const shopRoutes = require('./routes/shopRoutes');
const videoRoutes = require('./routes/videoRoutes');
const offerRoutes = require('./routes/offerRoutes');
const itemRoutes = require('./routes/itemRoutes')
app.use('/api/auth', authRoutes);
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/subcategories", require("./routes/subCategoryRoutes"));

app.use('/api/shops', shopRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/items', itemRoutes);

// Socket.io connection
io.on('connection', (socket) => {
  console.log("Connected to socket.io");
    socket.on("setup", (userData) => {
      socket.join(userData.userId);
      socket.emit("connected");
    });

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
  });
});

// Server listening
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
