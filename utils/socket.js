let io;

module.exports = {
  init: (server) => {
    io = require('socket.io')(server, {
      cors: {
        origin: "https://grambazer.gramsaba.in", // or use "*" for any origin
        methods: ["GET", "POST"],
        allowedHeaders: ["Authorization"], // Specify allowed headers if needed
        credentials: true, // Allow credentials (cookies, etc.)
      },
    });
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};
