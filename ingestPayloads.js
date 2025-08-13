import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import Message from './models/Message.js';
import dotenv from 'dotenv';

dotenv.config();

// use  Folder jaha sample JSON payloads hain
const FOLDER = path.resolve('./sample_payloads');

// Function jo webhook jaise hi parsing karega
function parsePayload(payload) {
  // Agar payload me metaData.entry hai to usko payload.entry me copy karega 
  if (payload.metaData && Array.isArray(payload.metaData.entry)) {
    payload.entry = payload.metaData.entry;
  }

  const messages = [];
  const statuses = [];
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

// MongoDB connect karke payloads ingest karein
(async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://arayanmanish:bHkWOxVoBYnoy5il@cluster0.3xtjatq.mongodb.net/whatsapp');
    const files = await fs.readdir(FOLDER);
    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      const content = JSON.parse(await fs.readFile(path.join(FOLDER, f), 'utf8'));
      const { messages, statuses } = parsePayload(content);

      // Messages insert
      for (const item of messages) {
        const m = item.raw;
        const meta = item.metadata || {};
        const doc = {
          wa_id: m.from || (meta.contacts && meta.contacts[0]?.wa_id) || 'unknown',
          from: m.from,
          to: m.to || meta.phone_number_id || null,
          text: m.text?.body || '',
          timestamp: m.timestamp ? new Date(Number(m.timestamp) * 1000) : new Date(),
          status: 'sent',
          meta_msg_id: m.id || null,
          original_payload: m
        };

        if (doc.meta_msg_id) {
          const exists = await Message.findOne({ meta_msg_id: doc.meta_msg_id });
          if (exists) {
            console.log(`Skipped duplicate message: ${doc.meta_msg_id}`);
            continue;
          }
        }

        await Message.create(doc);
        console.log(`Inserted message from ${f}`);
      }

      // Status updates
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
        }
      }
    }

   // console.log('Ingest complete.');
    process.exit(0);
  } catch (err) {
   // console.error(err);
    process.exit(1);
  }
})();
