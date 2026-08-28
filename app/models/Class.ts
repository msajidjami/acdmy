import mongoose, { Schema } from "mongoose";

const ClassSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      default: 30,
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    meetingProvider: {
      type: String,
      enum: ["zoom", "google-meet"],
      default: "zoom",
    },
    meetingId: String,
    meetingPassword: String,
    meetingLink: String,
    syllabusFiles: [
      {
        fileName: String,
        fileUrl: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ["scheduled", "live", "completed", "cancelled"],
      default: "scheduled",
    },
    notes: String,
    // لیتنس ٹریکنگ کے لیے
    studentJoinedAt: Date,
    teacherJoinedAt: Date,
    isLateStudent: { type: Boolean, default: false },
    isLateTeacher: { type: Boolean, default: false },
    lateNotificationSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Class || mongoose.model("Class", ClassSchema);