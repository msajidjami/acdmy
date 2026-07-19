import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
  studentId: string;
  courseId: string;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'excused';
  markedBy: string; // teacher ID
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    studentId: { type: String, required: true },
    courseId: { type: String, required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      default: 'absent',
    },
    markedBy: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Attendance ||
  mongoose.model<IAttendance>('Attendance', AttendanceSchema);