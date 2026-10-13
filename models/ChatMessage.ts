import mongoose, { Schema, Model, Types } from 'mongoose';

/* ============================================================
   ChatMessage Model
   ============================================================
   Supports TWO kinds of messages in a single collection:

   1) Main user-to-user chat:
      - senderId, receiverId, text, isRead
      - Used by /api/chat/[id]  and  /api/contacts/*

   2) Legacy guest/admin chat (kept for backward compatibility):
      - userEmail, userName, message, isAdmin, readByUser
      - Used by /api/chat/messages, /api/chat/unread,
                /api/chat/mark-read-user

   All fields are optional except the ones required by each mode.
   ============================================================ */

export interface IChatMessage extends mongoose.Document {
  _id: Types.ObjectId;

  /* ---------- Main user-to-user chat ---------- */
  senderId?: Types.ObjectId;
  receiverId?: Types.ObjectId;
  text?: string;
  isRead?: boolean;

  /* ---------- Legacy guest/admin chat ---------- */
  userEmail?: string;
  userName?: string;
  message?: string;
  isAdmin?: boolean;
  readByUser?: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    /* ---------- Main user-to-user chat ---------- */
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    /* ---------- Legacy guest/admin chat ---------- */
    userEmail: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
      default: '',
    },
    userName: {
      type: String,
      trim: true,
      default: '',
    },
    message: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    isAdmin: {
      type: Boolean,
      default: false,
      index: true,
    },
    readByUser: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    /* strict: false کی بجائے باقاعدہ schema — تاکہ validation کام کرے */
  }
);

/* ============================================================
   Indexes
   ============================================================ */

/* Main chat — conversation lookup */
ChatMessageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

/* Main chat — unread count for a receiver */
ChatMessageSchema.index({ receiverId: 1, isRead: 1 });

/* Legacy guest — messages of one guest */
ChatMessageSchema.index({ userEmail: 1, createdAt: -1 });

/* Legacy guest — unread count from admin */
ChatMessageSchema.index({ userEmail: 1, isAdmin: 1, readByUser: 1 });

/* ============================================================
   Model
   ============================================================ */

const ChatMessage: Model<IChatMessage> =
  (mongoose.models.ChatMessage as Model<IChatMessage>) ||
  mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);

export default ChatMessage;