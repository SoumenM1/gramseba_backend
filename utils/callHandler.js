const socketUtil = require("./socket");

function registerCallHandlers() {
  const io = socketUtil.getIO();

  io.on("connection", (socket) => {
    console.log("call User connected:", socket.id);

    /* -------- JOIN ROOM -------- */
    socket.on("join-room", (roomId) => {
      if (!roomId) return;

      socket.join(roomId);
      console.log(`${socket.id} joined room ${roomId}`);
    });

    /* -------- CALL USER (ringing) -------- */
    socket.on("call-user", ({ roomId, caller }) => {
      socket.to(roomId).emit("incoming-call", caller);
    });

    /* -------- OFFER -------- */
    socket.on("offer", ({ roomId, offer }) => {
      socket.to(roomId).emit("offer", { offer });
    });

    /* -------- ANSWER -------- */
    socket.on("answer", ({ roomId, answer }) => {
      socket.to(roomId).emit("answer", { answer });
    });

    /* -------- ICE -------- */
    socket.on("ice-candidate", ({ roomId, candidate }) => {
      socket.to(roomId).emit("ice-candidate", { candidate });
    });

    /* -------- END CALL -------- */
    socket.on("end-call", ({ roomId }) => {
      socket.to(roomId).emit("call-ended");
    });

    /* -------- AUTO END IF DISCONNECT -------- */
    socket.on("disconnecting", () => {
      const rooms = [...socket.rooms];

      rooms.forEach((room) => {
        socket.to(room).emit("call-ended");
      });
    });
  });
}

module.exports = registerCallHandlers;