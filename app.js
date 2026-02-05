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
const mediaRoutes = require('./routes/mediaRoutes');
const offerRoutes = require('./routes/offerRoutes');
const itemRoutes = require('./routes/itemRoutes')
app.use('/api/auth', authRoutes);
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/subcategories", require("./routes/subCategoryRoutes"));
app.use("/api/notifications", require("./utils/sendNotification"));

app.use('/api/shops', shopRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/items', itemRoutes);

app.use("/api/chat", require("./routes/chatRoutes"))

const jwt = require("jsonwebtoken");
const User = require("./models/User"); // adjust path


io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;

    if (!token) {
      return next(new Error("No token provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach user info to socket
    socket.userId = decoded.userId || decoded.id;

    next(); // ✅ allow connection
  } catch (err) {
    console.log("Socket auth error:", err.message);
    next(new Error("Authentication failed"));
  }
});

io.on("connection", async (socket) => {
  const userId = socket.userId;
  // console.log("Connected to socket.io:", socket.id, "User:", userId);
   socket.on("joinChat", (chatId) => {
    socket.join(chatId);
  });
  // 🟢 Mark online
  await User.findByIdAndUpdate(userId, {
    isOnline: true,
  });

  socket.on("disconnect", async () => {
    // console.log("WebSocket disconnected:", socket.id);
    // 🔴 Mark offline
    await User.findByIdAndUpdate(userId, {
      isOnline: false,
    });
  });
});


// Server listening
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
