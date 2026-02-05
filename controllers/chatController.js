const { encrypt, decrypt } = require("../utils/encryption");
const Message = require("../models/Message");
const Chat = require("../models/Chat");
const socketUtil = require("../utils/socket");

exports.getMyChats = async (req, res) => {
  const myId = req.user.id;

  const chats = await Chat.find({
    members: myId,
  })
    .populate("members", "name imageUrl isOnline")
    .sort({ updatedAt: -1 });

  const formatted = await Promise.all(
    chats.map(async (chat) => {
      // 1️⃣ Get last message safely
      const lastMsg = await Message.findOne({ chatId: chat._id })
        .sort({ createdAt: -1 })
        .lean()
        .catch(() => null);

      // 2️⃣ Find other user safely
      const otherUser = chat.members.find(
        (m) => m._id.toString() !== myId.toString(),
      );

      // 3️⃣ Handle missing user (VERY IMPORTANT)
      if (!otherUser) {
        return null; // will filter later
      }

      // 4️⃣ Decrypt safely
      let lastMessageText = "";
      if (lastMsg?.content) {
        try {
          lastMessageText = decrypt(lastMsg.content);
        } catch (err) {
          lastMessageText = "[Encrypted message]";
        }
      }

      return {
        chatId: chat._id,
        user: {
          id: otherUser._id,
          name: otherUser.name || "Unknown",
          avatar: otherUser?.imageUrl || null,
          online: !!otherUser.isOnline,
        },
        lastMessage: lastMessageText,
        lastMessageAt: timeAgo(lastMsg?.createdAt) || timeAgo(chat.updatedAt),
      };
    }),
  );

  // 🔥 Remove null entries
  const safeChats = formatted.filter(Boolean);

  res.json(safeChats);
};

exports.sendMessage = async (req, res) => {
  const { chatId } = req.params;
  const { text } = req.body;

  const encrypted = encrypt(text);

  const message = await Message.create({
    chatId,
    sender: req.user.id,
    content: encrypted,
  });
  const updatedMessage = {
    ...message.toObject(), // convert mongoose doc → plain object
    content: text,
  };

  const io = socketUtil.getIO();
  io.to(chatId).emit("receiveMessage", updatedMessage);

  await Chat.findByIdAndUpdate(chatId, {
    lastMessage: encrypted,
    lastMessageAt: new Date(),
  });

  res.json(message);
};

exports.getMessages = async (req, res) => {
  const { chatId } = req.params;

  const messages = await Message.find({ chatId })
    .populate("sender", "name")
    .sort({ createdAt: -1 });

  const decrypted = messages.map((m) => ({
    ...m._doc,
    content: decrypt(m.content),
  }));

  res.json(decrypted);
};

exports.createChat = async (req, res) => {
  const { userId } = req.body;
  const myId = req.user.id;

  let chat = await Chat.findOne({
    members: { $all: [myId, userId] },
  });

  if (!chat) {
    chat = await Chat.create({
      members: [myId, userId],
    });
  }

  res.json(chat);
};

function timeAgo(date) {
  if (!date) return "";

  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);

  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}
