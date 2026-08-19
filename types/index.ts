// src/types/index.ts
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
}

export interface Teacher {
  _id: string;
  name: string;
}

export interface Classroom {
  _id: string;
  title: string;
  course: string;
  teacher: Teacher | null;
  students?: string[];
  bookUrl?: string;
  zoomMeetingId?: string;
  zoomJoinUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

// AI وائٹ بورڈ کے لیے ڈرائنگ انسٹرکشنز
export interface DrawingInstruction {
  type: 'text' | 'circle' | 'rect' | 'line';
  x?: number;
  y?: number;
  value?: string;
  cx?: number;
  cy?: number;
  r?: number;
  w?: number;
  h?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}

export interface ZoomMeetingResponse {
  joinUrl: string;
  meetingId: string;
  isNew: boolean;
}