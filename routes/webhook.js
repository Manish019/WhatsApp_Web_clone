import express from 'express';
import Message from '../models/Message.js';

const router = express.Router();

function parseWebhook(payload) {
  const messages = [];
  const statuses = [];

  if (payload.metaData && Array.isArray(payload.metaData.entry)) {
    payload.entry = payload.metaData.entry;
  }

  const entries = payload.entry || [];
  for (const entry of entries) {
    const changes = entry.changes || [];
    for (const change of changes) {
      const value = change.value || {};
      if (Array.isArray(value.messages)) {
        for (const m of value.messages) {
          messages.push({ raw: m, metadata: value });
        }
      }
      if (Array.isArray(value.statuses)) {
        for (const s of value.statuses) {
          statuses.push(s);
        }
      }
    }
  }
  return { messages, statuses };
}

router.post('/', async (req, res) => {
  const payload = req.body;
  const { messages, statuses } = parseWebhook(payload);
  const io = req.app.get('io');

  try {
    for (const item of messages) {
      const m = item.raw;
      const meta = item.metadata || {};

      const doc = {
        wa_id: m.from || meta?.contacts?.[0]?.wa_id || 'unknown',
        from: m.from || 'unknown',
        to: m.to || meta?.metadata?.phone_number_id || null,
        text: m.text?.body || '',
        timestamp: m.timestamp ? new Date(Number(m.timestamp) * 1000) : new Date(),
        status: 'sent',
        meta_msg_id: m.id || null,
        original_payload: m
      };

      
      if (doc.meta_msg_id) {
        const exists = await Message.findOne({ meta_msg_id: doc.meta_msg_id });
        if (exists) {
          console.log(`Duplicate Message Skip: ${doc.meta_msg_id}`);
          continue;
        }
      }

      const created = await Message.create(doc);
      console.log(`New Inserted message: ${created.meta_msg_id}`);
      if (io) io.emit('new_message', created);
    }

    for (const s of statuses) {
      const msgId = s.id || s.message_id;
      if (!msgId) continue;
      const updated = await Message.findOneAndUpdate(
        { meta_msg_id: msgId },
        { status: s.status },
        { new: true }
      );
      if (updated) {
        console.log(`Updated status for ${msgId} -> ${s.status}`);
        if (io) io.emit('status_update', { meta_msg_id: msgId, status: s.status });
      } else {
        console.log(`Status update skipped => : ${msgId}`);
      }
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
