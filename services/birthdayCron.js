// cron/birthdayCron.js
const cron = require("node-cron");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

cron.schedule("0 9 * * *", async () => {
  console.log("🎂 Birthday job running...");

  const today = new Date();
  const month = today.getMonth();
  const date = today.getDate();

  const users = await User.find({
    $expr: {
      $and: [
        { $eq: [{ $dayOfMonth: "$dob" }, date] },
        { $eq: [{ $month: "$dob" }, month + 1] },
      ],
    },
  });

  for (const user of users) {
    await sendEmail(user.email, user.name);
  
  }
});
