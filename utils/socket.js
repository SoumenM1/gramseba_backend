let io;

module.exports = {
  init: (server) => {
    io = require('socket.io')(server, {
      cors: {
        origin: "https://grambazer.gramsaba.in", // or use "*" for any origin
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true, // Include credentials if needed
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
