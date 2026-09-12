'use client';

import dynamic from 'next/dynamic';
import ClassroomErrorBoundary from './ClassroomErrorBoundary';

const TeacherZoomClassroom = dynamic(
  () => import('./TeacherZoomClassroom'),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-3xl bg-slate-900 min-h-[600px] flex items-center justify-center border border-slate-800">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full border-4 border-white/10 border-t-sky-400 animate-spin mb-3" />
          <p className="text-white/60 text-sm">Loading classroom…</p>
        </div>
      </div>
    ),
  }
);

type Props = {
  assignmentId: string;
  meetingNumber: string;
  password: string;
  teacherName: string;
  teacherEmail: string;
  courseName: string;
  studentName: string;
  courseId?: string;
  totalPages?: number;
  pagesCompletedSoFar?: number;
};

export default function TeacherClassroomLoader(props: Props) {
  return (
    <ClassroomErrorBoundary fallbackTitle="Zoom classroom failed to load">
      <TeacherZoomClassroom {...props} />
    </ClassroomErrorBoundary>
  );
}