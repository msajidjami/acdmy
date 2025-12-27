import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITeacher extends Document {
  name: string;
  email: string;
  contactNumber: string;
  referralCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherSchema: Schema<ITeacher> = new Schema({
  name: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true 
  },
  contactNumber: { type: String, required: true, trim: true },
  referralCode: { 
    type: String, 
    unique: true, 
    required: true 
  },
}, { 
  timestamps: true 
});

let TeacherModel: Model<ITeacher>;

TeacherSchema.pre('save', async function () {
  if (!this.referralCode) {
    if (!TeacherModel) {
      TeacherModel = mongoose.model<ITeacher>('Teacher');
    }

    let uniqueCode = '';
    let isUnique = false;

    while (!isUnique) {
      uniqueCode = 'TEACHER-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      
      const existing = await TeacherModel.findOne({ referralCode: uniqueCode });
      if (!existing) {
        isUnique = true;
      }
    }

    this.referralCode = uniqueCode;
  }
});

export default (mongoose.models.Teacher as Model<ITeacher>) || mongoose.model<ITeacher>('Teacher', TeacherSchema);