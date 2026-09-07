'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Mail,
  User,
  Phone,
  MessageSquare,
  Tag,
  Calendar,
  Clock,
  Eye,
  Archive,
  Reply,
} from 'lucide-react';

type InquiryStatus = 'new' | 'pending' | 'read' | 'replied' | 'archived';

interface Inquiry {
  _id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: InquiryStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
  repliedAt?: string;
}

export default function InquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ خودکار Read کرنے کا فنکشن (خاموش)
  const markAsRead = async (inquiryId: string) => {
    try {
      const res = await fetch('/api/owner/inquiries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inquiryId, status: 'read' }),
      });
      if (!res.ok) {
        console.error('Failed to mark as read:', await res.text());
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const fetchInquiry = async () => {
    try {
      const res = await fetch(`/api/owner/inquiries/${id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      console.log('📩 Inquiry loaded:', data.status);

      // ✅ اگر 'new' یا 'pending' ہے تو فوری Read کریں
      if (data.status === 'new' || data.status === 'pending') {
        setInquiry({ ...data, status: 'read' });
        await markAsRead(data._id);
      } else {
        setInquiry(data);
      }
    } catch (error) {
      console.error('Error loading inquiry:', error);
      toast.error('Error loading inquiry');
      router.push('/owner/inquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiry();
  }, [id]);

  const getStatusBadge = (status: InquiryStatus) => {
    const styles = {
      new: 'bg-red-50 text-red-700 border-red-200',
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      read: 'bg-blue-50 text-blue-700 border-blue-200',
      replied: 'bg-green-50 text-green-700 border-green-200',
      archived: 'bg-gray-50 text-gray-700 border-gray-200',
    };
    const icons = {
      new: <Clock className="h-4 w-4" />,
      pending: <Clock className="h-4 w-4" />,
      read: <Eye className="h-4 w-4" />,
      replied: <Reply className="h-4 w-4" />,
      archived: <Archive className="h-4 w-4" />,
    };
    return (
      <span className={`px-4 py-2 inline-flex items-center gap-2 text-sm font-medium rounded-full border ${styles[status]}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Loading inquiry...</p>
        </div>
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Inquiry not found</p>
          <button
            onClick={() => router.push('/owner/inquiries')}
            className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Back to Inquiries
          </button>
        </div>
      </div>
    );
  }

  const displayName = inquiry.name || 'Unknown';
  const displayEmail = inquiry.email || 'No email';
  const displayMessage = inquiry.message || 'No message';
  const displayNotes = inquiry.notes || '';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => router.push('/owner/inquiries')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6 group"
      >
        <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Back to Inquiries</span>
      </button>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {displayEmail}
                </p>
              </div>
            </div>
            <div>
              {getStatusBadge(inquiry.status)}
            </div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <User className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-xs text-gray-400 font-medium">Name</p>
                <p className="text-sm font-medium text-gray-900">{displayName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Mail className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-xs text-gray-400 font-medium">Email</p>
                <p className="text-sm font-medium text-gray-900">{displayEmail}</p>
              </div>
            </div>
            {inquiry.phone && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Phone className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-xs text-gray-400 font-medium">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{inquiry.phone}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Calendar className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-xs text-gray-400 font-medium">Received</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(inquiry.createdAt).toLocaleString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">Message</h2>
            </div>
            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {displayMessage}
              </p>
            </div>
          </div>

          {displayNotes && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-gray-700 whitespace-pre-wrap">{displayNotes}</p>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-400 border-t border-gray-100 pt-4 flex flex-wrap gap-4">
            <span>Created: {new Date(inquiry.createdAt).toLocaleString()}</span>
            <span>Updated: {new Date(inquiry.updatedAt).toLocaleString()}</span>
            {inquiry.repliedAt && (
              <span>Replied: {new Date(inquiry.repliedAt).toLocaleString()}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}