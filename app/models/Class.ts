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

    title: String,

    date: Date,

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

    status: {
      type: String,
      enum: [
        "scheduled",
        "live",
        "completed",
        "cancelled",
      ],
      default: "scheduled",
    },

    notes: String,

  },
  {
    timestamps: true,
  }
);

export default
mongoose.models.Class ||
mongoose.model("Class", ClassSchema);