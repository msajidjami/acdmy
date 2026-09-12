import mongoose, { Schema, models, model } from 'mongoose';

/* ============================================================
   REPLY SUB-SCHEMA
   ============================================================ */

const ReplySchema = new Schema(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['student', 'owner', 'teacher', 'admin'],
      required: true,
    },
    senderName: { type: String, default: '', trim: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

/* ============================================================
   MESSAGE SCHEMA
   ============================================================ */

const MessageSchema = new Schema(
  {
    /* ---------- Academy ---------- */
    academyId: {
      type: Schema.Types.ObjectId,
      ref: 'Academy',
      required: true,
      index: true,
    },

    /* ---------- Student ---------- */
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    studentUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    /* ---------- Content ---------- */
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    category: {
      type: String,
      enum: ['general', 'fee', 'course', 'schedule', 'complaint', 'other'],
      default: 'general',
    },

    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal',
    },

    /* ---------- Status ---------- */
    status: {
      type: String,
      enum: ['unread', 'read', 'replied', 'archived'],
      default: 'unread',
      index: true,
    },

    /* ---------- Replies ---------- */
    replies: {
      type: [ReplySchema],
      default: [],
    },

    repliedAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

/* ============================================================
   INDEXES
   ============================================================ */

MessageSchema.index({ academyId: 1, createdAt: -1 });
MessageSchema.index({ studentUserId: 1, createdAt: -1 });
MessageSchema.index({ status: 1, academyId: 1 });

/* ============================================================
   EXPORT
   ============================================================ */

if (models.Message) {
  delete (mongoose.models as any).Message;
}

const Message = model('Message', MessageSchema);

export default Message;