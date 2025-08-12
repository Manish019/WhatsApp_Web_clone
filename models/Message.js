import mongoose from 'mongoose';
// create Schema as per required
const MessageSchema = new mongoose.Schema({
  wa_id: { type: String, required: true },
  from: String,
  to: String,
  text: String,
  timestamp: { type: Date },
  status: { type: String, enum: ['sent', 'delivered', 'read', 'pending'], default: 'sent' },
  meta_msg_id: { type: String, index: true },
  original_payload: mongoose.Schema.Types.Mixed
}, { timestamps: true });

export default mongoose.model('processed_messages', MessageSchema);
