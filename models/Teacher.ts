import mongoose, { Schema, models } from 'mongoose';

const TeacherSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    gender: {
      type: String,
      enum: ['male', 'female'],
      required: true,
      default: 'male',
    },

    subjects: [{ type: String }],

    academyId: {
      type: Schema.Types.ObjectId,
      ref: 'Academy',
      required: true,
    },

    isAvailable: { type: Boolean, default: true },

    /* تصویر صرف Male کے لیے */
    profileImage: { type: String, default: '' },

    bio: { type: String, default: '' },

    /* 🎤 Audio — لازمی */
    audioUrl: { type: String, required: true },

    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      default: function () {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
          code += chars.charAt(
            Math.floor(Math.random() * chars.length)
          );
        }
        return code;
      },
    },
  },
  { timestamps: true }
);

export default models.Teacher ||
  mongoose.model('Teacher', TeacherSchema);