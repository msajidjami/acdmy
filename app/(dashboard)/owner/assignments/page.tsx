
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
  PencilIcon,
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
} from '@heroicons/react/24/outline';

import ZoomLinkButton from '@/app/components/ZoomLinkButton';

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

type AssignmentStatus =
  | 'scheduled'
  | 'ongoing'
  | 'completed'
  | 'cancelled';

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

  // Participant / student Zoom information
  zoomMeetingId: string;
  zoomMeetingNumber: string;
  zoomPassword: string;
  zoomLink: string;

  // Host / teacher Zoom information
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

  // Participant / student Zoom link
  zoomLink: string;

  // Zoom identifiers
  zoomMeetingId: string;
  zoomMeetingNumber: string;
  zoomPassword: string;

  // Host / teacher start URL
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

  // Participant URL
  joinUrl?: string;
  join_url?: string;
  zoomLink?: string;

  // Host URL
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

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

const STATUS_COLORS: Record<AssignmentStatus, string> = {
  scheduled: 'bg-blue-50 text-blue-700 border-blue-100',
  ongoing: 'bg-amber-50 text-amber-700 border-amber-100',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  cancelled: 'bg-red-50 text-red-700 border-red-100',
};

const STATUS_LABELS: Record<AssignmentStatus, string> = {
  scheduled: 'Scheduled',
  ongoing: 'Ongoing',
  completed: 'Completed',
  cancelled: 'Cancelled',
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

async function readJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getApiErrorMessage(
  data: unknown,
  fallback: string
): string {
  if (typeof data === 'object' && data !== null) {
    const value = data as ApiErrorResponse;

    if (
      typeof value.error === 'string' &&
      value.error.trim()
    ) {
      return value.error.trim();
    }

    if (
      typeof value.message === 'string' &&
      value.message.trim()
    ) {
      return value.message.trim();
    }

    if (
      typeof value.details === 'string' &&
      value.details.trim()
    ) {
      return value.details.trim();
    }
  }

  return fallback;
}

function formatTime(time: string) {
  if (!time) return '--:--';

  const [hourString, minute = '00'] = time.split(':');
  const hour = Number(hourString);

  if (Number.isNaN(hour)) {
    return time;
  }

  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;

  return `${displayHour}:${minute} ${period}`;
}

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

  const [formData, setFormData] =
    useState<AssignmentFormData>({
      ...DEFAULT_FORM_DATA,
    });

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
        const data = await readJsonResponse(
          assignmentResponse
        );

        throw new Error(
          getApiErrorMessage(
            data,
            'Failed to load assignments.'
          )
        );
      }

      const assignmentData =
        await readJsonResponse(assignmentResponse);

      setAssignments(
        Array.isArray(assignmentData)
          ? (assignmentData as Assignment[])
          : []
      );

      if (studentResponse.ok) {
        const data =
          await readJsonResponse(studentResponse);

        setStudents(
          Array.isArray(data)
            ? (data as StudentOption[])
            : []
        );
      } else {
        setStudents([]);
      }

      if (teacherResponse.ok) {
        const data =
          await readJsonResponse(teacherResponse);

        setTeachers(
          Array.isArray(data)
            ? (data as TeacherOption[])
            : []
        );
      } else {
        setTeachers([]);
      }

      if (courseResponse.ok) {
        const data =
          await readJsonResponse(courseResponse);

        setCourses(
          Array.isArray(data)
            ? (data as CourseOption[])
            : []
        );
      } else {
        setCourses([]);
      }
    } catch (error: unknown) {
      console.error(
        'Owner assignments fetch error:',
        error
      );

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

  const handleDayToggle = (day: string) => {
    setFormData((previous) => {
      const exists =
        previous.daysOfWeek.includes(day);

      return {
        ...previous,
        daysOfWeek: exists
          ? previous.daysOfWeek.filter(
              (item) => item !== day
            )
          : [...previous.daysOfWeek, day],
      };
    });
  };

  const openAddModal = (
    teacherId?: string,
    studentId?: string
  ) => {
    setEditingAssignment(null);

    setFormData({
      ...DEFAULT_FORM_DATA,

      teacherId:
        teacherId ||
        teachers[0]?._id ||
        '',

      studentId:
        studentId ||
        students[0]?._id ||
        '',

      courseId:
        courses[0]?._id ||
        '',
    });

    setShowModal(true);
  };

  const openEditModal = (
    assignment: Assignment
  ) => {
    setEditingAssignment(assignment);

    setFormData({
      studentId:
        assignment.studentId?._id || '',

      teacherId:
        assignment.teacherId?._id || '',

      courseId:
        assignment.courseId?._id || '',

      daysOfWeek:
        Array.isArray(assignment.daysOfWeek)
          ? assignment.daysOfWeek
          : [],

      startTime:
        assignment.startTime ||
        '09:00',

      endTime:
        assignment.endTime ||
        '10:00',

      status:
        assignment.status ||
        'scheduled',

      notes:
        assignment.notes ||
        '',

      zoomLink:
        assignment.zoomLink ||
        '',

      zoomMeetingId:
        assignment.zoomMeetingId ||
        '',

      zoomMeetingNumber:
        assignment.zoomMeetingNumber ||
        '',

      zoomPassword:
        assignment.zoomPassword ||
        '',

      zoomStartUrl:
        assignment.zoomStartUrl ||
        '',

      zoomHostUserId:
        assignment.zoomHostUserId ||
        '',

      zoomTimezone:
        assignment.zoomTimezone ||
        'Asia/Karachi',

      zoomProvider:
        assignment.zoomProvider ||
        'none',
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (
      submitting ||
      generatingZoom
    ) {
      return;
    }

    setShowModal(false);
    setEditingAssignment(null);

    setFormData({
      ...DEFAULT_FORM_DATA,
    });
  };

  const validateForm = () => {
    if (!formData.teacherId) {
      toast.error(
        'Please select a teacher.'
      );
      return false;
    }

    if (!formData.studentId) {
      toast.error(
        'Please select a student.'
      );
      return false;
    }

    if (!formData.courseId) {
      toast.error(
        'Please select a course.'
      );
      return false;
    }

    if (
      formData.daysOfWeek.length === 0
    ) {
      toast.error(
        'Please select at least one day.'
      );
      return false;
    }

    if (
      !formData.startTime ||
      !formData.endTime
    ) {
      toast.error(
        'Please select class start and end time.'
      );
      return false;
    }

    if (
      formData.endTime <=
      formData.startTime
    ) {
      toast.error(
        'End time must be after start time.'
      );
      return false;
    }

    return true;
  };

  const generateZoomMeeting =
    async () => {
      if (!validateForm()) {
        return;
      }

      const teacher =
        teachers.find(
          (item) =>
            item._id ===
            formData.teacherId
        );

      const student =
        students.find(
          (item) =>
            item._id ===
            formData.studentId
        );

      const course =
        courses.find(
          (item) =>
            item._id ===
            formData.courseId
        );

      if (
        !teacher ||
        !student ||
        !course
      ) {
        toast.error(
          'Selected teacher, student, or course was not found.'
        );
        return;
      }

      setGeneratingZoom(true);

      try {
        const topic =
          `${course.title} - ${student.name} & ${teacher.name}`;

        const agenda =
          `Class for ${course.title}. Student: ${student.name}. Teacher: ${teacher.name}.`;

        const response =
          await fetch(
            '/api/zoom/create-meeting',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              credentials: 'include',

              cache: 'no-store',

              body: JSON.stringify({
                topic,
                agenda,

                startTime:
                  formData.startTime,

                endTime:
                  formData.endTime,

                daysOfWeek:
                  formData.daysOfWeek,

                timezone:
                  'Asia/Karachi',

                teacherEmail:
                  teacher.email ||
                  '',

                teacherId:
                  teacher._id,

                studentId:
                  student._id,

                courseId:
                  course._id,
              }),
            }
          );

        const data =
          await readJsonResponse(
            response
          );

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(
              data,
              `Failed to create Zoom meeting (HTTP ${response.status}).`
            )
          );
        }

        const zoomData =
          (data ||
            {}) as ZoomMeetingResponse;

        /*
         * Zoom Meeting ID
         */
        const meetingId =
          String(
            zoomData.meetingId ??
              zoomData.id ??
              ''
          ).trim();

        /*
         * Zoom Meeting Number
         */
        const meetingNumber =
          String(
            zoomData.meetingNumber ??
              zoomData.id ??
              zoomData.meetingId ??
              ''
          ).trim();

        /*
         * Participant / Student URL
         *
         * IMPORTANT:
         * This is NOT the host URL.
         */
        const joinUrl =
          String(
            zoomData.joinUrl ??
              zoomData.join_url ??
              zoomData.zoomLink ??
              ''
          ).trim();

        /*
         * Host / Teacher Start URL
         *
         * IMPORTANT:
         * We only accept an actual URL returned
         * by the Zoom API.
         *
         * We DO NOT construct this URL ourselves.
         */
        const startUrl =
          String(
            zoomData.startUrl ??
              zoomData.start_url ??
              zoomData.zoomStartUrl ??
              ''
          ).trim();

        const password =
          String(
            zoomData.password ??
              zoomData.meetingPassword ??
              ''
          ).trim();

        const hostUserId =
          String(
            zoomData.hostUserId ??
              zoomData.host_id ??
              ''
          ).trim();

        const timezone =
          String(
            zoomData.timezone ||
              'Asia/Karachi'
          ).trim();

        const provider =
          String(
            zoomData.provider ||
              'zoom'
          ).trim();

        if (!meetingId) {
          throw new Error(
            'Zoom meeting was created but no Meeting ID was returned.'
          );
        }

        if (!meetingNumber) {
          throw new Error(
            'Zoom meeting was created but no Meeting Number was returned.'
          );
        }

        if (!joinUrl) {
          throw new Error(
            'Zoom meeting was created but no participant Join URL was returned.'
          );
        }

        /*
         * Host URL is important for the teacher.
         *
         * We do not stop the meeting creation if Zoom
         * does not return it, because the meeting itself
         * may still be valid.
         */
        if (!startUrl) {
          console.warn(
            'Zoom meeting created without start_url. Teacher host start link is unavailable.',
            zoomData
          );
        }

        setFormData(
          (previous) => ({
            ...previous,

            /*
             * Participant URL
             */
            zoomLink:
              joinUrl,

            /*
             * Meeting identifiers
             */
            zoomMeetingId:
              meetingId,

            zoomMeetingNumber:
              meetingNumber,

            /*
             * Meeting security
             */
            zoomPassword:
              password,

            /*
             * Host information
             */
            zoomStartUrl:
              startUrl,

            zoomHostUserId:
              hostUserId,

            /*
             * Configuration
             */
            zoomTimezone:
              timezone,

            zoomProvider:
              provider,
          })
        );

        if (startUrl) {
          toast.success(
            'Zoom meeting created. Student Join URL and Teacher Host URL are ready.'
          );
        } else {
          toast.success(
            'Zoom meeting created, but the teacher Host Start URL was not returned.'
          );
        }
      } catch (error: unknown) {
        console.error(
          'Zoom meeting creation error:',
          error
        );

        const message =
          error instanceof Error
            ? error.message
            : 'Failed to create Zoom meeting.';

        const lowerMessage =
          message.toLowerCase();

        if (
          lowerMessage.includes(
            'connect timeout'
          ) ||
          lowerMessage.includes(
            'connecttimedout'
          ) ||
          lowerMessage.includes(
            'zoom.us:443'
          ) ||
          lowerMessage.includes(
            'api.zoom.us:443'
          ) ||
          lowerMessage.includes(
            'unable to connect'
          ) ||
          lowerMessage.includes(
            'could not connect to zoom'
          ) ||
          lowerMessage.includes(
            'network'
          ) ||
          lowerMessage.includes(
            'etimedout'
          ) ||
          lowerMessage.includes(
            'fetch failed'
          )
        ) {
          toast.error(
            'Server cannot connect to Zoom. Check server internet access, DNS, firewall/VPN and outbound HTTPS (443).',
            {
              duration: 6000,
            }
          );
        } else {
          toast.error(
            message,
            {
              duration: 5000,
            }
          );
        }
      } finally {
        setGeneratingZoom(false);
      }
    };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    /*
     * IMPORTANT:
     *
     * zoomLink     = Student / Participant URL
     * zoomStartUrl = Teacher / Host URL
     *
     * They must remain separate.
     */
    const payload = {
      studentId:
        formData.studentId,

      teacherId:
        formData.teacherId,

      courseId:
        formData.courseId,

      daysOfWeek:
        formData.daysOfWeek,

      startTime:
        formData.startTime,

      endTime:
        formData.endTime,

      status:
        formData.status,

      notes:
        formData.notes.trim(),

      /*
       * Zoom participant information
       */
      zoomMeetingId:
        formData.zoomMeetingId,

      zoomMeetingNumber:
        formData.zoomMeetingNumber,

      zoomPassword:
        formData.zoomPassword,

      zoomLink:
        formData.zoomLink,

      /*
       * Zoom host information
       */
      zoomStartUrl:
        formData.zoomStartUrl,

      zoomHostUserId:
        formData.zoomHostUserId,

      /*
       * Zoom configuration
       */
      zoomTimezone:
        formData.zoomTimezone ||
        'Asia/Karachi',

      zoomProvider:
        formData.zoomProvider ||
        'none',
    };

    try {
      const isEditing =
        Boolean(editingAssignment);

      let url =
        '/api/owner/assignments';

      let method:
        | 'POST'
        | 'PUT' = 'POST';

      if (
        isEditing &&
        editingAssignment
      ) {
        url =
          `/api/owner/assignments/${editingAssignment._id}`;

        method = 'PUT';
      }

      const response =
        await fetch(url, {
          method,

          headers: {
            'Content-Type':
              'application/json',
          },

          credentials:
            'include',

          cache:
            'no-store',

          body:
            JSON.stringify(
              payload
            ),
        });

      const data =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            data,
            'Failed to save assignment.'
          )
        );
      }

      toast.success(
        isEditing
          ? 'Assignment updated successfully.'
          : 'Assignment created successfully.'
      );

      setShowModal(false);
      setEditingAssignment(null);

      setFormData({
        ...DEFAULT_FORM_DATA,
      });

      await fetchData();
    } catch (error: unknown) {
      console.error(
        'Assignment save error:',
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : 'Failed to save assignment.';

      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteAssignment =
    async (
      assignmentId: string
    ) => {
      const confirmed =
        window.confirm(
          'Are you sure you want to delete this assignment?'
        );

      if (!confirmed) {
        return;
      }

      try {
        const response =
          await fetch(
            `/api/owner/assignments/${assignmentId}`,
            {
              method: 'DELETE',
              credentials:
                'include',
              cache:
                'no-store',
            }
          );

        const data =
          await readJsonResponse(
            response
          );

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(
              data,
              'Failed to delete assignment.'
            )
          );
        }

        setAssignments(
          (previous) =>
            previous.filter(
              (item) =>
                item._id !==
                assignmentId
            )
        );

        toast.success(
          'Assignment deleted successfully.'
        );
      } catch (error: unknown) {
        console.error(
          'Delete assignment error:',
          error
        );

        const message =
          error instanceof Error
            ? error.message
            : 'Failed to delete assignment.';

        toast.error(message);
      }
    };

  const assignedStudentIds =
    useMemo(() => {
      return new Set(
        assignments
          .map(
            (assignment) =>
              assignment.studentId?._id
          )
          .filter(
            (
              id
            ): id is string =>
              Boolean(id)
          )
      );
    }, [assignments]);

  const assignedStudentsCount =
    assignedStudentIds.size;

  const unassignedStudentsCount =
    Math.max(
      0,
      students.length -
        assignedStudentsCount
    );

  const zoomAssignmentsCount =
    assignments.filter(
      (assignment) =>
        Boolean(
          assignment.zoomLink ||
            assignment.zoomMeetingNumber
        )
    ).length;

  const scheduledAssignmentsCount =
    assignments.filter(
      (assignment) =>
        assignment.status ===
        'scheduled'
    ).length;

  const canCreateAssignment =
    teachers.length > 0 &&
    students.length > 0 &&
    courses.length > 0;

  const canGenerateZoom =
    Boolean(
      formData.teacherId &&
        formData.studentId &&
        formData.courseId &&
        formData.daysOfWeek
          .length > 0 &&
        formData.startTime &&
        formData.endTime &&
        formData.endTime >
          formData.startTime
    );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />

          <p className="mt-3 text-slate-600 font-medium text-sm">
            Loading assignments...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="ltr"
      className="min-h-screen bg-slate-50 max-w-7xl mx-auto px-4 sm:px-6 pb-12 font-sans"
    >
      {/* HEADER */}
      <div className="pt-16 sm:pt-20 pb-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-3">
              <ClipboardDocumentListIcon className="w-4 h-4" />
              Class Management
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Assignments
            </h1>

            <p className="text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
              Assign teachers, schedule weekly classes, and seamlessly manage Zoom meetings in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              openAddModal()
            }
            disabled={
              !canCreateAssignment
            }
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm shadow-indigo-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <PlusIcon className="w-4 h-4 stroke-2" />
            New Assignment
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          {
            title: 'Teachers',
            value: teachers.length,
            icon: AcademicCapIcon,
            box: 'bg-indigo-50',
            iconColor:
              'text-indigo-600',
            valueColor:
              'text-slate-900',
          },
          {
            title: 'Students',
            value: students.length,
            icon: UsersIcon,
            box: 'bg-blue-50',
            iconColor:
              'text-blue-600',
            valueColor:
              'text-slate-900',
          },
          {
            title: 'Assignments',
            value:
              assignments.length,
            icon:
              ClipboardDocumentListIcon,
            box: 'bg-indigo-50',
            iconColor:
              'text-indigo-600',
            valueColor:
              'text-indigo-600',
          },
          {
            title: 'Scheduled',
            value:
              scheduledAssignmentsCount,
            icon: CalendarIcon,
            box: 'bg-amber-50',
            iconColor:
              'text-amber-600',
            valueColor:
              'text-amber-600',
          },
          {
            title: 'Zoom',
            value:
              zoomAssignmentsCount,
            icon:
              VideoCameraIcon,
            box: 'bg-emerald-50',
            iconColor:
              'text-emerald-600',
            valueColor:
              'text-emerald-600',
          },
        ].map((stat) => {
          const Icon =
            stat.icon;

          return (
            <div
              key={stat.title}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                    {stat.title}
                  </p>

                  <p
                    className={`text-2xl font-extrabold mt-1 ${stat.valueColor}`}
                  >
                    {stat.value}
                  </p>
                </div>

                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.box}`}
                >
                  <Icon
                    className={`w-5 h-5 ${stat.iconColor}`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* REQUIREMENTS WARNING */}
      {!canCreateAssignment && (
        <div className="mb-8 bg-white rounded-xl border border-amber-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-amber-50/50 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-white border border-amber-200 flex items-center justify-center shrink-0">
              <ExclamationTriangleIcon className="w-4 h-4 text-amber-600" />
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Assignment Requirements
              </h3>

              <p className="text-sm text-slate-600 mt-1">
                You need to add at least one teacher, student, and course before creating an assignment.
              </p>

              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  {
                    name: 'Teachers',
                    ready:
                      teachers.length >
                      0,
                  },
                  {
                    name: 'Students',
                    ready:
                      students.length >
                      0,
                  },
                  {
                    name: 'Courses',
                    ready:
                      courses.length >
                      0,
                  },
                ].map((item) => (
                  <span
                    key={item.name}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      item.ready
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {item.ready
                      ? '✓'
                      : '×'}{' '}
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEACHERS LIST */}
      {teachers.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {teachers.map(
            (teacher) => {
              const teacherAssignments =
                assignments.filter(
                  (assignment) =>
                    assignment
                      .teacherId?._id ===
                    teacher._id
                );

              const teacherStudentIds =
                new Set(
                  teacherAssignments
                    .map(
                      (
                        assignment
                      ) =>
                        assignment
                          .studentId?._id
                    )
                    .filter(
                      (
                        id
                      ): id is string =>
                        Boolean(id)
                    )
                );

              return (
                <div
                  key={teacher._id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
                >
                  <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-5 py-4 text-white">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-lg font-bold shrink-0 border border-white/10">
                          {teacher.name
                            ?.charAt(
                              0
                            )
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <h3 className="text-base font-bold truncate tracking-wide">
                            {teacher.name}
                          </h3>

                          <p className="text-indigo-100 text-xs truncate opacity-90">
                            {teacher.email ||
                              'No email provided'}
                          </p>
                        </div>
                      </div>

                      <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold whitespace-nowrap border border-white/10">
                        {
                          teacherStudentIds.size
                        }{' '}
                        Students
                      </span>
                    </div>

                    {teacher.subjects &&
                      teacher.subjects
                        .length >
                        0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {teacher.subjects.map(
                            (
                              subject
                            ) => (
                              <span
                                key={
                                  subject
                                }
                                className="px-2 py-1 bg-white/10 rounded-lg text-xs border border-white/5"
                              >
                                {
                                  subject
                                }
                              </span>
                            )
                          )}
                        </div>
                      )}
                  </div>

                  <div className="p-3">
                    {teacherAssignments.length ===
                    0 ? (
                      <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mx-auto shadow-sm border border-slate-100">
                          <UserIcon className="w-5 h-5 text-slate-400" />
                        </div>

                        <p className="text-slate-500 text-sm font-medium mt-3">
                          No students assigned yet
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {teacherAssignments.map(
                          (
                            assignment
                          ) => (
                            <div
                              key={
                                assignment._id
                              }
                              className="rounded-xl border border-slate-100 bg-slate-50 p-3 hover:border-indigo-200 hover:bg-white hover:shadow-sm transition-all duration-200"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center shrink-0">
                                      <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
                                    </div>

                                    <span className="font-bold text-sm text-slate-900 truncate">
                                      {assignment
                                        .studentId
                                        ?.name ||
                                        'Unknown'}
                                    </span>
                                  </div>

                                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-slate-600">
                                    <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                      <BookOpenIcon className="w-3.5 h-3.5 shrink-0 text-slate-400" />

                                      <span className="truncate max-w-[120px] font-medium">
                                        {assignment
                                          .courseId
                                          ?.title ||
                                          'No Course'}
                                      </span>
                                    </span>

                                    <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                      <CalendarIcon className="w-3.5 h-3.5 shrink-0 text-slate-400" />

                                      <span className="truncate max-w-[100px] font-medium">
                                        {assignment.daysOfWeek
                                          ?.slice(
                                            0,
                                            2
                                          )
                                          .join(
                                            ', '
                                          ) ||
                                          ''}

                                        {assignment
                                          .daysOfWeek
                                          ?.length >
                                          2
                                          ? '…'
                                          : ''}
                                      </span>
                                    </span>

                                    <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                                      <ClockIcon className="w-3.5 h-3.5 shrink-0 text-slate-400" />

                                      {formatTime(
                                        assignment.startTime
                                      )}{' '}
                                      –{' '}
                                      {formatTime(
                                        assignment.endTime
                                      )}
                                    </span>
                                  </div>

                                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                    <span
                                      className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                        STATUS_COLORS[
                                          assignment.status
                                        ] ||
                                        STATUS_COLORS.scheduled
                                      }`}
                                    >
                                      {STATUS_LABELS[
                                        assignment
                                          .status
                                      ] ||
                                        'Scheduled'}
                                    </span>

                                    {assignment.zoomLink ? (
                                      <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                                        <CheckCircleIcon className="w-3.5 h-3.5" />
                                        Zoom Ready
                                      </span>
                                    ) : assignment.zoomMeetingNumber ? (
                                      <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                                        <VideoCameraIcon className="w-3.5 h-3.5" />
                                        ID Only
                                      </span>
                                    ) : null}

                                    {assignment.zoomStartUrl && (
                                      <span className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                                        <CheckCircleIcon className="w-3.5 h-3.5" />
                                        Host Ready
                                      </span>
                                    )}
                                  </div>

                                  {assignment.notes && (
                                    <p className="mt-2 text-xs text-slate-500 line-clamp-1 bg-white px-2.5 py-1.5 rounded-lg border border-slate-100">
                                      <span className="font-semibold text-slate-700">
                                        Note:
                                      </span>{' '}
                                      {
                                        assignment.notes
                                      }
                                    </p>
                                  )}

                                  <div className="mt-3">
                                    {assignment.zoomLink ? (
                                      <ZoomLinkButton
                                        zoomLink={
                                          assignment.zoomLink
                                        }
                                      />
                                    ) : assignment.zoomMeetingNumber ? (
                                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                                        <VideoCameraIcon className="w-4 h-4" />
                                        Missing URL
                                      </div>
                                    ) : (
                                      <span className="text-xs text-slate-400 italic">
                                        No Zoom Link Configured
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex gap-1 shrink-0 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openEditModal(
                                        assignment
                                      )
                                    }
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                                    title="Edit"
                                  >
                                    <PencilIcon className="w-4 h-4" />
                                  </button>

                                  <div className="w-px bg-slate-200 my-1" />

                                  <button
                                    type="button"
                                    onClick={() =>
                                      deleteAssignment(
                                        assignment._id
                                      )
                                    }
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition"
                                    title="Delete"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() =>
                        openAddModal(
                          teacher._id
                        )
                      }
                      disabled={
                        students.length ===
                          0 ||
                        courses.length ===
                          0
                      }
                      className="w-full py-2.5 bg-white border-2 border-indigo-100 hover:border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      <PlusIcon className="w-5 h-5 stroke-2" />
                      Assign New Student
                    </button>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}

      {/* ALL STUDENTS */}
      {students.length > 0 && (
        <div className="mt-10">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <UserIcon className="w-6 h-6 text-indigo-600" />
              Student Directory
            </h2>

            <div className="flex gap-2">
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold border border-slate-200">
                Total: {students.length}
              </span>

              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
                Assigned:{' '}
                {
                  assignedStudentsCount
                }
              </span>

              <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-200">
                Unassigned:{' '}
                {
                  unassignedStudentsCount
                }
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map(
              (student) => {
                const isAssigned =
                  assignedStudentIds.has(
                    student._id
                  );

                return (
                  <div
                    key={
                      student._id
                    }
                    className={`bg-white rounded-xl border p-4 flex items-center justify-between gap-3 transition-all hover:shadow-md ${
                      isAssigned
                        ? 'border-emerald-200 bg-emerald-50/10'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-extrabold shrink-0 text-sm border border-indigo-100">
                        {student.name
                          ?.charAt(
                            0
                          )
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">
                          {
                            student.name
                          }
                        </p>

                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {student.email ||
                            'No email'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        openAddModal(
                          undefined,
                          student._id
                        )
                      }
                      disabled={
                        teachers.length ===
                          0 ||
                        courses.length ===
                          0
                      }
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 shrink-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        isAssigned
                          ? 'bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                      }`}
                    >
                      <PlusIcon className="w-3.5 h-3.5 stroke-2" />

                      {isAssigned
                        ? 'Add Course'
                        : 'Assign'}
                    </button>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            {/* HEADER */}
            <div className="shrink-0 px-6 py-5 border-b border-slate-100 bg-white">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    {editingAssignment ? (
                      <PencilIcon className="w-5 h-5 stroke-2" />
                    ) : (
                      <PlusIcon className="w-5 h-5 stroke-2" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">
                      Class Management
                    </p>

                    <h2 className="text-xl font-extrabold text-slate-900 truncate">
                      {editingAssignment
                        ? 'Edit Assignment'
                        : 'Create New Assignment'}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    submitting ||
                    generatingZoom
                  }
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors disabled:opacity-50 shrink-0"
                >
                  <XMarkIcon className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* FORM */}
            <form
              onSubmit={
                handleSubmit
              }
              className="flex-1 min-h-0 flex flex-col bg-slate-50/50"
            >
              <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6 space-y-8">

                {/* PARTICIPANTS */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <UsersIcon className="w-4 h-4 text-indigo-600" />
                    </div>

                    Class Participants
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* TEACHER */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Select Teacher{' '}
                        <span className="text-red-500">
                          *
                        </span>
                      </label>

                      <div className="relative group">
                        <AcademicCapIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />

                        <select
                          value={
                            formData.teacherId
                          }
                          onChange={(e) =>
                            setFormData(
                              (
                                prev
                              ) => ({
                                ...prev,
                                teacherId:
                                  e.target
                                    .value,
                              })
                            )
                          }
                          required
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm shadow-sm cursor-pointer"
                        >
                          <option value="">
                            Choose a teacher...
                          </option>

                          {teachers.map(
                            (t) => (
                              <option
                                key={
                                  t._id
                                }
                                value={
                                  t._id
                                }
                              >
                                {
                                  t.name
                                }{' '}
                                {t.email
                                  ? `— ${t.email}`
                                  : ''}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>

                    {/* STUDENT */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Select Student{' '}
                        <span className="text-red-500">
                          *
                        </span>
                      </label>

                      <div className="relative group">
                        <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />

                        <select
                          value={
                            formData.studentId
                          }
                          onChange={(e) =>
                            setFormData(
                              (
                                prev
                              ) => ({
                                ...prev,
                                studentId:
                                  e.target
                                    .value,
                              })
                            )
                          }
                          required
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm shadow-sm cursor-pointer"
                        >
                          <option value="">
                            Choose a student...
                          </option>

                          {students.map(
                            (s) => (
                              <option
                                key={
                                  s._id
                                }
                                value={
                                  s._id
                                }
                              >
                                {
                                  s.name
                                }{' '}
                                {s.email
                                  ? `— ${s.email}`
                                  : ''}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>

                    {/* COURSE */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Select Course{' '}
                        <span className="text-red-500">
                          *
                        </span>
                      </label>

                      <div className="relative group">
                        <BookOpenIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />

                        <select
                          value={
                            formData.courseId
                          }
                          onChange={(e) =>
                            setFormData(
                              (
                                prev
                              ) => ({
                                ...prev,
                                courseId:
                                  e.target
                                    .value,
                              })
                            )
                          }
                          required
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm shadow-sm cursor-pointer"
                        >
                          <option value="">
                            Choose a course...
                          </option>

                          {courses.map(
                            (c) => (
                              <option
                                key={
                                  c._id
                                }
                                value={
                                  c._id
                                }
                              >
                                {
                                  c.title
                                }
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SCHEDULE */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <CalendarIcon className="w-4 h-4 text-indigo-600" />
                    </div>

                    Weekly Schedule
                  </h4>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-3">
                      Class Days{' '}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                      {DAYS.map(
                        (day) => {
                          const selected =
                            formData.daysOfWeek.includes(
                              day
                            );

                          return (
                            <label
                              key={
                                day
                              }
                              className={`relative cursor-pointer rounded-xl border px-2 py-2.5 text-center transition-all duration-200 ${
                                selected
                                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={
                                  selected
                                }
                                onChange={() =>
                                  handleDayToggle(
                                    day
                                  )
                                }
                                className="sr-only"
                              />

                              <span className="block text-[11px] font-bold tracking-wide uppercase">
                                {
                                  day.slice(
                                    0,
                                    3
                                  )
                                }
                              </span>

                              {selected && (
                                <CheckCircleIcon className="absolute -top-2 -right-2 w-5 h-5 text-indigo-600 bg-white rounded-full shadow-sm" />
                              )}
                            </label>
                          );
                        }
                      )}
                    </div>

                    {formData.daysOfWeek
                      .length ===
                      0 && (
                      <p className="mt-2 text-xs font-medium text-red-500 flex items-center gap-1">
                        <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                        Please select at least one day.
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
                      {/* START */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Start Time{' '}
                          <span className="text-red-500">
                            *
                          </span>
                        </label>

                        <div className="relative group">
                          <ClockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />

                          <input
                            type="time"
                            value={
                              formData.startTime
                            }
                            onChange={(e) =>
                              setFormData(
                                (
                                  prev
                                ) => ({
                                  ...prev,
                                  startTime:
                                    e
                                      .target
                                      .value,
                                })
                              )
                            }
                            required
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm shadow-sm"
                          />
                        </div>
                      </div>

                      {/* END */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          End Time{' '}
                          <span className="text-red-500">
                            *
                          </span>
                        </label>

                        <div className="relative group">
                          <ClockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />

                          <input
                            type="time"
                            value={
                              formData.endTime
                            }
                            onChange={(e) =>
                              setFormData(
                                (
                                  prev
                                ) => ({
                                  ...prev,
                                  endTime:
                                    e
                                      .target
                                      .value,
                                })
                              )
                            }
                            required
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm shadow-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {formData.startTime &&
                      formData.endTime &&
                      formData.endTime >
                        formData.startTime && (
                        <div className="mt-4 px-4 py-3 rounded-xl bg-blue-50/50 border border-blue-100 flex flex-wrap items-center gap-2 text-blue-700 text-xs font-bold">
                          <ClockIcon className="w-4 h-4 text-blue-500" />

                          <span>
                            {formatTime(
                              formData.startTime
                            )}{' '}
                            –{' '}
                            {formatTime(
                              formData.endTime
                            )}
                          </span>

                          <span className="text-blue-300 mx-1">
                            •
                          </span>

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
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <VideoCameraIcon className="w-4 h-4 text-indigo-600" />
                    </div>

                    Zoom Integration

                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full ml-1">
                      (Optional)
                    </span>
                  </h4>

                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    {!formData.zoomLink && (
                      <div className="mb-4">
                        <p className="text-sm text-slate-600">
                          Create an instant Zoom meeting room for this weekly schedule.
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={
                        generateZoomMeeting
                      }
                      disabled={
                        generatingZoom ||
                        submitting ||
                        !canGenerateZoom
                      }
                      className="w-full py-3 bg-white border border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50 text-indigo-700 font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                    >
                      {generatingZoom ? (
                        <>
                          <span className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />

                          Connecting to Zoom...
                        </>
                      ) : (
                        <>
                          <VideoCameraIcon className="w-5 h-5" />

                          {formData.zoomLink
                            ? 'Regenerate Zoom Meeting'
                            : 'Generate Zoom Meeting'}
                        </>
                      )}
                    </button>

                    {!canGenerateZoom &&
                      !formData.zoomLink && (
                        <p className="text-center text-[11px] font-medium text-slate-400 mt-3 flex items-center justify-center gap-1">
                          <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                          Complete participant and schedule details first.
                        </p>
                      )}

                    {formData.zoomLink && (
                      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                        <div className="flex items-center justify-between gap-2 border-b border-emerald-100 pb-3 mb-3">
                          <div className="flex items-center gap-2 text-emerald-700">
                            <CheckCircleIcon className="w-5 h-5" />

                            <span className="font-bold text-sm">
                              Meeting Successfully Created
                            </span>
                          </div>

                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md uppercase tracking-wider">
                            {formData.zoomProvider ||
                              'ZOOM'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {formData.zoomMeetingNumber && (
                            <div className="bg-white rounded-xl p-3 border border-emerald-100 shadow-sm">
                              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                                Meeting ID
                              </p>

                              <p className="font-extrabold text-slate-900 text-sm tracking-wide break-all">
                                {
                                  formData.zoomMeetingNumber
                                }
                              </p>
                            </div>
                          )}

                          {formData.zoomPassword && (
                            <div className="bg-white rounded-xl p-3 border border-emerald-100 shadow-sm">
                              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                                Passcode
                              </p>

                              <p className="font-extrabold text-slate-900 text-sm tracking-wide">
                                {
                                  formData.zoomPassword
                                }
                              </p>
                            </div>
                          )}
                        </div>

                        {/* HOST STATUS */}
                        <div
                          className={`mt-3 rounded-xl border p-3 ${
                            formData.zoomStartUrl
                              ? 'bg-indigo-50 border-indigo-200'
                              : 'bg-amber-50 border-amber-200'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {formData.zoomStartUrl ? (
                              <CheckCircleIcon className="w-5 h-5 text-indigo-600 shrink-0" />
                            ) : (
                              <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 shrink-0" />
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

                        {/* PARTICIPANT TEST LINK */}
                        <a
                          href={
                            formData.zoomLink
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors shadow-sm"
                        >
                          <LinkIcon className="w-4 h-4 stroke-2" />

                          Launch Participant Test Meeting
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* STATUS & NOTES */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <ClipboardDocumentListIcon className="w-4 h-4 text-indigo-600" />
                    </div>

                    Additional Information
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Assignment Status
                      </label>

                      <select
                        value={
                          formData.status
                        }
                        onChange={(e) =>
                          setFormData(
                            (
                              prev
                            ) => ({
                              ...prev,
                              status:
                                e
                                  .target
                                  .value as AssignmentStatus,
                            })
                          )
                        }
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm shadow-sm cursor-pointer"
                      >
                        <option value="scheduled">
                          Scheduled
                        </option>

                        <option value="ongoing">
                          Ongoing
                        </option>

                        <option value="completed">
                          Completed
                        </option>

                        <option value="cancelled">
                          Cancelled
                        </option>
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
                          {
                            formData.notes
                              .length
                          }
                          /1000
                        </span>
                      </div>

                      <textarea
                        value={
                          formData.notes
                        }
                        onChange={(e) =>
                          setFormData(
                            (
                              prev
                            ) => ({
                              ...prev,
                              notes:
                                e
                                  .target
                                  .value,
                            })
                          )
                        }
                        rows={3}
                        maxLength={1000}
                        placeholder="Add any specific instructions, syllabus links, or notes..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none text-sm shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="h-4" />
              </div>

              {/* FOOTER */}
              <div className="shrink-0 bg-white border-t border-slate-200 px-6 py-5 rounded-b-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={
                      closeModal
                    }
                    disabled={
                      submitting ||
                      generatingZoom
                    }
                    className="sm:w-32 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors disabled:opacity-50 text-sm"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      generatingZoom
                    }
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-sm shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                  >
                    {submitting ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />

                        Saving Details...
                      </>
                    ) : (
                      <>
                        {editingAssignment ? (
                          <ArrowPathIcon className="w-5 h-5 stroke-2" />
                        ) : (
                          <CheckCircleIcon className="w-5 h-5 stroke-2" />
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
    </div>
  );
}

