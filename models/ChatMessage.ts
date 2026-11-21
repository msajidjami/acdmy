// models/ChatMessage.ts
import mongoose, { Schema, models, model, Types } from 'mongoose';

export type ChatMessageType = 'text' | 'voice' | 'image' | 'file' | 'call';
export type CallKind = 'audio' | 'video';
export type CallStatus = 'missed' | 'completed' | 'declined' | 'no_answer';

// ⚠️ IMPORTANT: 'extends mongoose.Document' نہیں کرنا
export interface IChatMessage {
  _id: Types.ObjectId;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  type: ChatMessageType;
  text: string;
  audioUrl?: string;
  audioDuration?: number;
  call?: {
    kind: CallKind;
    status: CallStatus;
    durationSeconds: number;
  };
  isRead: boolean;
  readAt?: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['text', 'voice', 'image', 'file', 'call'],
      default: 'text',
      index: true,
    },
    text: { type: String, default: '', trim: true, maxlength: 4000 },
    audioUrl: { type: String, default: '' },
    audioDuration: { type: Number, default: 0 },
    call: {
      kind: { type: String, enum: ['audio', 'video'] },
      status: { type: String, enum: ['missed', 'completed', 'declined', 'no_answer'] },
      durationSeconds: { type: Number, default: 0 },
    },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      index: true,
    },
  },
  { timestamps: true }
);

ChatMessageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
ChatMessageSchema.index({ receiverId: 1, isRead: 1 });

const ChatMessage =
  (models.ChatMessage as mongoose.Model<IChatMessage>) ||
  model<IChatMessage>('ChatMessage', ChatMessageSchema);

export default ChatMessage;