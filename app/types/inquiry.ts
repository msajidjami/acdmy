import { Types } from 'mongoose';

/* ============================================================
   INQUIRY STATUS
   ============================================================ */

export type InquiryStatus = 'new' | 'read' | 'replied' | 'archived';

export const VALID_INQUIRY_STATUSES: InquiryStatus[] = [
  'new',
  'read',
  'replied',
  'archived',
];

export function normalizeInquiryStatus(raw: unknown): InquiryStatus {
  const s = String(raw || 'new').toLowerCase();
  if (VALID_INQUIRY_STATUSES.includes(s as InquiryStatus)) {
    return s as InquiryStatus;
  }
  // Legacy mapping
  if (s === 'pending' || s === 'unread') return 'new';
  return 'new';
}

/* ============================================================
   SERIALIZED INQUIRY (client-side safe)
   ============================================================ */

export interface SerializedInquiry {
  _id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  academyId: string;
  status: InquiryStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
  repliedAt?: string;
}

/* ============================================================
   MONGOOSE INQUIRY (server-side)
   ============================================================ */

export interface InquiryDocument {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  message: string;
  academyId: Types.ObjectId;
  status: InquiryStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  repliedAt?: Date;
}

/* ============================================================
   SERIALIZER
   ============================================================ */

export function serializeInquiry(inquiry: any): SerializedInquiry {
  return {
    _id: String(inquiry._id),
    name: String(inquiry.name || ''),
    email: String(inquiry.email || ''),
    phone: String(inquiry.phone || ''),
    message: String(inquiry.message || ''),
    academyId: String(inquiry.academyId),
    status: normalizeInquiryStatus(inquiry.status),
    notes: String(inquiry.notes || ''),
    createdAt: inquiry.createdAt
      ? new Date(inquiry.createdAt).toISOString()
      : new Date().toISOString(),
    updatedAt: inquiry.updatedAt
      ? new Date(inquiry.updatedAt).toISOString()
      : new Date().toISOString(),
    repliedAt: inquiry.repliedAt
      ? new Date(inquiry.repliedAt).toISOString()
      : undefined,
  };
}