
import mongoose, {
  Schema,
  models,
  model,
} from 'mongoose';

const AcademySchema = new Schema(
  {
    /*
     * ========================================================
     * OWNER
     * ========================================================
     */

    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    /*
     * ========================================================
     * BASIC ACADEMY INFORMATION
     * ========================================================
     */

    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    logo: {
      type: String,
      default: '',
      trim: true,
    },

    address: {
      type: String,
      default: '',
      trim: true,
    },

    contactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    /*
     * ========================================================
     * ZOOM
     * ========================================================
     *
     * IMPORTANT:
     *
     * Teacher کا email یہاں استعمال نہیں ہوگا۔
     *
     * Academy کے Zoom account میں جس user کے نام پر
     * meetings بنانی ہیں، اس کا اصل Zoom user ID یہاں
     * محفوظ ہوگا۔
     *
     * مثال:
     *
     * zoomHostUserId = "ZXY333"
     *
     */

    zoomConnected: {
      type: Boolean,
      default: false,
      index: true,
    },

    /*
     * Zoom Account ID
     *
     * یہ آپ کے Server-to-Server OAuth app کا
     * Account ID ہے۔
     */
    zoomAccountId: {
      type: String,
      default: '',
      trim: true,
    },

    /*
     * Zoom Host User ID
     *
     * یہی ID create-meeting API استعمال کرے گی:
     *
     * /users/{zoomHostUserId}/meetings
     */
    zoomHostUserId: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },

    /*
     * Host کا email صرف معلومات کے لیے محفوظ ہے۔
     *
     * Meeting creation کے لیے email استعمال نہیں ہوگا۔
     */
    zoomHostEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * ============================================================
 * INDEXES
 * ============================================================
 */

AcademySchema.index({
  ownerId: 1,
  isActive: 1,
});

AcademySchema.index({
  zoomHostUserId: 1,
});

/*
 * ============================================================
 * MODEL
 * ============================================================
 */

const Academy =
  models.Academy ||
  model(
    'Academy',
    AcademySchema
  );

export default Academy;

