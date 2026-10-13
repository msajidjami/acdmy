'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  ShareIcon,
  CheckCircleIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

type Contact = {
  _id: string;
  type: 'email' | 'phone';
  name: string;
  email?: string;
  phone?: string;
};

export default function ExternalContactPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/contacts?mode=saved', {
          credentials: 'include',
          cache: 'no-store',
        });
        const data = await res.json();
        const found = (data.contacts || []).find(
          (c: any) => c._id === params.id
        );
        setContact(found || null);
      } catch {
        setContact(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  const shareText = contact
    ? `Join me on ILMORA786!\n\n${contact.name}, create your account:\nhttps://www.quranandislamic.com/signup`
    : '';

  async function copyShare() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-500">Contact not found</p>
          <Link
            href="/contacts"
            className="mt-4 inline-block text-emerald-600 font-semibold"
          >
            Back to Contacts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      {/* Header */}
      <header className="bg-emerald-600 text-white shadow-md">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/contacts"
            className="p-1.5 rounded-full hover:bg-emerald-700 transition"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold truncate">{contact.name}</p>
            <p className="text-[11px] text-white/75">
              {contact.type === 'email' ? 'Email Contact' : 'Phone Contact'}
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Info card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`h-14 w-14 rounded-full flex items-center justify-center text-white ${
                contact.type === 'email'
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                  : 'bg-gradient-to-br from-amber-500 to-orange-600'
              }`}
            >
              {contact.type === 'email' ? (
                <EnvelopeIcon className="h-7 w-7" />
              ) : (
                <PhoneIcon className="h-7 w-7" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-slate-900">
                {contact.name}
              </p>
              <p className="text-sm text-slate-500 truncate">
                {contact.email || contact.phone}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {contact.email && (
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <EnvelopeIcon className="h-4 w-4 text-slate-400" />
                {contact.email}
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <PhoneIcon className="h-4 w-4 text-slate-400" />
                {contact.phone}
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <ClockIcon className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-900">
              Not on ILMORA786 yet
            </p>
            <p className="text-xs text-amber-700 mt-1">
              یہ contact ابھی پلیٹ فارم پر نہیں۔ invite بھیجیں — جب وہ signup کریں گے تو خودبخود link ہو جائیں گے۔
            </p>
          </div>
        </div>

        {/* Invite */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3">
            Invite to Join
          </h3>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-3">
            <p className="text-xs text-slate-600 whitespace-pre-wrap">
              {shareText}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={copyShare}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition"
            >
              {copied ? (
                <>
                  <CheckCircleIcon className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <ShareIcon className="h-4 w-4" />
                  Copy Invite Link
                </>
              )}
            </button>

            {contact.email && (
              <a
                href={`mailto:${contact.email}?subject=Join me on ILMORA786&body=${encodeURIComponent(
                  shareText
                )}`}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition"
              >
                <EnvelopeIcon className="h-4 w-4" />
                Send Email
              </a>
            )}

            {contact.phone && (
              <a
                href={`https://wa.me/${contact.phone.replace(
                  /\D/g,
                  ''
                )}?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* Note */}
        <p className="text-center text-xs text-slate-400 px-4">
          When {contact.name} joins ILMORA786 with this{" "}
          {contact.type === 'email' ? 'email' : 'phone'}, they will automatically
          appear in your contacts.
        </p>
      </div>
    </div>
  );
}