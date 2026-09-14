'use client';

import { motion, AnimatePresence } from 'framer-motion';

export type AcademyContact = {
  name?: string;
  slug?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  academy: AcademyContact;
  teacherName?: string;
  accentColor?: string;
};

export default function ContactModal({
  open,
  onClose,
  academy,
  teacherName,
  accentColor = '#10b981',
}: Props) {
  const hasPhone = Boolean(academy.phone?.trim());
  const hasWhatsapp = Boolean(academy.whatsapp?.trim());
  const hasEmail = Boolean(academy.email?.trim());
  const hasAddress = Boolean(academy.address?.trim());
  const hasWebsite = Boolean(academy.website?.trim());
  const hasAny =
    hasPhone || hasWhatsapp || hasEmail || hasAddress || hasWebsite;

  const waNumber = (academy.whatsapp || academy.phone || '').replace(
    /[^0-9]/g,
    ''
  );

  const waMessage = encodeURIComponent(
    `السلام علیکم! میں نے آپ کی اکیڈمی ${
      academy.name || ''
    } کے بارے میں معلومات دیکھی ہیں${
      teacherName ? ` (ٹیچر: ${teacherName})` : ''
    }۔ مزید معلومات چاہیے۔`
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-x-4 bottom-4 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50 pointer-events-none"
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-auto overflow-hidden pointer-events-auto">
              {/* Header */}
              <div
                className="p-5 text-white relative"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                }}
              >
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
                <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/10 rounded-full" />

                <div className="relative">
                  <p className="text-[11px] font-bold uppercase tracking-wider opacity-90">
                    Contact Academy
                  </p>
                  <h3 className="text-xl font-bold mt-0.5">
                    {academy.name || 'Academy'}
                  </h3>
                  {teacherName && (
                    <p className="text-xs opacity-90 mt-1">
                      ٹیچر: <span className="font-semibold">{teacherName}</span>
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition flex items-center justify-center text-white"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
                {!hasAny && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    <div className="text-4xl mb-2">📭</div>
                    اس اکیڈمی نے ابھی تک کوئی رابطہ معلومات شامل نہیں کیں۔
                  </div>
                )}

                {hasPhone && (
                  <a
                    href={`tel:${academy.phone}`}
                    className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition group"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shadow-md"
                      style={{ background: accentColor }}
                    >
                      📞
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                        Phone
                      </p>
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {academy.phone}
                      </p>
                    </div>
                    <span className="text-gray-300 group-hover:text-emerald-500 transition">
                      →
                    </span>
                  </a>
                )}

                {hasWhatsapp && waNumber && (
                  <a
                    href={`https://wa.me/${waNumber}?text=${waMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 hover:border-green-300 hover:bg-green-50/50 transition group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-lg shadow-md">
                      💬
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                        WhatsApp
                      </p>
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {academy.whatsapp}
                      </p>
                    </div>
                    <span className="text-gray-300 group-hover:text-green-500 transition">
                      →
                    </span>
                  </a>
                )}

                {hasEmail && (
                  <a
                    href={`mailto:${academy.email}?subject=${encodeURIComponent(
                      `Inquiry about ${
                        teacherName ? teacherName + ' - ' : ''
                      }${academy.name || 'Academy'}`
                    )}`}
                    className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50/50 transition group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-lg shadow-md">
                      ✉️
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                        Email
                      </p>
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {academy.email}
                      </p>
                    </div>
                    <span className="text-gray-300 group-hover:text-blue-500 transition">
                      →
                    </span>
                  </a>
                )}

                {hasWebsite && (
                  <a
                    href={academy.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 hover:border-indigo-300 hover:bg-indigo-50/50 transition group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-lg shadow-md">
                      🌐
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                        Website
                      </p>
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {academy.website}
                      </p>
                    </div>
                    <span className="text-gray-300 group-hover:text-indigo-500 transition">
                      →
                    </span>
                  </a>
                )}

                {hasAddress && (
                  <div className="flex items-start gap-3 p-3 rounded-2xl border border-gray-100 bg-gray-50/50">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-lg shadow-md shrink-0">
                      📍
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                        Address
                      </p>
                      <p className="text-sm text-gray-800 leading-relaxed">
                        {academy.address}
                      </p>
                    </div>
                  </div>
                )}

                {/* Social links */}
                {(academy.facebook || academy.instagram || academy.youtube) && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                      Follow on social media
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {academy.facebook && (
                        <a
                          href={academy.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition"
                        >
                          Facebook
                        </a>
                      )}
                      {academy.instagram && (
                        <a
                          href={academy.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-pink-50 text-pink-700 border border-pink-100 hover:bg-pink-100 transition"
                        >
                          Instagram
                        </a>
                      )}
                      {academy.youtube && (
                        <a
                          href={academy.youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 transition"
                        >
                          YouTube
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}