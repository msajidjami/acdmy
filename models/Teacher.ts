import mongoose, { Schema, models } from 'mongoose';

const TeacherSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    subjects: [{ type: String }],
    academyId: { type: Schema.Types.ObjectId, ref: 'Academy', required: true },
    isAvailable: { type: Boolean, default: true },
    profileImage: { type: String, default: '' },
    bio: { type: String, default: '' },
    audioUrl: { type: String, default: '' },
    // ✅ referralCode شامل کریں – منفرد، sparse، اور ڈیفالٹ جنریٹر
    referralCode: {
      type: String,
      unique: true,
      sparse: true, // null کو انڈیکس میں شامل نہیں کرے گا
      default: function() {
        // 8 حروف کا بے ترتیب کوڈ
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      },
    },
  },
  { timestamps: true }
);

export default models.Teacher || mongoose.model('Teacher', TeacherSchema);