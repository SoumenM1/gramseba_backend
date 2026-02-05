const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const {sendMessage, getMessages, createChat, getMyChats}= require("../controllers/chatController")
const router = express.Router();

router.get("/my-chats", protect, getMyChats);
router.get("/messages/:chatId", protect, getMessages);
router.post("/messages/:chatId", protect, sendMessage)


module.exports = router;    