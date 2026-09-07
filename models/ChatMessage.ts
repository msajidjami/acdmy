import mongoose, { Schema, models } from 'mongoose';

export interface IChatMessage {
  userEmail: string;
  userName?: string;
  message: string;
  isAdmin: boolean;
  readByAdmin: boolean; // ایڈمن نے پڑھ لیا؟
  readByUser: boolean;  // صارف نے پڑھ لیا؟
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  userEmail: { type: String, required: true },
  userName: { type: String },
  message: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  readByAdmin: { type: Boolean, default: false },
  readByUser: { type: Boolean, default: false }, // ✅ نیا فیلڈ
  createdAt: { type: Date, default: Date.now },
});

export default models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);