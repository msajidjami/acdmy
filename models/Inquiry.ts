import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/* ============================================================
   TYPES
   ============================================================ */

export type InquiryStatus = 'pending' | 'read' | 'replied';
export type ReplySender = 'user' | 'owner' | 'bot';

export interface IReply {
  _id?: Types.ObjectId;
  senderType: ReplySender;
  senderName: string;
  senderId?: Types.ObjectId | null;
  text: string;
  createdAt: Date;
}

export interface IInquiry extends Document {
  _id: Types.ObjectId;
  academyId: Types.ObjectId;
  teacherId?: Types.ObjectId | null;
  visitorName: string;
  visitorEmail: string;
  message: string;

  /* ✅ Chat replies */
  replies: IReply[];

  /* ✅ Owner notes + reply tracking */
  notes?: string;
  repliedAt?: Date | null;
  repliedBy?: Types.ObjectId | null;

  status: InquiryStatus;
  createdAt: Date;
  updatedAt: Date;
}

/* ============================================================
   REPLY SUB-SCHEMA
   ============================================================ */

const ReplySchema = new Schema<IReply>(
  {
    senderType: {
      type: String,
      enum: ['user', 'owner', 'bot'],
      required: true,
    },
    senderName: { type: String, default: '', trim: true, maxlength: 100 },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

/* ============================================================
   MAIN SCHEMA
   ============================================================ */

const InquirySchema = new Schema<IInquiry>(
  {
    academyId: {
      type: Schema.Types.ObjectId,
      ref: 'Academy',
      required: true,
      index: true,
    },

    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
      index: true,
    },

    visitorName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    visitorEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 200,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    /* ✅ Chat replies array */
    replies: {
      type: [ReplySchema],
      default: [],
    },

    /* ✅ Owner notes (private) */
    notes: {
      type: String,
      default: '',
      trim: true,
      maxlength: 5000,
    },

    /* ✅ Reply tracking */
    repliedAt: {
      type: Date,
      default: null,
    },

    repliedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    status: {
      type: String,
      enum: ['pending', 'read', 'replied'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* ============================================================
   INDEXES
   ============================================================ */

InquirySchema.index({ academyId: 1, createdAt: -1 });
InquirySchema.index({ academyId: 1, status: 1 });
InquirySchema.index({ visitorEmail: 1 });

/* ============================================================
   CACHE-SAFE EXPORT
   ============================================================ */

let Inquiry: Model<IInquiry>;

if (mongoose.models.Inquiry) {
  delete mongoose.models.Inquiry;
}

Inquiry = mongoose.model<IInquiry>('Inquiry', InquirySchema);

export default Inquiry;