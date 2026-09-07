
import mongoose, {
  Schema,
  models,
  model,
} from 'mongoose';

const ZoomConnectionSchema = new Schema(
  {
    // ==================================================
    // Academy
    // ==================================================

    academyId: {
      type: Schema.Types.ObjectId,
      ref: 'Academy',
      required: true,
      index: true,
    },

    // ==================================================
    // Teacher
    // ==================================================

    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
      index: true,
    },

    // ==================================================
    // Zoom connection status
    // ==================================================

    zoomConnected: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ==================================================
    // Zoom user information
    // ==================================================

    zoomUserId: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },

    zoomAccountId: {
      type: String,
      default: '',
      trim: true,
    },

    zoomEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },

    // ==================================================
    // Zoom OAuth tokens
    // ==================================================

    /*
     * یہ دونوں tokens database میں محفوظ ہوں گے،
     * لیکن default queries میں واپس نہیں آئیں گے۔
     */

    zoomAccessToken: {
      type: String,
      default: '',
      trim: true,
      select: false,
    },

    zoomRefreshToken: {
      type: String,
      default: '',
      trim: true,
      select: false,
    },

    // ==================================================
    // Token expiry
    // ==================================================

    zoomTokenExpiresAt: {
      type: Date,
      default: null,
    },

    // ==================================================
    // OAuth scopes
    // ==================================================

    zoomScope: {
      type: String,
      default: '',
      trim: true,
    },
  },

  {
    timestamps: true,
  }
);

// ======================================================
// One Zoom connection per academy + teacher
// ======================================================

ZoomConnectionSchema.index(
  {
    academyId: 1,
    teacherId: 1,
  },
  {
    unique: true,
  }
);

// ======================================================
// Prevent model recompilation in Next.js
// ======================================================

const ZoomConnection =
  models.ZoomConnection ||
  model(
    'ZoomConnection',
    ZoomConnectionSchema
  );

// ======================================================
// Default export
// ======================================================

export default ZoomConnection;

