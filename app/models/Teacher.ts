import mongoose, { Schema } from "mongoose";

const TeacherSchema = new Schema(
  {
    fullName: {
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

    phone: {
      type: String,
      default: "",
    },

    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
    },

    avatar: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
    },

    qualification: {
      type: String,
      default: "",
    },

    experience: {
      type: Number,
      default: 0,
    },

    languages: [
      {
        type: String,
      },
    ],

    subjects: [
      {
        type: String,
      },
    ],

    country: {
      type: String,
      default: "",
    },

    city: {
      type: String,
      default: "",
    },

    timezone: {
      type: String,
      default: "",
    },

    zoomEmail: {
      type: String,
      default: "",
    },

    introAudio: {
      type: String,
      default: "",
    },

    introVideo: {
      type: String,
      default: "",
    },

    certificates: [
      {
        type: String,
      },
    ],

    hourlyRate: {
      type: Number,
      default: 0,
    },

    rating: {
      type: Number,
      default: 5,
    },

    totalStudents: {
      type: Number,
      default: 0,
    },

    totalClasses: {
      type: Number,
      default: 0,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Teacher ||
mongoose.model("Teacher", TeacherSchema);