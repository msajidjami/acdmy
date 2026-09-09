import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
{
name: {
type: String,
required: true,
trim: true,
},


email: {
  type: String,
  required: true,
  unique: true,
  lowercase: true,
  trim: true,
},

password: {
  type: String,
  required: true,
},

role: {
  type: String,

  enum: [
    'admin',
    'owner',
    'teacher',
    'user',
    'student',
  ],

  required: true,

  default: 'student',
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

export default mongoose.models.User ||
mongoose.model('User', UserSchema);
