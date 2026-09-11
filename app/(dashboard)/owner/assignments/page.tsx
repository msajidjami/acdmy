'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';

import { toast } from 'react-hot-toast';

import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  UserIcon,
  BookOpenIcon,
  CalendarIcon,
  ClockIcon,
  VideoCameraIcon,
  CheckCircleIcon,
  LinkIcon,
  AcademicCapIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronRightIcon,
  UserGroupIcon,
  UserCircleIcon,
  LockClosedIcon,
  GlobeAltIcon,
  ArrowTopRightOnSquareIcon,
  BellAlertIcon,
  NoSymbolIcon,
  CalendarDaysIcon,
  SunIcon,
  PlayCircleIcon,
  CheckBadgeIcon,
  FireIcon,
} from '@heroicons/react/24/outline';

import ZoomLinkButton from '@/app/components/ZoomLinkButton';

/* ------------------ Types ------------------ */

interface AssignmentPerson {
  _id: string;
  name: string;
  email?: string;
}

interface AssignmentTeacher {
  _id: string;
  name: string;
  email?: string;
  subjects?: string[];
}

interface AssignmentCourse {
  _id: string;
  title: string;
}

type AssignmentStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';

type TimeStatus =
  | 'alarm' // starts in < 30 min
  | 'ongoing' // happening right now
  | 'upcoming' // later today
  | 'completed' // passed today
  | 'off'; // not scheduled today

interface Assignment {
  _id: string;
  studentId: AssignmentPerson | null;
  teacherId: AssignmentTeacher | null;
  courseId: AssignmentCourse | null;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  status: AssignmentStatus;
  notes: string;
  zoomMeetingId: string;
  zoomMeetingNumber: string;
  zoomPassword: string;
  zoomLink: string;
  zoomStartUrl: string;
  zoomHostUserId: string;
  zoomTimezone: string;
  zoomProvider: string;
  createdAt?: string;
  updatedAt?: string;
}

interface StudentOption {
  _id: string;
  name: string;
  email?: string;
}

interface TeacherOption {
  _id: string;
  name: string;
  email?: string;
  subjects?: string[];
}

interface CourseOption {
  _id: string;
  title: string;
}

interface AssignmentFormData {
  studentId: string;
  teacherId: string;
  courseId: string;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  status: AssignmentStatus;
  notes: string;
  zoomLink: string;
  zoomMeetingId: string;
  zoomMeetingNumber: string;
  zoomPassword: string;
  zoomStartUrl: string;
  zoomHostUserId: string;
  zoomTimezone: string;
  zoomProvider: string;
}

interface ApiErrorResponse {
  error?: string;
  message?: string;
  details?: string;
}

interface ZoomMeetingResponse {
  success?: boolean;
  meetingId?: string | number;
  meetingNumber?: string | number;
  id?: string | number;
  joinUrl?: string;
  join_url?: string;
  zoomLink?: string;
  startUrl?: string;
  start_url?: string;
  zoomStartUrl?: string;
  password?: string;
  meetingPassword?: string;
  hostUserId?: string | number;
  host_id?: string | number;
  timezone?: string;
  provider?: string;
}

type FilterKey =
  | 'all'
  | 'today'
  | 'alarm'
  | 'ongoing'
  | 'upcoming'
  | 'completed'
  | 'off';

/* ------------------ Constants ------------------ */

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

const DAY_SHORT: Record<string, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

const STATUS_META: Record<
  AssignmentStatus,
  { label: string; classes: string; dot: string }
> = {
  scheduled: {
    label: 'Scheduled',
    classes: 'bg-blue-50 text-blue-700 border-blue-100',
    dot: 'bg-blue-500',
  },
  ongoing: {
    label: 'Ongoing',
    classes: 'bg-amber-50 text-amber-700 border-amber-100',
    dot: 'bg-amber-500',
  },
  completed: {
    label: 'Completed',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    dot: 'bg-emerald-500',
  },
  cancelled: {
    label: 'Cancelled',
    classes: 'bg-rose-50 text-rose-700 border-rose-100',
    dot: 'bg-rose-500',
  },
};

const TIME_STATUS_META: Record<
  TimeStatus,
  {
    label: string;
    classes: string;
    dot: string;
    icon: string;
    pulse?: boolean;
  }
> = {
  alarm: {
    label: 'Starting Soon',
    classes: 'bg-orange-100 text-orange-800 border-orange-300',
    dot: 'bg-orange-500',
    icon: '🔔',
    pulse: true,
  },
  ongoing: {
    label: 'Live Now',
    classes: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dot: 'bg-emerald-500',
    icon: '🟢',
    pulse: true,
  },
  upcoming: {
    label: 'Upcoming',
    classes: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    icon: '⏰',
  },
  completed: {
    label: 'Completed',
    classes: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
    icon: '✓',
  },
  off: {
    label: 'Off Today',
    classes: 'bg-slate-50 text-slate-500 border-slate-200',
    dot: 'bg-slate-300',
    icon: '—',
  },
};

const DEFAULT_FORM_DATA: AssignmentFormData = {
  studentId: '',
  teacherId: '',
  courseId: '',
  daysOfWeek: [],
  startTime: '09:00',
  endTime: '10:00',
  status: 'scheduled',
  notes: '',
  zoomLink: '',
  zoomMeetingId: '',
  zoomMeetingNumber: '',
  zoomPassword: '',
  zoomStartUrl: '',
  zoomHostUserId: '',
  zoomTimezone: 'Asia/Karachi',
  zoomProvider: 'none',
};

/* ------------------ Helpers ------------------ */

async function readJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getApiErrorMessage(data: unknown, fallback: string): string {
  if (typeof data === 'object' && data !== null) {
    const value = data as ApiErrorResponse;
    if (typeof value.error === 'string' && value.error.trim())
      return value.error.trim();
    if (typeof value.message === 'string' && value.message.trim())
      return value.message.trim();
    if (typeof value.details === 'string' && value.details.trim())
      return value.details.trim();
  }
  return fallback;
}

