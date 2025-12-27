// app/models/User.ts
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'نام درکار ہے'],
      trim: true,
      maxlength: [100, 'نام 100 حروف سے زیادہ نہیں ہو سکتا'],
    },
    email: {
      type: String,
      required: [true, 'ای میل درکار ہے'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@gmail\.com$/, 'صرف Gmail ای میلز کی اجازت ہے'],
    },
    password: {
      type: String,
      required: [true, 'پاس ورڈ درکار ہے'],
    },
    role: {
      type: String,
      enum: [
        'user',
        'admin',
        'education-admin',
        'darul-ifta-admin',
        'section1-admin',
        'section2-admin',
      ],
      default: 'user',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// یہ لائن لازمی ہے – پاس ورڈ چیک کرنے کا میتھڈ
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// ماڈل رجسٹر کریں
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;