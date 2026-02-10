const express = require("express");
const router = express.Router();
const socketUtil = require("./socket");
const User = require("../models/User");
const { protect } = require("../middlewares/authMiddleware");

const sendNotificationToUsers = async () => {
  const io = socketUtil.getIO();
  const onlineUsers = await User.find({}); // get all users

  for (let user of onlineUsers) {
    const notification = {
      title: "💖 Valentine’s Day Special",
      body: "Love is in the air 🌹 Special offers near you 💝",
      image:
        "https://res.cloudinary.com/dvfs7vdry/image/upload/v1770616988/val_kpha9m.jpg",
      data: { type: "VALENTINE" },
    };

    if (user?.isOnline) {
      io.emit("notification", notification);
    } else if (user?.expoPushToken) {
      await sendExpoPush(user.expoPushToken, notification);
    }
  }
};

async function sendExpoPush(token, notification) {
  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: token,
      title: notification.title,
      body: notification.body,
      sound: "default",
      data: { image: notification.image, type: "VALENTINE" },
    }),
  });
}

router.get("/notifications", (req, res) => {
  // const io = socketUtil.getIO();
  // io.on("setup", (userData) => {
  //   socket.join(userData.userId);
  //   socket.emit("connected");
  // });
  // // Send to all users
  // io.emit("notification", {
  //   title: "Announcement",
  //   body: "Welcome to the new update!",
  // });

  // res.send("Notification endpoint");
  sendNotificationToUsers();
  res.json({ message: "send notificaion" });
});

router.post("/save-push-token", protect, async (req, res) => {
  try {
    const { expoPushToken } = req.body;
    const userId = req.user._id;
    if (!userId || !expoPushToken)
      return res.status(400).json({ message: "missing params" });
    await User.findByIdAndUpdate(userId, {
      expoPushToken,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/update-location", protect, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const userId = req.user._id;
    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Latitude & Longitude required" });
    }

    await User.findByIdAndUpdate(userId, {
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
        updatedAt: new Date(),
      },
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
