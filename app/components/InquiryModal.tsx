'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';

interface InquiryModalProps {
  academyId: string;
  academyName: string;
}

export default function InquiryModal({ academyId, academyName }: InquiryModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  const openModal = () => {
    dialogRef.current?.showModal();
  };

  const closeModal = () => {
    dialogRef.current?.close();
  };

  return (
    <>
      {/* بٹن جو Modal کھولے گا */}
      <button
        onClick={openModal}
        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold rounded-2xl shadow-lg shadow-green-600/20 hover:shadow-green-600/40 transition-all duration-300 flex items-center justify-center gap-2"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Contact Owner
      </button>

      {/* ڈائیلاگ (Modal) */}
      <dialog
        ref={dialogRef}
        className="rounded-3xl shadow-2xl p-8 max-w-md backdrop:bg-black/50 border-0"
      >
        <h3 className="text-2xl font-bold text-black mb-2">
          📩 Contact {academyName}
        </h3>
        <p className="text-sm text-black/60 mb-6">
          The owner will receive your message and reply soon.
        </p>
        <form action="/api/inquiry" method="POST" className="space-y-5">
          <input type="hidden" name="academyId" value={academyId} />
          <div>
            <label className="block text-sm font-medium text-black/80">Your Name</label>
            <input
              type="text"
              name="visitorName"
              required
              className="w-full mt-1 px-4 py-3 border border-black/20 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black/80">Your Email</label>
            <input
              type="email"
              name="visitorEmail"
              required
              className="w-full mt-1 px-4 py-3 border border-black/20 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black/80">Message</label>
            <textarea
              name="message"
              rows={3}
              required
              className="w-full mt-1 px-4 py-3 border border-black/20 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition bg-white"
              placeholder="I want to enroll my child..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition"
            >
              Send Message
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 bg-black/5 hover:bg-black/10 text-black font-semibold py-3 rounded-xl transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}