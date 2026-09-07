'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  EnvelopeIcon,
  TrashIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Inquiry {
  _id: string;
  name: string;
  email: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  notes: string;
  createdAt: string;
  updatedAt: string;
  repliedAt?: string;
}

export default function MessagesSection({
  initialInquiries,
  academyId,
}: {
  initialInquiries: Inquiry[];
  academyId: string;
}) {
  const [inquiries, setInquiries] = useState<Inquiry[]>(initialInquiries);
  const [isVisible, setIsVisible] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Inquiry | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

  const deleteInquiry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      const res = await fetch(`/api/owner/inquiries/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Message deleted');
      setInquiries((prev) => prev.filter((i) => i._id !== id));
    } catch (error) {
      toast.error('Error deleting message');
    }
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingTo || !replyText.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/owner/inquiries/${replyingTo._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText.trim() }),
      });
      if (!res.ok) throw new Error('Reply failed');
      toast.success('Reply sent successfully');
      // Update local state
      setInquiries((prev) =>
        prev.map((i) =>
          i._id === replyingTo._id
            ? {
                ...i,
                status: 'replied',
                notes: i.notes
                  ? `${i.notes}\n\n✅ Reply from Owner: ${replyText.trim()}`
                  : `✅ Reply from Owner: ${replyText.trim()}`,
                repliedAt: new Date().toISOString(),
              }
            : i
        )
      );
      setReplyingTo(null);
      setReplyText('');
    } catch (error) {
      toast.error('Error sending reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      new: 'bg-yellow-100 text-yellow-800',
      read: 'bg-blue-100 text-blue-800',
      replied: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
      {/* Header with toggle icon */}
      <div
        className="p-5 border-b border-black/5 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition"
        onClick={toggleVisibility}
      >
        <div className="flex items-center gap-2">
          <EnvelopeIcon className="h-5 w-5 text-gray-600" />
          <h2 className="font-semibold text-black">
            Messages ({inquiries.length})
          </h2>
        </div>
        <button className="text-gray-400 hover:text-gray-600 transition">
          {isVisible ? (
            <XMarkIcon className="h-5 w-5" />
          ) : (
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Messages list - hidden unless visible */}
      {isVisible && (
        <div>
          {inquiries.length > 0 ? (
            <ul className="divide-y divide-black/5">
              {inquiries.map((inquiry) => (
                <li key={inquiry._id} className="p-5 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-black">{inquiry.name}</p>
                        <span className="text-xs text-gray-400">
                          {new Date(inquiry.createdAt).toLocaleDateString()}
                        </span>
                        {getStatusBadge(inquiry.status)}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {inquiry.message}
                      </p>
                      {inquiry.notes && (
                        <p className="text-xs text-gray-500 mt-1 bg-gray-50 p-2 rounded border border-gray-100">
                          📌 {inquiry.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4 flex-shrink-0">
                      <button
                        onClick={() => setReplyingTo(inquiry)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                        title="Reply"
                      >
                        <ChatBubbleLeftRightIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteInquiry(inquiry._id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-8 text-center text-gray-400">No messages yet.</p>
          )}
        </div>
      )}

      {/* Reply Modal */}
      {replyingTo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-black">Reply to {replyingTo.name}</h3>
              <button
                onClick={() => setReplyingTo(null)}
                className="p-2 hover:bg-gray-100 rounded-xl transition"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={sendReply}>
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Original message:</p>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  {replyingTo.message}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Your Reply <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  required
                  placeholder="Write your reply here..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition outline-none resize-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Send Reply'}
                </button>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}