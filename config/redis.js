const { createClient } = require("redis");
require("dotenv").config();

const client = createClient({
  username: "default",
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: "redis-12929.c17.us-east-1-4.ec2.cloud.redislabs.com",
    port: 12929,
  }
});

// client.on("connect", () => {
//   console.log("✅ Redis Connected");
// });

// client.on("error", (err) => {
//   console.error("❌ Redis Client Error:", err.message);
// });

module.exports = client;