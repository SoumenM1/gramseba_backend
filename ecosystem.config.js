module.exports = {
    apps: [
      {
        name: "gramsaba-app", // Name of the application
        script: "app.js", // The entry point of your application
        cwd: "./", // Current working directory
        exec_mode: "fork", // Mode of execution (fork or cluster)
        watch: false, // Disable file watching
        autorestart: true, // Automatically restart the app on failure
        env: {
          NODE_ENV: "production", // Environment-specific variables
          MONGO_URI: "mongodb+srv://soumen:YzTyPQ7gAIEsw5OG@cluster0.c5spa4r.mongodb.net/gramsaba?retryWrites=true&w=majority&appName=Cluster0",
          JWT_SECRET: "your_jwt_secret",
          PORT: 5000,
          EMAIL_USER: "wishtofamily@gmail.com",
          EMAIL_PASSWORD: "mewqqqndmxtvjqew",
          CLOUDINARY_CLOUD_NAME: "dvfs7vdry",
          CLOUDINARY_API_KEY: "761112221269974",
          CLOUDINARY_API_SECRET: "Kgwnu_eOv2XNQ97G4t5VOSvnvus",
        },
        post_update: [
          "npm install", // Automatically installs dependencies
          "pm2 restart ecosystem.config.js --env production", // Restart app after updates
        ],
      },
    ],
  };
  