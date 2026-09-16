// models/EnrollmentMessage.ts
import mongoose, { Schema, models, model, Types } from 'mongoose';

export type SenderRole = 'owner' | 'user' | 'system';

export interface IEnrollmentMessage {
  _id: Types.ObjectId;
  enrollmentId: Types.ObjectId;
  academyId: Types.ObjectId;
  senderId: Types.ObjectId | null;
  senderRole: SenderRole;
  senderName: string;
  content: string;
  readByOwner: boolean;
  readByUser: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EnrollmentMessageSchema = new Schema<IEnrollmentMessage>(
  {
    enrollmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: [true, 'Enrollment ID is required'],
      index: true,
    },
    academyId: {
      type: Schema.Types.ObjectId,
      ref: 'Academy',
      required: [true, 'Academy ID is required'],
      index: true,
    },

    /* ✅ Optional — system messages ke liye */
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    senderRole: {
      type: String,
      enum: {
        values: ['owner', 'user', 'system'],
        message: 'Sender role must be owner, user, or system',
      },
      default: 'system',
      required: true,
    },
    senderName: {
      type: String,
      default: 'System',
      trim: true,
      maxlength: 120,
    },

    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },

    readByOwner: { type: Boolean, default: false, index: true },
    readByUser: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, versionKey: false }
);

/* Indexes */
EnrollmentMessageSchema.index(
  { enrollmentId: 1, createdAt: 1 },
  { name: 'enrollment_message_timeline' }
);

EnrollmentMessageSchema.index(
  { enrollmentId: 1, senderRole: 1, readByOwner: 1 },
  { name: 'enrollment_message_owner_unread' }
);

EnrollmentMessageSchema.index(
  { enrollmentId: 1, senderRole: 1, readByUser: 1 },
  { name: 'enrollment_message_user_unread' }
);

const EnrollmentMessage =
  models.EnrollmentMessage ||
  model<IEnrollmentMessage>('EnrollmentMessage', EnrollmentMessageSchema);

export default EnrollmentMessage;