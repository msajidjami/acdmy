"use client";
import { Clock, Calendar, User, BookOpen, Video, FileText } from "lucide-react";

interface ClassCardProps {
  classData: any;
  onDetails: () => void;
}

export default function ClassCard({ classData, onDetails }: ClassCardProps) {
  const date = new Date(classData.date);
  const now = new Date();
  const isLive = classData.status === "live";
  const isScheduled = classData.status === "scheduled";
  const isLate = classData.isLateStudent || classData.isLateTeacher;

  return (
    <div className="bg-white rounded-2xl shadow hover:shadow-xl transition p-5 border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800">{classData.title}</h3>
          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
            <BookOpen size={16} /> {classData.course?.title || "Course"}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            isLive
              ? "bg-green-100 text-green-700"
              : classData.status === "completed"
              ? "bg-gray-100 text-gray-600"
              : classData.status === "cancelled"
              ? "bg-red-100 text-red-600"
              : "bg-blue-100 text-blue-600"
          }`}
        >
          {isLive ? "Live 🔴" : classData.status}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          {date.toLocaleDateString()} at {date.toLocaleTimeString()}
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-gray-400" />
          {classData.duration} min
        </div>
        <div className="flex items-center gap-2">
          <User size={16} className="text-gray-400" />
          {classData.teacher?.name || "Teacher"}
        </div>
        {classData.meetingLink && (
          <div className="flex items-center gap-2">
            <Video size={16} className="text-gray-400" />
            <a
              href={classData.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline"
            >
              Join Meeting
            </a>
          </div>
        )}
      </div>

      {isLate && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700 flex items-center gap-1">
          <Clock size={14} />
          {classData.isLateStudent
            ? "You are late! Please contact your teacher on WhatsApp."
            : "Teacher is running late. Please wait or contact them on WhatsApp."}
        </div>
      )}

      <button
        onClick={onDetails}
        className="mt-4 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
      >
        View Details
      </button>
    </div>
  );
}