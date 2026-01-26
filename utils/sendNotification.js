const express = require("express");
const router = express.Router();
const socketUtil = require("./socket"); // Adjust the path as necessary

router.get("/", (req, res) => {
  const io = socketUtil.getIO();
  io.on("setup", (userData) => {
    socket.join(userData.userId);
    socket.emit("connected");
  });
  // Send to all users
  io.emit("notification", {
    title: "Announcement",
    body: "Welcome to the new update!",
  });

  res.send("Notification endpoint");
});

module.exports = router;
