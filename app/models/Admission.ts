// app/models/Admission.ts

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAdmission extends Document {
  _id: Types.ObjectId;
  name: string;
  fatherName: string;
  gender: 'male' | 'female' | 'other';
  country: string;
  email: string;
  contactNumber: string; // اب لازمی ہے
  dateOfBirth: Date;
  feeAmount: number;
  feeCurrency: string;
  preferredTiming: string;
  selectedCourse: string;
  additionalNotes?: string;
  platform: 'whatsapp' | 'zoom' | 'google-meet' | 'skype' | 'telegram' | 'other';
  assignedTeacher?: string;
  currentStatus: 'pending' | 'contacted' | 'enrolled' | 'in-progress' | 'completed' | 'dropped';
  courseCompleted: boolean;
  completionDate?: Date;
  startDate?: Date;
  classLink?: string;
  meetingId?: string;
  meetingPassword?: string;
  adminNotes?: string;
  referredByType?: 'owner' | 'teacher' | null;
  referredById?: Types.ObjectId | null;
  referralCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdmissionSchema: Schema<IAdmission> = new Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
    fatherName: { type: String, required: [true, "Father's name is required"], trim: true, maxlength: 100 },
    gender: { type: String, required: [true, 'Gender is required'], enum: ['male', 'female', 'other'] },
    country: { type: String, required: [true, 'Country is required'], trim: true },
    email: { 
      type: String, 
      required: [true, 'Email is required'], 
      trim: true, 
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    contactNumber: {
      type: String,
      required: [true, 'WhatsApp number is required'],
      trim: true,
      // آپ چاہیں تو یہاں پاکستانی نمبر کی ویلیڈیشن بھی لگا سکتے ہیں
      // match: [/^(\+92|0)[0-9]{10}$/, 'Please enter a valid Pakistani WhatsApp number']
    },
    dateOfBirth: { type: Date, required: [true, 'Date of birth is required'] },
    feeAmount: { type: Number, required: [true, 'Fee amount is required'], min: [0, 'Fee cannot be negative'] },
    feeCurrency: { 
      type: String, 
      required: [true, 'Currency is required'], 
      enum: ['USD', 'PKR', 'EUR', 'GBP', 'SAR', 'AED'],
      default: 'PKR'
    },
    preferredTiming: { type: String, required: [true, 'Preferred timing is required'], trim: true },
    selectedCourse: { type: String, required: [true, 'Course selection is required'] },
    additionalNotes: { type: String, maxlength: 500 },
    platform: {
      type: String,
      required: [true, 'Platform is required'],
      enum: ['whatsapp', 'zoom', 'google-meet', 'skype', 'telegram', 'other'],
      default: 'whatsapp'
    },
    assignedTeacher: { type: String, trim: true },
    currentStatus: {
      type: String,
      enum: ['pending', 'contacted', 'enrolled', 'in-progress', 'completed', 'dropped'],
      default: 'pending'
    },
    courseCompleted: { type: Boolean, default: false },
    completionDate: { type: Date },
    startDate: { type: Date },
    classLink: { type: String, trim: true },
    meetingId: { type: String, trim: true },
    meetingPassword: { type: String, trim: true },
    adminNotes: { type: String, maxlength: 2000 },
    referredByType: { type: String, enum: ['owner', 'teacher', null], default: null },
    referredById: { type: Schema.Types.ObjectId, refPath: 'referredByType', default: null },
    referralCode: { type: String, trim: true, uppercase: true }, // اختیاری
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
AdmissionSchema.index({ email: 1 });
AdmissionSchema.index({ contactNumber: 1 });
AdmissionSchema.index({ referralCode: 1 });
AdmissionSchema.index({ currentStatus: 1 });
AdmissionSchema.index({ createdAt: -1 });

const Admission = mongoose.models.Admission || mongoose.model<IAdmission>('Admission', AdmissionSchema);

export default Admission;