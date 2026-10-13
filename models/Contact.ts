import mongoose, { Schema, Model, Types } from 'mongoose';

export type ContactType = 'platform' | 'email' | 'phone';

export interface IContact extends mongoose.Document {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;

  contactId?: Types.ObjectId;

  type: ContactType;

  email?: string;
  phone?: string;

  name: string;
  nickname?: string;

  isFavorite: boolean;
  savedAt: Date;

  isSaved: boolean;

  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount: number;

  invited: boolean;
  invitedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContact>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    contactId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: undefined,   // ✅ null نہیں، undefined
    },

    type: {
      type: String,
      enum: ['platform', 'email', 'phone'],
      default: 'platform',
      index: true,
    },

    /* ✅ default: undefined تاکہ missing رہے، null نہ ہو */
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: undefined,
    },

    phone: {
      type: String,
      trim: true,
      default: undefined,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },

    nickname: {
      type: String,
      default: '',
      trim: true,
      maxlength: 60,
    },

    isFavorite: {
      type: Boolean,
      default: false,
    },

    savedAt: {
      type: Date,
      default: Date.now,
    },

    isSaved: {
      type: Boolean,
      default: true,
      index: true,
    },

    lastMessage: {
      type: String,
      default: '',
    },

    lastMessageAt: {
      type: Date,
      default: null,
    },

    unreadCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    invited: {
      type: Boolean,
      default: false,
    },

    invitedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, versionKey: false }
);

/* ============================================================
   INDEXES
   ============================================================
   ⚠️ sparse: true کا مسئلہ:
   sparse صرف اُس وقت skip کرتا ہے جب تمام indexed fields MISSING ہوں۔
   ownerId ہمیشہ موجود ہوتا ہے، اس لیے email: null والے documents
   unique constraint توڑ دیتے ہیں۔

   ✅ حل: partialFilterExpression استعمال کریں
   ============================================================ */

/* ایک owner کے لیے صرف ایک platform contactId (اگر موجود ہو) */
ContactSchema.index(
  { ownerId: 1, contactId: 1 },
  {
    unique: true,
    partialFilterExpression: { contactId: { $exists: true, $type: 'objectId' } },
  }
);

/* ایک owner کے لیے صرف ایک email (اگر موجود ہو اور non-empty ہو) */
ContactSchema.index(
  { ownerId: 1, email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      email: { $exists: true, $type: 'string', $ne: '' },
    },
  }
);

/* ایک owner کے لیے صرف ایک phone (اگر موجود ہو اور non-empty ہو) */
ContactSchema.index(
  { ownerId: 1, phone: 1 },
  {
    unique: true,
    partialFilterExpression: {
      phone: { $exists: true, $type: 'string', $ne: '' },
    },
  }
);

/* Chat list sorting */
ContactSchema.index({ ownerId: 1, lastMessageAt: -1 });
ContactSchema.index({ ownerId: 1, isSaved: 1, lastMessageAt: -1 });

const Contact: Model<IContact> =
  (mongoose.models.Contact as Model<IContact>) ||
  mongoose.model<IContact>('Contact', ContactSchema);

export default Contact;