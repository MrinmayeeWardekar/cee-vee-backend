const express = require('express');
const router = express.Router();
const { chat } = require('../controllers/chatbotController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/chatbot/chat - Send message to chatbot
router.post('/chat', protect, chat);

module.exports = router;