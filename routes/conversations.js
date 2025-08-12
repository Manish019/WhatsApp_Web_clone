import express from 'express';
import Message from '../models/Message.js';

const router = express.Router();

// Get all conversations
router.get('/conversations', async (req, res) => {
  try {
    const convs = await Message.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$wa_id",
          lastMessage: { $first: "$$ROOT" },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          wa_id: "$_id",
          lastMessage: 1,
          count: 1
        }
      },
      { $sort: { "lastMessage.timestamp": -1 } }
    ]);
    res.json(convs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all messages of a conversation
router.get('/conversations/:wa_id/messages', async (req, res) => {
  try {
    const { wa_id } = req.params;
    const messages = await Message.find({ wa_id }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send new message 
router.post('/conversations/:wa_id/messages', async (req, res) => {
  try {
    const { wa_id } = req.params;
    const { text, from } = req.body;

    const doc = {
      wa_id,
      from: from || 'me',
      to: wa_id,
      text,
      timestamp: new Date(),
      status: 'sent',
      meta_msg_id: `local-${Date.now()}`,
      original_payload: { local: true }
    };

    const created = await Message.create(doc);

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
