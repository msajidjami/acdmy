'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import {
  Mail,
  Eye,
  Clock,
  Archive,
  Reply,
  User,
  Phone,
  Tag,
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

export default function OwnerInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | InquiryStatus>('all');

  const fetchInquiries = async () => {
    try {
      const res = await fetch('/api/owner/inquiries');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setInquiries(data);
    } catch (error) {
      toast.error('Error loading inquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const getStatusBadge = (status: InquiryStatus) => {
    const styles = {
      new: 'bg-red-50 text-red-700 border-red-200',
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      read: 'bg-blue-50 text-blue-700 border-blue-200',
      replied: 'bg-green-50 text-green-700 border-green-200',
      archived: 'bg-gray-50 text-gray-700 border-gray-200',
    };
    const icons = {
      new: <Clock className="h-3 w-3" />,
      pending: <Clock className="h-3 w-3" />,
      read: <Eye className="h-3 w-3" />,
      replied: <Reply className="h-3 w-3" />,
      archived: <Archive className="h-3 w-3" />,
    };
    return (
      <span className={`px-3 py-1 inline-flex items-center gap-1.5 text-xs font-medium rounded-full border ${styles[status]}`}>
        {icons[status]}
        {status}
      </span>
    );
  };

  const getFilterCount = (status: string) => {
    if (status === 'all') return inquiries.length;
    return inquiries.filter((i) => i.status === status).length;
  };

  const filteredInquiries = filter === 'all'
    ? inquiries
    : inquiries.filter((i) => i.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Loading inquiries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-0 pt-0">
      <div className="flex mt-30 flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-2 rounded-xl">
              <Mail className="h-6 w-6" />
            </span>
            Inquiries
            <span className="text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {inquiries.length} total
            </span>
          </h1>
          <p className="text-gray-500 text-sm mt-1 ml-1">Manage all inquiries from your academy</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'new', 'pending', 'read', 'replied', 'archived'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === tab
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              filter === tab ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {getFilterCount(tab)}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">From</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Message</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Received</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredInquiries.map((inquiry, index) => {
                const displayName = inquiry.name || 'Unknown';
                const displayEmail = inquiry.email || 'No email';
                const displayPhone = inquiry.phone || '';
                const displayMessage = inquiry.message || 'No message';
                const displayNotes = inquiry.notes || '';

                return (
                  <tr key={inquiry._id} className={`hover:bg-gray-50/80 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{displayName}</div>
                          <div className="text-xs text-gray-400">{displayEmail}</div>
                          {displayPhone && (
                            <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3" />
                              {displayPhone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/owner/inquiries/${inquiry._id}`}
                        className="block hover:bg-gray-50/50 transition-colors cursor-pointer rounded-lg p-1 -m-1"
                      >
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {displayMessage}
                          {(inquiry.status === 'new' || inquiry.status === 'pending') && (
                            <span className="ml-2 inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          )}
                        </div>
                        {displayNotes && (
                          <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {displayNotes}
                          </div>
                        )}
                      </Link>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(inquiry.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {inquiry.createdAt
                        ? new Date(inquiry.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/owner/inquiries/${inquiry._id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filteredInquiries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                        <Mail className="h-10 w-10 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">No inquiries found</p>
                        <p className="text-gray-400 text-sm mt-1">
                          {filter === 'all'
                            ? 'No inquiries have been received yet.'
                            : `No ${filter} inquiries found.`}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}