function formatTime(time: string) {
  if (!time) return '--:--';
  const [hourString, minute = '00'] = time.split(':');
  const hour = Number(hourString);
  if (Number.isNaN(hour)) return time;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute} ${period}`;
}

function timeToMinutes(time: string): number {
  if (!time) return 0;
  const [h, m] = time.split(':').map((v) => Number(v));
  if (Number.isNaN(h)) return 0;
  return h * 60 + (Number.isNaN(m) ? 0 : m);
}

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getCurrentDayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Computes the current "time status" for a given assignment.
 *
 * Rules:
 *  - 'off'       → today is not in daysOfWeek
 *  - 'alarm'     → today's class starts in 0..30 min
 *  - 'ongoing'   → now is between start and end today
 *  - 'upcoming'  → today's class is later than 30 min from now
 *  - 'completed' → today's class has already ended
 */
function getTimeStatus(
  assignment: Assignment,
  now: Date
): {
  status: TimeStatus;
  minutesUntilStart: number;
  minutesUntilEnd: number;
  today: string;
} {
  const today = getCurrentDayName(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const startMin = timeToMinutes(assignment.startTime);
  const endMin = timeToMinutes(assignment.endTime);

  const isToday =
    Array.isArray(assignment.daysOfWeek) &&
    assignment.daysOfWeek.includes(today);

  if (!isToday) {
    return {
      status: 'off',
      minutesUntilStart: Infinity,
      minutesUntilEnd: Infinity,
      today,
    };
  }

  // class already ended today
  if (nowMin > endMin) {
    return {
      status: 'completed',
      minutesUntilStart: 0,
      minutesUntilEnd: 0,
      today,
    };
  }

  // currently ongoing
  if (nowMin >= startMin && nowMin <= endMin) {
    return {
      status: 'ongoing',
      minutesUntilStart: 0,
      minutesUntilEnd: endMin - nowMin,
      today,
    };
  }

  const diff = startMin - nowMin;

  // starting within 30 minutes
  if (diff <= 30 && diff > 0) {
    return {
      status: 'alarm',
      minutesUntilStart: diff,
      minutesUntilEnd: endMin - nowMin,
      today,
    };
  }

  return {
    status: 'upcoming',
    minutesUntilStart: diff,
    minutesUntilEnd: endMin - nowMin,
    today,
  };
}

function formatCountdown(min: number): string {
  if (min <= 0) return 'now';
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/* ------------------ Component ------------------ */

export default function OwnerAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generatingZoom, setGeneratingZoom] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] =
    useState<Assignment | null>(null);

  const [formData, setFormData] = useState<AssignmentFormData>({
    ...DEFAULT_FORM_DATA,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterKey, setFilterKey] = useState<FilterKey>('all');

  // Live "now" — mounted only on client to avoid hydration mismatch
  const [now, setNow] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000); // every 30s
    return () => clearInterval(id);
  }, []);

  /* ------------------ Data Fetch ------------------ */

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [
        assignmentResponse,
        studentResponse,
        teacherResponse,
        courseResponse,
      ] = await Promise.all([
        fetch('/api/owner/assignments', {
          cache: 'no-store',
          credentials: 'include',
        }),
        fetch('/api/owner/students', {
          cache: 'no-store',
          credentials: 'include',
        }),
        fetch('/api/owner/teachers', {
          cache: 'no-store',
          credentials: 'include',
        }),
        fetch('/api/owner/courses', {
          cache: 'no-store',
          credentials: 'include',
        }),
      ]);

      if (!assignmentResponse.ok) {
        const data = await readJsonResponse(assignmentResponse);
        throw new Error(
          getApiErrorMessage(data, 'Failed to load assignments.')
        );
      }

      const assignmentData = await readJsonResponse(assignmentResponse);
      setAssignments(
        Array.isArray(assignmentData) ? (assignmentData as Assignment[]) : []
      );

      if (studentResponse.ok) {
        const data = await readJsonResponse(studentResponse);
        setStudents(Array.isArray(data) ? (data as StudentOption[]) : []);
      } else setStudents([]);

      if (teacherResponse.ok) {
        const data = await readJsonResponse(teacherResponse);
        setTeachers(Array.isArray(data) ? (data as TeacherOption[]) : []);
      } else setTeachers([]);

      if (courseResponse.ok) {
        const data = await readJsonResponse(courseResponse);
        setCourses(Array.isArray(data) ? (data as CourseOption[]) : []);
      } else setCourses([]);
    } catch (error: unknown) {
      console.error('Owner assignments fetch error:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to load assignment data.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  /* ------------------ Form Actions ------------------ */

  const handleDayToggle = (day: string) => {
    setFormData((previous) => {
      const exists = previous.daysOfWeek.includes(day);
      return {
        ...previous,
        daysOfWeek: exists
          ? previous.daysOfWeek.filter((item) => item !== day)
          : [...previous.daysOfWeek, day],
      };
    });
  };

  const openAddModal = (teacherId?: string, studentId?: string) => {
    setEditingAssignment(null);
    setFormData({
      ...DEFAULT_FORM_DATA,
      teacherId: teacherId || teachers[0]?._id || '',
      studentId: studentId || students[0]?._id || '',
      courseId: courses[0]?._id || '',
    });
    setShowModal(true);
  };

  const openEditModal = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      studentId: assignment.studentId?._id || '',
      teacherId: assignment.teacherId?._id || '',
      courseId: assignment.courseId?._id || '',
      daysOfWeek: Array.isArray(assignment.daysOfWeek)
        ? assignment.daysOfWeek
        : [],
      startTime: assignment.startTime || '09:00',
      endTime: assignment.endTime || '10:00',
      status: assignment.status || 'scheduled',
      notes: assignment.notes || '',
      zoomLink: assignment.zoomLink || '',
      zoomMeetingId: assignment.zoomMeetingId || '',
      zoomMeetingNumber: assignment.zoomMeetingNumber || '',
      zoomPassword: assignment.zoomPassword || '',
      zoomStartUrl: assignment.zoomStartUrl || '',
      zoomHostUserId: assignment.zoomHostUserId || '',
      zoomTimezone: assignment.zoomTimezone || 'Asia/Karachi',
      zoomProvider: assignment.zoomProvider || 'none',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (submitting || generatingZoom) return;
    setShowModal(false);
    setEditingAssignment(null);
    setFormData({ ...DEFAULT_FORM_DATA });
  };

  const validateForm = () => {
    if (!formData.teacherId) {
      toast.error('Please select a teacher.');
      return false;
    }
    if (!formData.studentId) {
      toast.error('Please select a student.');
      return false;
    }
    if (!formData.courseId) {
      toast.error('Please select a course.');
      return false;
    }
    if (formData.daysOfWeek.length === 0) {
      toast.error('Please select at least one day.');
      return false;
    }
    if (!formData.startTime || !formData.endTime) {
      toast.error('Please select class start and end time.');
      return false;
    }
    if (formData.endTime <= formData.startTime) {
      toast.error('End time must be after start time.');
      return false;
    }
    return true;
  };

  /* ------------------ Zoom Generation ------------------ */

  const generateZoomMeeting = async () => {
    if (!validateForm()) return;

    const teacher = teachers.find((item) => item._id === formData.teacherId);
    const student = students.find((item) => item._id === formData.studentId);
    const course = courses.find((item) => item._id === formData.courseId);

    if (!teacher || !student || !course) {
      toast.error('Selected teacher, student, or course was not found.');
      return;
    }

    setGeneratingZoom(true);

    try {
      const topic = `${course.title} - ${student.name} & ${teacher.name}`;
      const agenda = `Class for ${course.title}. Student: ${student.name}. Teacher: ${teacher.name}.`;

      const response = await fetch('/api/zoom/create-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          topic,
          agenda,
          startTime: formData.startTime,
          endTime: formData.endTime,
          daysOfWeek: formData.daysOfWeek,
          timezone: 'Asia/Karachi',
          teacherEmail: teacher.email || '',
          teacherId: teacher._id,
          studentId: student._id,
          courseId: course._id,
        }),
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            data,
            `Failed to create Zoom meeting (HTTP ${response.status}).`
          )
        );
      }

      const zoomData = (data || {}) as ZoomMeetingResponse;

      const meetingId = String(
        zoomData.meetingId ?? zoomData.id ?? ''
      ).trim();
      const meetingNumber = String(
        zoomData.meetingNumber ?? zoomData.id ?? zoomData.meetingId ?? ''
      ).trim();
      const joinUrl = String(
        zoomData.joinUrl ?? zoomData.join_url ?? zoomData.zoomLink ?? ''
      ).trim();
      const startUrl = String(
        zoomData.startUrl ?? zoomData.start_url ?? zoomData.zoomStartUrl ?? ''
      ).trim();
      const password = String(
        zoomData.password ?? zoomData.meetingPassword ?? ''
      ).trim();
      const hostUserId = String(
        zoomData.hostUserId ?? zoomData.host_id ?? ''
      ).trim();
      const timezone = String(zoomData.timezone || 'Asia/Karachi').trim();
      const provider = String(zoomData.provider || 'zoom').trim();

      if (!meetingId)
        throw new Error(
          'Zoom meeting was created but no Meeting ID was returned.'
        );
      if (!meetingNumber)
        throw new Error(
          'Zoom meeting was created but no Meeting Number was returned.'
        );
      if (!joinUrl)
        throw new Error(
          'Zoom meeting was created but no participant Join URL was returned.'
        );

      setFormData((previous) => ({
        ...previous,
        zoomLink: joinUrl,
        zoomMeetingId: meetingId,
        zoomMeetingNumber: meetingNumber,
        zoomPassword: password,
        zoomStartUrl: startUrl,
        zoomHostUserId: hostUserId,
        zoomTimezone: timezone,
        zoomProvider: provider,
      }));

      toast.success(
        startUrl
          ? 'Zoom meeting created. Student Join URL and Teacher Host URL are ready.'
          : 'Zoom meeting created, but the Teacher Host Start URL was not returned.'
      );
    } catch (error: unknown) {
      console.error('Zoom meeting creation error:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to create Zoom meeting.';
      const lowerMessage = message.toLowerCase();

      if (
        lowerMessage.includes('connect timeout') ||
        lowerMessage.includes('zoom.us:443') ||
        lowerMessage.includes('api.zoom.us:443') ||
        lowerMessage.includes('unable to connect') ||
        lowerMessage.includes('network') ||
        lowerMessage.includes('etimedout') ||
        lowerMessage.includes('fetch failed')
      ) {
        toast.error(
          'Server cannot connect to Zoom. Check server internet access, DNS, firewall/VPN and outbound HTTPS (443).',
          { duration: 6000 }
        );
      } else {
        toast.error(message, { duration: 5000 });
      }
    } finally {
      setGeneratingZoom(false);
    }
  };

  /* ------------------ Submit / Delete ------------------ */

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);

    const payload = {
      studentId: formData.studentId,
      teacherId: formData.teacherId,
      courseId: formData.courseId,
      daysOfWeek: formData.daysOfWeek,
      startTime: formData.startTime,
      endTime: formData.endTime,
      status: formData.status,
      notes: formData.notes.trim(),
      zoomMeetingId: formData.zoomMeetingId,
      zoomMeetingNumber: formData.zoomMeetingNumber,
      zoomPassword: formData.zoomPassword,
      zoomLink: formData.zoomLink,
      zoomStartUrl: formData.zoomStartUrl,
      zoomHostUserId: formData.zoomHostUserId,
      zoomTimezone: formData.zoomTimezone || 'Asia/Karachi',
      zoomProvider: formData.zoomProvider || 'none',
    };

    try {
      const isEditing = Boolean(editingAssignment);
      let url = '/api/owner/assignments';
      let method: 'POST' | 'PUT' = 'POST';

      if (isEditing && editingAssignment) {
        url = `/api/owner/assignments/${editingAssignment._id}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify(payload),
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(data, 'Failed to save assignment.')
        );
      }

      toast.success(
        isEditing
          ? 'Assignment updated successfully.'
          : 'Assignment created successfully.'
      );

      setShowModal(false);
      setEditingAssignment(null);
      setFormData({ ...DEFAULT_FORM_DATA });
      await fetchData();
    } catch (error: unknown) {
      console.error('Assignment save error:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to save assignment.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      const response = await fetch(`/api/owner/assignments/${assignmentId}`, {
        method: 'DELETE',
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(data, 'Failed to delete assignment.')
        );
      }

      setAssignments((previous) =>
        previous.filter((item) => item._id !== assignmentId)
      );
      toast.success('Assignment deleted successfully.');
    } catch (error: unknown) {
      console.error('Delete assignment error:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to delete assignment.';
      toast.error(message);
    }
  };

  /* ------------------ Derived ------------------ */

  const assignedStudentIds = useMemo(() => {
    return new Set(
      assignments
        .map((a) => a.studentId?._id)
        .filter((id): id is string => Boolean(id))
    );
  }, [assignments]);

  const assignedStudentsCount = assignedStudentIds.size;
  const unassignedStudentsCount = Math.max(
    0,
    students.length - assignedStudentsCount
  );

  const zoomAssignmentsCount = assignments.filter(
    (a) => Boolean(a.zoomLink || a.zoomMeetingNumber)
  ).length;

  const scheduledAssignmentsCount = assignments.filter(
    (a) => a.status === 'scheduled'
  ).length;

  const canCreateAssignment =
    teachers.length > 0 && students.length > 0 && courses.length > 0;

  const canGenerateZoom = Boolean(
    formData.teacherId &&
      formData.studentId &&
      formData.courseId &&
      formData.daysOfWeek.length > 0 &&
      formData.startTime &&
      formData.endTime &&
      formData.endTime > formData.startTime
  );

  /* =========================================================
     TIME-AWARE DERIVED DATA
  ========================================================= */

  // Map each assignment to its time status
  const assignmentTimeStatuses = useMemo(() => {
    if (!now) return new Map<string, TimeStatus>();
    const map = new Map<string, TimeStatus>();
    for (const a of assignments) {
      map.set(a._id, getTimeStatus(a, now).status);
    }
    return map;
  }, [assignments, now]);

  // Today's classes (sorted by start time) with status
  const todaysClasses = useMemo(() => {
    if (!now) return [];
    const today = getCurrentDayName(now);
    return assignments
      .filter((a) => a.daysOfWeek.includes(today))
      .map((a) => ({
        assignment: a,
        info: getTimeStatus(a, now),
      }))
      .sort(
        (x, y) =>
          timeToMinutes(x.assignment.startTime) -
          timeToMinutes(y.assignment.startTime)
      );
  }, [assignments, now]);

  const todaysAlarms = todaysClasses.filter(
    (c) => c.info.status === 'alarm'
  );
  const todaysOngoing = todaysClasses.filter(
    (c) => c.info.status === 'ongoing'
  );
  const todaysUpcoming = todaysClasses.filter(
    (c) => c.info.status === 'upcoming'
  );
  const todaysCompleted = todaysClasses.filter(
    (c) => c.info.status === 'completed'
  );

  // Off days for today (classes NOT scheduled today)
  const todaysOff = useMemo(() => {
    if (!now) return [];
    const today = getCurrentDayName(now);
    return assignments.filter((a) => !a.daysOfWeek.includes(today));
  }, [assignments, now]);

  const currentDayName = now ? getCurrentDayName(now) : '';
  const currentClock = now
    ? `${String(now.getHours() % 12 === 0 ? 12 : now.getHours() % 12).padStart(
        2,
        '0'
      )}:${String(now.getMinutes()).padStart(2, '0')} ${
        now.getHours() >= 12 ? 'PM' : 'AM'
      }`
    : '';

  // Filtered teachers for the main list
  const filteredTeachers = useMemo(() => {
    let result = teachers;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.email?.toLowerCase().includes(q)
      );
    }

    if (filterKey !== 'all' && filterKey !== 'off' && now) {
      result = result.filter((teacher) =>
        assignments.some((a) => {
          if (a.teacherId?._id !== teacher._id) return false;
          const status = assignmentTimeStatuses.get(a._id);
          if (filterKey === 'today') return status !== 'off';
          return status === filterKey;
        })
      );
    }

    return result;
  }, [
    teachers,
    searchQuery,
    filterKey,
    assignments,
    assignmentTimeStatuses,
    now,
  ]);

  const filteredStudents = useMemo(() => {
    let result = students;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q)
      );
    }

    if (filterKey !== 'all' && now) {
      const ids = new Set<string>();
      for (const a of assignments) {
        const sid = a.studentId?._id;
        if (!sid) continue;
        const status = assignmentTimeStatuses.get(a._id);
        const matches =
          filterKey === 'today'
            ? status !== 'off'
            : status === filterKey;
        if (matches) ids.add(sid);
      }
      result = result.filter((s) => ids.has(s._id));
    }

    return result;
  }, [
    students,
    searchQuery,
    filterKey,
    assignments,
    assignmentTimeStatuses,
    now,
  ]);

  /* ------------------ Loading ------------------ */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600 mx-auto" />
          <p className="text-slate-500 mt-4 text-sm font-medium">
            Loading assignments...
          </p>
        </div>
      </div>
    );
  }

  /* ------------------ Render ------------------ */

  return (
    <div dir="ltr" className="space-y-6 sm:space-y-8">
      {/* ============================================
          HERO HEADER
      ============================================ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-700 to-fuchsia-700 p-6 sm:p-8 shadow-xl">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-16 -right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-purple-300 rounded-full blur-3xl" />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0 shadow-lg">
              <ClipboardDocumentListIcon className="h-7 w-7 text-white" />
            </div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-white/90 text-xs font-semibold">
                <SparklesIcon className="h-3 w-3" />
                Class Management
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-white leading-tight">
                Assignments
              </h1>
              <p className="mt-1 text-white/80 text-sm sm:text-base max-w-lg">
                Assign teachers, schedule weekly classes, and manage Zoom
                meetings in one place.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            {mounted && now && (
              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 backdrop-blur border border-white/20 rounded-xl text-white text-sm font-semibold whitespace-nowrap">
                <SunIcon className="h-4 w-4" />
                {currentDayName} · {currentClock}
              </div>
            )}

            <button
              type="button"
              onClick={() => openAddModal()}
              disabled={!canCreateAssignment}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold text-sm rounded-xl shadow-lg transition whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusIcon className="h-4 w-4" />
              New Assignment
            </button>
          </div>
        </div>
      </div>

      {/* ============================================
          LIVE ALARM BANNER — pulsing if classes soon
      ============================================ */}
      {mounted && (todaysAlarms.length > 0 || todaysOngoing.length > 0) && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-orange-300 bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 p-5 shadow-lg animate-pulse-slow">
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-200 rounded-full blur-3xl" />
          </div>

          <div className="relative flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-orange-100 border-2 border-orange-300 flex items-center justify-center shrink-0 shadow-sm">
              <BellAlertIcon className="h-6 w-6 text-orange-600 animate-bounce" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-orange-900 text-base sm:text-lg">
                  {todaysOngoing.length > 0 && todaysAlarms.length > 0
                    ? '🔴 Live class + upcoming soon'
                    : todaysOngoing.length > 0
                    ? '🔴 A class is happening right now'
                    : '🔔 A class is starting soon'}
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-orange-600 text-white px-2 py-0.5 rounded-full">
                  <FireIcon className="h-3 w-3" />
                  {todaysOngoing.length + todaysAlarms.length} alert
                  {todaysOngoing.length + todaysAlarms.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="mt-2 space-y-1.5">
                {todaysOngoing.map(({ assignment }) => (
                  <p
                    key={assignment._id}
                    className="text-sm text-orange-800 font-medium flex items-center gap-2"
                  >
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded uppercase">
                      Live
                    </span>
                    {assignment.studentId?.name} ·{' '}
                    {assignment.courseId?.title} ·{' '}
                    {formatTime(assignment.startTime)} –{' '}
                    {formatTime(assignment.endTime)}
                  </p>
                ))}
                {todaysAlarms.map(({ assignment, info }) => (
                  <p
                    key={assignment._id}
                    className="text-sm text-orange-800 font-medium flex items-center gap-2"
                  >
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-orange-600 text-white px-1.5 py-0.5 rounded uppercase">
                      In {formatCountdown(info.minutesUntilStart)}
                    </span>
                    {assignment.studentId?.name} ·{' '}
                    {assignment.courseId?.title} ·{' '}
                    {formatTime(assignment.startTime)}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          TODAY'S SCHEDULE
      ============================================ */}
      {mounted && now && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md">
                <CalendarDaysIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-800">
                  Today&apos;s Schedule
                </h2>
                <p className="text-[11px] text-slate-500">
                  {currentDayName} · {currentClock} — Live view
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-[11px] font-bold">
                <BellAlertIcon className="h-3.5 w-3.5" />
                {todaysAlarms.length} soon
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                <PlayCircleIcon className="h-3.5 w-3.5" />
                {todaysOngoing.length} live
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold">
                <ClockIcon className="h-3.5 w-3.5" />
                {todaysUpcoming.length} upcoming
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-bold">
                <CheckBadgeIcon className="h-3.5 w-3.5" />
                {todaysCompleted.length} done
              </span>
            </div>
          </div>

          <div className="p-5">
            {todaysClasses.length === 0 ? (
              <div className="py-10 text-center">
                <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3 border border-slate-200">
                  <CalendarIcon className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-slate-600 font-semibold text-sm">
                  No classes scheduled for today
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Enjoy your day off 🎉
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todaysClasses.map(({ assignment, info }) => {
                  const meta = TIME_STATUS_META[info.status];
                  const isAlarm = info.status === 'alarm';
                  const isOngoing = info.status === 'ongoing';

                  const cardClasses = isAlarm
                    ? 'border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 ring-2 ring-orange-200 shadow-md'
                    : isOngoing
                    ? 'border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 ring-2 ring-emerald-200 shadow-md'
                    : info.status === 'completed'
                    ? 'border-slate-200 bg-slate-50/70 opacity-80'
                    : 'border-slate-200 bg-white';

                  return (
                    <div
                      key={assignment._id}
                      className={`relative rounded-xl border p-3.5 transition-all duration-300 ${cardClasses} ${
                        isAlarm || isOngoing ? 'animate-pulse-slow' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Time column */}
                        <div className="shrink-0 w-16 sm:w-20 text-center">
                          <p className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                            {formatTime(assignment.startTime).replace(
                              /\s?(AM|PM)/,
                              ''
                            )}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {formatTime(assignment.startTime).match(/AM|PM/)?.[0] ||
                              ''}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {formatTime(assignment.endTime)}
                          </p>
                        </div>

                        {/* Divider */}
                        <div className="w-px self-stretch bg-slate-200" />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${meta.classes} ${
                                isAlarm || isOngoing
                                  ? 'animate-pulse-slow'
                                  : ''
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${meta.dot}`}
                              />
                              {meta.icon} {meta.label}
                            </span>

                            {isAlarm && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-orange-600 text-white px-2 py-0.5 rounded-full">
                                <BellAlertIcon className="h-3 w-3" />
                                Starts in {formatCountdown(info.minutesUntilStart)}
                              </span>
                            )}

                            {isOngoing && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                                <PlayCircleIcon className="h-3 w-3" />
                                Ends in {formatCountdown(info.minutesUntilEnd)}
                              </span>
                            )}

                            {info.status === 'upcoming' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                <ClockIcon className="h-3 w-3" />
                                In {formatCountdown(info.minutesUntilStart)}
                              </span>
                            )}
                          </div>

                          <p className="font-bold text-sm text-slate-900 truncate">
                            {assignment.studentId?.name || 'Unknown Student'}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1.5 text-[11px] text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <BookOpenIcon className="h-3 w-3" />
                              {assignment.courseId?.title || 'No Course'}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <AcademicCapIcon className="h-3 w-3" />
                              {assignment.teacherId?.name || 'No Teacher'}
                            </span>
                          </div>

                          {assignment.zoomLink && (
                            <div className="mt-2.5">
                              <ZoomLinkButton zoomLink={assignment.zoomLink} />
                            </div>
                          )}
                        </div>

                        {/* Action */}
                        <button
                          type="button"
                          onClick={() => openEditModal(assignment)}
                          className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition"
                          title="Edit"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Off-today summary */}
          {todaysOff.length > 0 && (
            <div className="px-5 pb-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <NoSymbolIcon className="h-4 w-4 text-slate-500" />
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Off Today ({todaysOff.length})
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {todaysOff.slice(0, 8).map((a) => (
                    <span
                      key={a._id}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-medium text-slate-500"
                    >
                      <NoSymbolIcon className="h-3 w-3 text-slate-400" />
                      {a.studentId?.name || 'Unknown'} ·{' '}
                      {a.courseId?.title || 'Course'}
                    </span>
                  ))}
                  {todaysOff.length > 8 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-medium text-slate-500">
                      +{todaysOff.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================
          STATS CARDS
      ============================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {[
          {
            title: 'Teachers',
            value: teachers.length,
            icon: AcademicCapIcon,
            gradient: 'from-indigo-500 to-blue-600',
            bg: 'bg-indigo-50',
            text: 'text-indigo-600',
          },
          {
            title: 'Students',
            value: students.length,
            icon: UsersIcon,
            gradient: 'from-blue-500 to-cyan-600',
            bg: 'bg-blue-50',
            text: 'text-blue-600',
          },
          {
            title: 'Assignments',
            value: assignments.length,
            icon: ClipboardDocumentListIcon,
            gradient: 'from-purple-500 to-pink-600',
            bg: 'bg-purple-50',
            text: 'text-purple-600',
          },
          {
            title: 'Scheduled',
            value: scheduledAssignmentsCount,
            icon: CalendarIcon,
            gradient: 'from-amber-500 to-orange-600',
            bg: 'bg-amber-50',
            text: 'text-amber-600',
          },
          {
            title: 'Zoom',
            value: zoomAssignmentsCount,
            icon: VideoCameraIcon,
            gradient: 'from-emerald-500 to-teal-600',
            bg: 'bg-emerald-50',
            text: 'text-emerald-600',
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="group relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-transparent hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity`}
              />
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl ${stat.bg} flex items-center justify-center`}
                >
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.text}`} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900">
                {stat.value}
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-1 font-semibold uppercase tracking-wider">
                {stat.title}
              </p>
            </div>
          );
        })}
      </div>

      {/* ============================================
          REQUIREMENTS WARNING
      ============================================ */}
      {!canCreateAssignment && (
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/40 p-5 sm:p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Assignment Requirements
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                You need to add at least one teacher, student, and course before
                creating an assignment.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  { name: 'Teachers', ready: teachers.length > 0 },
                  { name: 'Students', ready: students.length > 0 },
                  { name: 'Courses', ready: courses.length > 0 },
                ].map((item) => (
                  <span
                    key={item.name}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      item.ready
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {item.ready ? (
                      <CheckCircleIcon className="h-3.5 w-3.5" />
                    ) : (
                      <XMarkIcon className="h-3.5 w-3.5" />
                    )}
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          SEARCH + FILTER
      ============================================ */}
      {(teachers.length > 0 || students.length > 0) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search teachers or students..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition bg-slate-50/50 focus:bg-white text-sm placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 overflow-x-auto">
              <FunnelIcon className="h-4 w-4 text-slate-400 ml-2 shrink-0" />
              {(
                [
                  { key: 'all', label: 'All' },
                  { key: 'today', label: 'Today' },
                  { key: 'alarm', label: 'Soon' },
                  { key: 'ongoing', label: 'Live' },
                  { key: 'upcoming', label: 'Upcoming' },
                  { key: 'completed', label: 'Done' },
                  { key: 'off', label: 'Off' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setFilterKey(opt.key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                    filterKey === opt.key
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {filterKey !== 'all' && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Filter:{' '}
                <span className="font-semibold text-slate-700">
                  {filterKey === 'today'
                    ? "Today's classes"
                    : filterKey === 'alarm'
                    ? 'Starting soon (<30m)'
                    : filterKey === 'ongoing'
                    ? 'Live classes'
                    : filterKey === 'upcoming'
                    ? 'Later today'
                    : filterKey === 'completed'
                    ? 'Completed today'
                    : 'Off today'}
                </span>
              </p>
              <button
                onClick={() => setFilterKey('all')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Clear filter
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================
          TEACHERS LIST
      ============================================ */}
      {filteredTeachers.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <AcademicCapIcon className="h-4 w-4 text-indigo-600" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              Teacher Assignments
            </h2>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {filteredTeachers.map((teacher) => {
              const teacherAssignments = assignments.filter(
                (a) => a.teacherId?._id === teacher._id
              );

              const teacherStudentIds = new Set(
                teacherAssignments
                  .map((a) => a.studentId?._id)
                  .filter((id): id is string => Boolean(id))
              );

              return (
                <div
                  key={teacher._id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  {/* Header */}
                  <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 px-5 py-4 text-white overflow-hidden">
                    <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full" />
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full" />

                    <div className="relative flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-11 w-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-base font-bold shrink-0 border border-white/10 shadow-md">
                          {getInitials(teacher.name)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-bold truncate">
                            {teacher.name}
                          </h3>
                          <p className="text-indigo-100 text-xs truncate opacity-90">
                            {teacher.email || 'No email provided'}
                          </p>
                        </div>
                      </div>

                      <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold whitespace-nowrap border border-white/10 shrink-0">
                        {teacherStudentIds.size} Students
                      </span>
                    </div>

                    {teacher.subjects && teacher.subjects.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5 relative">
                        {teacher.subjects.slice(0, 4).map((subject) => (
                          <span
                            key={subject}
                            className="px-2 py-0.5 bg-white/10 rounded-md text-[11px] border border-white/5 font-medium"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    {teacherAssignments.length === 0 ? (
                      <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center mx-auto shadow-sm border border-slate-100">
                          <UserIcon className="h-5 w-5 text-slate-400" />
                        </div>
                        <p className="text-slate-500 text-sm font-medium mt-3">
                          No students assigned yet
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {teacherAssignments.map((assignment) => {
                          const statusMeta =
                            STATUS_META[assignment.status] ||
                            STATUS_META.scheduled;
                          const timeStatus = mounted
                            ? assignmentTimeStatuses.get(assignment._id) ||
                              'off'
                            : 'off';
                          const timeMeta = TIME_STATUS_META[timeStatus];
                          const isAlarm = timeStatus === 'alarm';
                          const isOngoing = timeStatus === 'ongoing';

                          const highlightClasses = isAlarm
                            ? 'border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 shadow-sm ring-1 ring-orange-200'
                            : isOngoing
                            ? 'border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-sm ring-1 ring-emerald-200'
                            : timeStatus === 'completed'
                            ? 'border-slate-200 bg-slate-50/70 opacity-90'
                            : 'border-slate-100 bg-slate-50/70';

                          return (
                            <div
                              key={assignment._id}
                              className={`rounded-xl border p-3.5 hover:shadow-sm transition-all duration-200 ${highlightClasses}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  {/* Student row */}
                                  <div className="flex items-center gap-2.5">
                                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                                      {getInitials(
                                        assignment.studentId?.name || 'U'
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-bold text-sm text-slate-900 truncate">
                                          {assignment.studentId?.name ||
                                            'Unknown'}
                                        </p>

                                        {mounted && (
                                          <span
                                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${timeMeta.classes} ${
                                              isAlarm || isOngoing
                                                ? 'animate-pulse-slow'
                                                : ''
                                            }`}
                                            title={timeMeta.label}
                                          >
                                            <span
                                              className={`h-1.5 w-1.5 rounded-full ${timeMeta.dot}`}
                                            />
                                            {timeMeta.icon} {timeMeta.label}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">
                                        Student
                                      </p>
                                    </div>
                                  </div>

                                  {/* Meta row */}
                                  <div className="mt-3 flex flex-wrap gap-1.5">
                                    <span className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200 text-[11px] font-semibold text-slate-600">
                                      <BookOpenIcon className="h-3 w-3 shrink-0 text-slate-400" />
                                      <span className="truncate max-w-[110px]">
                                        {assignment.courseId?.title ||
                                          'No Course'}
                                      </span>
                                    </span>

                                    <span className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200 text-[11px] font-semibold text-slate-600">
                                      <CalendarIcon className="h-3 w-3 shrink-0 text-slate-400" />
                                      <span className="truncate max-w-[110px]">
                                        {assignment.daysOfWeek
                                          ?.map(
                                            (d) => DAY_SHORT[d] || d.slice(0, 3)
                                          )
                                          .join(', ')}
                                      </span>
                                    </span>

                                    <span className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200 text-[11px] font-semibold text-slate-600">
                                      <ClockIcon className="h-3 w-3 shrink-0 text-slate-400" />
                                      {formatTime(assignment.startTime)} –{' '}
                                      {formatTime(assignment.endTime)}
                                    </span>
                                  </div>

                                  {/* Badges row */}
                                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${statusMeta.classes}`}
                                    >
                                      <span
                                        className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`}
                                      />
                                      {statusMeta.label}
                                    </span>

                                    {assignment.zoomLink ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase tracking-wider">
                                        <CheckCircleIcon className="h-3 w-3" />
                                        Zoom Ready
                                      </span>
                                    ) : assignment.zoomMeetingNumber ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold uppercase tracking-wider">
                                        <VideoCameraIcon className="h-3 w-3" />
                                        ID Only
                                      </span>
                                    ) : null}

                                    {assignment.zoomStartUrl && (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold uppercase tracking-wider">
                                        <CheckCircleIcon className="h-3 w-3" />
                                        Host Ready
                                      </span>
                                    )}

                                    {isAlarm && (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-orange-600 text-white text-[10px] font-bold uppercase tracking-wider animate-pulse-slow">
                                        <BellAlertIcon className="h-3 w-3" />
                                        Ringing
                                      </span>
                                    )}

                                    {isOngoing && (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider animate-pulse-slow">
                                        <PlayCircleIcon className="h-3 w-3" />
                                        Live
                                      </span>
                                    )}
                                  </div>

                                  {assignment.notes && (
                                    <p className="mt-2.5 text-xs text-slate-500 line-clamp-1 bg-white px-2.5 py-1.5 rounded-lg border border-slate-100">
                                      <span className="font-bold text-slate-700">
                                        Note:
                                      </span>{' '}
                                      {assignment.notes}
                                    </p>
                                  )}

                                  <div className="mt-3">
                                    {assignment.zoomLink ? (
                                      <ZoomLinkButton
                                        zoomLink={assignment.zoomLink}
                                      />
                                    ) : assignment.zoomMeetingNumber ? (
                                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                                        <VideoCameraIcon className="h-4 w-4" />
                                        Missing URL
                                      </div>
                                    ) : (
                                      <span className="text-[11px] text-slate-400 italic">
                                        No Zoom Link Configured
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-1 shrink-0 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(assignment)}
                                    className="h-8 w-8 rounded-md flex items-center justify-center text-indigo-600 hover:bg-indigo-50 transition"
                                    title="Edit"
                                  >
                                    <PencilSquareIcon className="h-4 w-4" />
                                  </button>

                                  <div className="h-px bg-slate-200 mx-1" />

                                  <button
                                    type="button"
                                    onClick={() =>
                                      deleteAssignment(assignment._id)
                                    }
                                    className="h-8 w-8 rounded-md flex items-center justify-center text-rose-600 hover:bg-rose-50 transition"
                                    title="Delete"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => openAddModal(teacher._id)}
                      disabled={students.length === 0 || courses.length === 0}
                      className="w-full py-2.5 bg-white border-2 border-indigo-100 hover:border-indigo-400 hover:bg-indigo-50 text-indigo-600 font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      <PlusIcon className="h-4 w-4 stroke-2" />
                      Assign New Student
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================
          STUDENT DIRECTORY
      ============================================ */}
      {filteredStudents.length > 0 && (
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <UsersIcon className="h-4 w-4 text-emerald-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                Student Directory
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[11px] font-bold border border-slate-200">
                Total: {students.length}
              </span>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-bold border border-emerald-200">
                Assigned: {assignedStudentsCount}
              </span>
              <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[11px] font-bold border border-amber-200">
                Unassigned: {unassignedStudentsCount}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredStudents.map((student) => {
              const isAssigned = assignedStudentIds.has(student._id);

              // student's time statuses today
              const studentAssignments = assignments.filter(
                (a) => a.studentId?._id === student._id
              );
              const studentToday = mounted
                ? studentAssignments
                    .map((a) => assignmentTimeStatuses.get(a._id) || 'off')
                    .filter((s) => s !== 'off')
                : [];
              const studentHasAlarm = studentToday.includes('alarm');
              const studentHasLive = studentToday.includes('ongoing');

              return (
                <div
                  key={student._id}
                  className={`group bg-white rounded-2xl border p-4 flex items-center justify-between gap-3 transition-all hover:shadow-lg ${
                    studentHasAlarm
                      ? 'border-orange-300 ring-1 ring-orange-200'
                      : studentHasLive
                      ? 'border-emerald-300 ring-1 ring-emerald-200'
                      : isAssigned
                      ? 'border-emerald-200 hover:border-emerald-300'
                      : 'border-slate-200 hover:border-indigo-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`relative h-11 w-11 rounded-xl flex items-center justify-center font-bold shrink-0 text-sm shadow-sm ${
                        isAssigned
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                          : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                      }`}
                    >
                      {getInitials(student.name)}
                      {studentHasAlarm && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center animate-pulse-slow">
                          <BellAlertIcon className="h-2.5 w-2.5 text-white" />
                        </span>
                      )}
                      {studentHasLive && !studentHasAlarm && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white animate-pulse-slow" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">
                        {student.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {student.email || 'No email'}
                      </p>
                      {isAssigned && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                          <CheckCircleIcon className="h-3 w-3" />
                          Assigned
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openAddModal(undefined, student._id)}
                    disabled={teachers.length === 0 || courses.length === 0}
                    className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${
                      isAssigned
                        ? 'bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                        : 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
                    }`}
                    title={isAssigned ? 'Add another course' : 'Assign'}
                  >
                    <PlusIcon className="h-4 w-4 stroke-2" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================
          MODAL (unchanged form, same structure)
      ============================================ */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[92vh] overflow-hidden flex flex-col border border-slate-100 animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
            onMouseDown={(event) => event.stopPropagation()}
          >
            {/* HEADER */}
            <div className="shrink-0 px-5 sm:px-6 py-4 border-b border-slate-100 bg-white">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    {editingAssignment ? (
                      <PencilSquareIcon className="h-5 w-5" />
                    ) : (
                      <PlusIcon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                      Class Management
                    </p>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                      {editingAssignment
                        ? 'Edit Assignment'
                        : 'Create New Assignment'}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting || generatingZoom}
                  className="h-9 w-9 rounded-lg flex items-center justify-center bg-slate-50 hover:bg-slate-100 border border-slate-200 transition disabled:opacity-50 shrink-0"
                >
                  <XMarkIcon className="h-5 w-5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="flex-1 min-h-0 flex flex-col bg-slate-50/50"
            >
              <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-5 space-y-5">
                {/* PARTICIPANTS */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <UsersIcon className="h-4 w-4 text-indigo-600" />
                    </div>
                    Class Participants
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Select Teacher{' '}
                        <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative group">
                        <AcademicCapIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                        <select
                          value={formData.teacherId}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              teacherId: e.target.value,
                            }))
                          }
                          required
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition text-sm cursor-pointer"
                        >
                          <option value="">Choose a teacher...</option>
                          {teachers.map((t) => (
                            <option key={t._id} value={t._id}>
                              {t.name}
                              {t.email ? ` — ${t.email}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Select Student{' '}
                        <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative group">
                        <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                        <select
                          value={formData.studentId}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              studentId: e.target.value,
                            }))
                          }
                          required
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition text-sm cursor-pointer"
                        >
                          <option value="">Choose a student...</option>
                          {students.map((s) => (
                            <option key={s._id} value={s._id}>
                              {s.name}
                              {s.email ? ` — ${s.email}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Select Course{' '}
                        <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative group">
                        <BookOpenIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                        <select
                          value={formData.courseId}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              courseId: e.target.value,
                            }))
                          }
                          required
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition text-sm cursor-pointer"
                        >
                          <option value="">Choose a course...</option>
                          {courses.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SCHEDULE */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <CalendarIcon className="h-4 w-4 text-indigo-600" />
                    </div>
                    Weekly Schedule
                  </h4>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-3">
                      Class Days <span className="text-rose-500">*</span>
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                      {DAYS.map((day) => {
                        const selected = formData.daysOfWeek.includes(day);
                        const isToday =
                          mounted && currentDayName === day;
                        return (
                          <label
                            key={day}
                            className={`relative cursor-pointer rounded-xl border px-2 py-2.5 text-center transition-all duration-200 ${
                              selected
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => handleDayToggle(day)}
                              className="sr-only"
                            />
                            <span className="block text-[11px] font-bold tracking-wide uppercase">
                              {day.slice(0, 3)}
                            </span>
                            {isToday && (
                              <span className="block text-[8px] font-bold text-indigo-500 uppercase tracking-wider mt-0.5">
                                Today
                              </span>
                            )}
                            {selected && (
                              <CheckCircleIcon className="absolute -top-2 -right-2 h-5 w-5 text-indigo-600 bg-white rounded-full shadow-sm" />
                            )}
                          </label>
                        );
                      })}
                    </div>

                    {formData.daysOfWeek.length === 0 && (
                      <p className="mt-2 text-xs font-medium text-rose-500 flex items-center gap-1">
                        <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                        Please select at least one day.
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Start Time <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative group">
                          <ClockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                          <input
                            type="time"
                            value={formData.startTime}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                startTime: e.target.value,
                              }))
                            }
                            required
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          End Time <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative group">
                          <ClockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                          <input
                            type="time"
                            value={formData.endTime}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                endTime: e.target.value,
                              }))
                            }
                            required
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {formData.startTime &&
                      formData.endTime &&
                      formData.endTime > formData.startTime && (
                        <div className="mt-4 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 flex flex-wrap items-center gap-2 text-blue-700 text-xs font-bold">
                          <ClockIcon className="h-4 w-4 text-blue-500" />
                          <span>
                            {formatTime(formData.startTime)} –{' '}
                            {formatTime(formData.endTime)}
                          </span>
                          <span className="text-blue-300 mx-1">•</span>
                          <span className="text-blue-500 font-medium tracking-wide">
                            Asia/Karachi
                          </span>
                        </div>
                      )}
                  </div>
                </div>

                {/* ZOOM */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <VideoCameraIcon className="h-4 w-4 text-indigo-600" />
                    </div>
                    Zoom Integration
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full ml-1">
                      Optional
                    </span>
                  </h4>

                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    {!formData.zoomLink && (
                      <div className="mb-4">
                        <p className="text-sm text-slate-600">
                          Create an instant Zoom meeting room for this weekly
                          schedule.
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={generateZoomMeeting}
                      disabled={
                        generatingZoom || submitting || !canGenerateZoom
                      }
                      className="w-full py-3 bg-white border-2 border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50 text-indigo-700 font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                    >
                      {generatingZoom ? (
                        <>
                          <span className="h-4 w-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                          Connecting to Zoom...
                        </>
                      ) : (
                        <>
                          <VideoCameraIcon className="h-5 w-5" />
                          {formData.zoomLink
                            ? 'Regenerate Zoom Meeting'
                            : 'Generate Zoom Meeting'}
                        </>
                      )}
                    </button>

                    {!canGenerateZoom && !formData.zoomLink && (
                      <p className="text-center text-[11px] font-medium text-slate-400 mt-3 flex items-center justify-center gap-1">
                        <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                        Complete participant and schedule details first.
                      </p>
                    )}

                    {formData.zoomLink && (
                      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                        <div className="flex items-center justify-between gap-2 border-b border-emerald-100 pb-3 mb-3">
                          <div className="flex items-center gap-2 text-emerald-700">
                            <CheckCircleIcon className="h-5 w-5" />
                            <span className="font-bold text-sm">
                              Meeting Successfully Created
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md uppercase tracking-wider">
                            {formData.zoomProvider || 'ZOOM'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {formData.zoomMeetingNumber && (
                            <div className="bg-white rounded-xl p-3 border border-emerald-100 shadow-sm">
                              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                                Meeting ID
                              </p>
                              <p className="font-bold text-slate-900 text-sm tracking-wide break-all">
                                {formData.zoomMeetingNumber}
                              </p>
                            </div>
                          )}

                          {formData.zoomPassword && (
                            <div className="bg-white rounded-xl p-3 border border-emerald-100 shadow-sm">
                              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                                Passcode
                              </p>
                              <p className="font-bold text-slate-900 text-sm tracking-wide">
                                {formData.zoomPassword}
                              </p>
                            </div>
                          )}
                        </div>

                        <div
                          className={`mt-3 rounded-xl border p-3 ${
                            formData.zoomStartUrl
                              ? 'bg-indigo-50 border-indigo-200'
                              : 'bg-amber-50 border-amber-200'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {formData.zoomStartUrl ? (
                              <CheckCircleIcon className="h-5 w-5 text-indigo-600 shrink-0" />
                            ) : (
                              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 shrink-0" />
                            )}
                            <div>
                              <p
                                className={`text-xs font-bold ${
                                  formData.zoomStartUrl
                                    ? 'text-indigo-700'
                                    : 'text-amber-700'
                                }`}
                              >
                                {formData.zoomStartUrl
                                  ? 'Teacher Host Start Link Ready'
                                  : 'Teacher Host Start Link Not Available'}
                              </p>
                              <p
                                className={`text-[11px] mt-1 ${
                                  formData.zoomStartUrl
                                    ? 'text-indigo-600'
                                    : 'text-amber-700'
                                }`}
                              >
                                {formData.zoomStartUrl
                                  ? 'The teacher can use the saved host start link to start the Zoom class.'
                                  : 'Zoom did not return a host start URL. The participant link is available, but the teacher host link still needs to be configured.'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <a
                          href={formData.zoomLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors shadow-sm"
                        >
                          <ArrowTopRightOnSquareIcon className="h-4 w-4 stroke-2" />
                          Launch Participant Test Meeting
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* STATUS & NOTES */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <ClipboardDocumentListIcon className="h-4 w-4 text-indigo-600" />
                    </div>
                    Additional Information
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Assignment Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            status: e.target.value as AssignmentStatus,
                          }))
                        }
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition text-sm cursor-pointer"
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold text-slate-700">
                          Class Notes{' '}
                          <span className="font-normal text-slate-400 ml-1">
                            (Optional)
                          </span>
                        </label>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          {formData.notes.length}/1000
                        </span>
                      </div>
                      <textarea
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        rows={3}
                        maxLength={1000}
                        placeholder="Add any specific instructions, syllabus links, or notes..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition resize-none text-sm leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                <div className="h-2" />
              </div>

              {/* FOOTER */}
              <div className="shrink-0 bg-white border-t border-slate-200 px-5 sm:px-6 py-4 sm:py-5">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={submitting || generatingZoom}
                    className="sm:w-32 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 transition disabled:opacity-50 text-sm"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || generatingZoom}
                    className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm active:scale-[0.98]"
                  >
                    {submitting ? (
                      <>
                        <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving Details...
                      </>
                    ) : (
                      <>
                        {editingAssignment ? (
                          <ArrowPathIcon className="h-5 w-5 stroke-2" />
                        ) : (
                          <CheckCircleIcon className="h-5 w-5 stroke-2" />
                        )}
                        {editingAssignment
                          ? 'Update Assignment'
                          : 'Create Assignment'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom slow pulse animation */}
      <style jsx global>{`
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.85;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}