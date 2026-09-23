import mongoose, { Schema, Model, Types } from 'mongoose';

export type SpeakerRole = 'teacher' | 'student';
export type FlagSeverity = 'low' | 'medium' | 'high';
export type FlagCategory =
  | 'phone_number'
  | 'poaching'
  | 'external_link'
  | 'suspicious_contact';

export interface ITranscriptMessage {
  _id?: Types.ObjectId;
  speakerRole: SpeakerRole;
  speakerName: string;
  text: string;
  isFinal: boolean;
  timestamp: Date;
  flagCategories: FlagCategory[];
}

export interface ITranscriptFlag {
  _id?: Types.ObjectId;
  severity: FlagSeverity;
  category: FlagCategory;
  reason: string;
  matchedText: string;
  speakerRole: SpeakerRole;
  timestamp: Date;
}

export interface IClassTranscript {
  _id?: Types.ObjectId;

  /* ✅ Assignment-based linkage */
  assignmentId: Types.ObjectId;   // ref: Assignment
  academyId: Types.ObjectId;      // ref: Academy (from Assignment)
  ownerId: Types.ObjectId;        // ✅ Owner — Academy.ownerId سے
  teacherId: Types.ObjectId;      // ref: Teacher
  studentId: Types.ObjectId;      // ref: Student
  courseId: Types.ObjectId;       // ref: Course

  roomName: string;

  /* Snapshots (listing کے لیے تیز رفتار) */
  teacherName: string;
  teacherEmail: string;
  studentName: string;
  courseName: string;

  startedAt: Date;
  endedAt: Date | null;
  durationSec: number;

  messages: ITranscriptMessage[];
  flags: ITranscriptFlag[];

  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<ITranscriptMessage>(
  {
    speakerRole: { type: String, enum: ['teacher', 'student'], required: true },
    speakerName: { type: String, default: 'Unknown' },
    text: { type: String, required: true },
    isFinal: { type: Boolean, default: true },
    timestamp: { type: Date, default: Date.now },
    flagCategories: { type: [String], default: [] },
  },
  { _id: true }
);

const FlagSchema = new Schema<ITranscriptFlag>(
  {
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    category: { type: String, default: 'suspicious_contact' },
    reason: { type: String, default: '' },
    matchedText: { type: String, default: '' },
    speakerRole: { type: String, enum: ['teacher', 'student'], default: 'teacher' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ClassTranscriptSchema = new Schema<IClassTranscript>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
    academyId:    { type: Schema.Types.ObjectId, ref: 'Academy',    required: true, index: true },
    ownerId:      { type: Schema.Types.ObjectId, ref: 'User',       required: true, index: true },
    teacherId:    { type: Schema.Types.ObjectId, ref: 'Teacher',    required: true, index: true },
    studentId:    { type: Schema.Types.ObjectId, ref: 'Student',    required: true, index: true },
    courseId:     { type: Schema.Types.ObjectId, ref: 'Course',     required: true, index: true },

    roomName: { type: String, required: true, index: true },

    teacherName:  { type: String, default: '' },
    teacherEmail: { type: String, default: '' },
    studentName:  { type: String, default: '' },
    courseName:   { type: String, default: '' },

    startedAt: { type: Date, default: Date.now },
    endedAt:   { type: Date, default: null },
    durationSec: { type: Number, default: 0 },

    messages: { type: [MessageSchema], default: [] },
    flags:    { type: [FlagSchema],    default: [] },
  },
  { timestamps: true, collection: 'class_transcripts', versionKey: false }
);

/* Indexes */
ClassTranscriptSchema.index({ ownerId: 1, createdAt: -1 });
ClassTranscriptSchema.index({ academyId: 1, createdAt: -1 });
ClassTranscriptSchema.index({ assignmentId: 1, createdAt: -1 });
ClassTranscriptSchema.index({ teacherId: 1, createdAt: -1 });
ClassTranscriptSchema.index({ 'flags.0': 1 });

export const ClassTranscript: Model<IClassTranscript> =
  (mongoose.models.ClassTranscript as Model<IClassTranscript>) ||
  mongoose.model<IClassTranscript>('ClassTranscript', ClassTranscriptSchema);