'use client';

import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import {
  Building2,
  Sparkles,
  Mail,
  Link as LinkIcon,
  CheckCircle2,
  Image as ImageIcon,
  Upload,
  Loader2,
  Trash2,
  Palette,
  MapPin,
  RefreshCw,
} from 'lucide-react';

/* ============================================================
   TYPES
   ============================================================ */

type AcademyData = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  thumbnail: string;
  accentColor: string;
  address: string;
  contactEmail: string;
  followerCount: number;
  avgRating: number;
  ratingCount: number;
} | null;

type Props = {
  academy: AcademyData;
  isEditing: boolean;
};

const ACCENT_COLORS = [
  '#10b981', // emerald
  '#0ea5e9', // sky
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#f59e0b', // amber
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#f97316', // orange
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

/* ============================================================
   COMPONENT
   ============================================================ */

export default function AcademyForm({ academy, isEditing }: Props) {
  const [form, setForm] = useState({
    name: academy?.name || '',
    slug: academy?.slug || '',
    description: academy?.description || '',
    contactEmail: academy?.contactEmail || '',
    address: academy?.address || '',
    accentColor: academy?.accentColor || '#10b981',
  });

  /* Logo state */
  const [logoUrl, setLogoUrl] = useState(academy?.logo || '');
  const [logoPreview, setLogoPreview] = useState(academy?.logo || '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  /* Thumbnail state */
  const [thumbnailUrl, setThumbnailUrl] = useState(academy?.thumbnail || '');
  const [thumbnailPreview, setThumbnailPreview] = useState(
    academy?.thumbnail || ''
  );
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  /* ------------------ Upload helpers ------------------ */

  const readAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });

  const uploadFile = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: fd,
      credentials: 'include',
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.url) {
      throw new Error(data?.error || 'Upload failed');
    }
    return String(data.url);
  };

  const validateImage = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file';
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return 'Image must be smaller than 5 MB';
    }
    return null;
  };

  /* ------------------ Logo handlers ------------------ */

  const handleLogoFile = async (file: File) => {
    const err = validateImage(file);
    if (err) {
      toast.error(err);
      return;
    }

    try {
      const preview = await readAsDataUrl(file);
      setLogoPreview(preview);
      setLogoFile(file);
    } catch {
      toast.error('Failed to read image');
    }
  };

  const removeLogo = () => {
    setLogoPreview('');
    setLogoUrl('');
    setLogoFile(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  /* ------------------ Thumbnail handlers ------------------ */

  const handleThumbnailFile = async (file: File) => {
    const err = validateImage(file);
    if (err) {
      toast.error(err);
      return;
    }

    try {
      const preview = await readAsDataUrl(file);
      setThumbnailPreview(preview);
      setThumbnailFile(file);
    } catch {
      toast.error('Failed to read image');
    }
  };

  const removeThumbnail = () => {
    setThumbnailPreview('');
    setThumbnailUrl('');
    setThumbnailFile(null);
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
  };

  /* ------------------ Submit ------------------ */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error('Academy name is required');
      return;
    }
    if (!form.slug.trim()) {
      toast.error('Slug is required');
      return;
    }
    if (!form.description.trim()) {
      toast.error('Description is required');
      return;
    }
    if (!form.contactEmail.trim()) {
      toast.error('Contact email is required');
      return;
    }

    setSubmitting(true);

    try {
      /* ---------- Upload logo if new ---------- */
      let finalLogo = logoUrl;

      if (logoFile) {
        setLogoUploading(true);
        toast.loading('Uploading logo...', { id: 'logo' });
        try {
          finalLogo = await uploadFile(logoFile);
          setLogoUrl(finalLogo);
          toast.success('Logo uploaded', { id: 'logo' });
        } catch (err: any) {
          toast.error(err?.message || 'Logo upload failed', { id: 'logo' });
          throw err;
        } finally {
          setLogoUploading(false);
        }
      }

      /* ---------- Upload thumbnail if new ---------- */
      let finalThumbnail = thumbnailUrl;

      if (thumbnailFile) {
        setThumbnailUploading(true);
        toast.loading('Uploading thumbnail...', { id: 'thumb' });
        try {
          finalThumbnail = await uploadFile(thumbnailFile);
          setThumbnailUrl(finalThumbnail);
          toast.success('Thumbnail uploaded', { id: 'thumb' });
        } catch (err: any) {
          toast.error(err?.message || 'Thumbnail upload failed', {
            id: 'thumb',
          });
          throw err;
        } finally {
          setThumbnailUploading(false);
        }
      }

      /* ---------- Build FormData for API ---------- */
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('slug', form.slug.trim().toLowerCase());
      fd.append('description', form.description.trim());
      fd.append('contactEmail', form.contactEmail.trim().toLowerCase());
      fd.append('address', form.address.trim());
      fd.append('accentColor', form.accentColor);
      fd.append('logo', finalLogo);
      fd.append('thumbnail', finalThumbnail);

      /* ---------- Submit ---------- */
      const res = await fetch('/api/owner/academy', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Failed to save academy');
      }

      /* Success — redirect */
      window.location.href = '/owner/academy?success=true';
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save academy');
    } finally {
      setSubmitting(false);
    }
  };

  /* ------------------ Derived ------------------ */

  const isBusy = submitting || logoUploading || thumbnailUploading;

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-800">
              Academy Details
            </h2>
            <p className="text-[11px] text-slate-500">
              Fields marked with{' '}
              <span className="text-rose-500 font-semibold">*</span> are
              required
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-8 space-y-6">
        {/* ============================================
            THUMBNAIL UPLOAD
        ============================================ */}

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <ImageIcon className="h-4 w-4 text-slate-400" />
            Cover / Thumbnail
            <span className="text-slate-400 text-xs font-normal">
              (optional)
            </span>
          </label>

          <input
            ref={thumbnailInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleThumbnailFile(file);
            }}
            className="hidden"
          />

          {thumbnailPreview ? (
            <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbnailPreview}
                alt="Thumbnail"
                className="w-full h-48 object-cover"
              />

              {thumbnailUploading && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="mx-auto h-8 w-8 text-white animate-spin" />
                    <p className="mt-2 text-xs font-bold text-white">
                      Uploading...
                    </p>
                  </div>
                </div>
              )}

              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => thumbnailInputRef.current?.click()}
                  disabled={isBusy}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/95 hover:bg-white backdrop-blur-sm text-slate-700 text-xs font-bold shadow-md transition disabled:opacity-60"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Replace
                </button>
                <button
                  type="button"
                  onClick={removeThumbnail}
                  disabled={isBusy}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-rose-500/95 hover:bg-rose-600 backdrop-blur-sm text-white shadow-md transition disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {!thumbnailUploading && (
                <div className="absolute bottom-3 left-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                    <CheckCircle2 className="h-3 w-3" />
                    Ready
                  </span>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => thumbnailInputRef.current?.click()}
              disabled={isBusy}
              className="w-full flex items-center gap-3 p-4 border-2 border-dashed border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 rounded-xl transition group disabled:opacity-60"
            >
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition">
                <ImageIcon className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-slate-700">
                  Upload cover image
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Shown as your academy hero background · JPG, PNG · Max 5 MB
                </p>
              </div>
            </button>
          )}
        </div>

        {/* ============================================
            LOGO UPLOAD
        ============================================ */}

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <ImageIcon className="h-4 w-4 text-slate-400" />
            Academy Logo
            <span className="text-slate-400 text-xs font-normal">
              (optional)
            </span>
          </label>

          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleLogoFile(file);
            }}
            className="hidden"
          />

          {logoPreview ? (
            <div className="relative rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 flex items-center gap-4">
              <div className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-white shadow-lg shrink-0 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoPreview}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800">
                  Logo uploaded
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Will appear on your public academy page
                </p>

                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isBusy}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition disabled:opacity-60"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={removeLogo}
                    disabled={isBusy}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 text-xs font-bold transition disabled:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </div>

              {logoUploading && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-emerald-600 animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={isBusy}
              className="w-full flex items-center gap-3 p-4 border-2 border-dashed border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 rounded-xl transition group disabled:opacity-60"
            >
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition">
                <ImageIcon className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-slate-700">
                  Upload academy logo
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Square image works best · JPG, PNG · Max 5 MB
                </p>
              </div>
            </button>
          )}
        </div>

        {/* ============================================
            ACCENT COLOR
        ============================================ */}

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Palette className="h-4 w-4 text-slate-400" />
            Accent Color
          </label>

          <div className="flex items-center gap-2 flex-wrap">
            {ACCENT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm({ ...form, accentColor: c })}
                className={`h-8 w-8 rounded-lg border-2 transition hover:scale-110 active:scale-95 ${
                  form.accentColor.toLowerCase() === c.toLowerCase()
                    ? 'border-slate-900 ring-2 ring-slate-900/20'
                    : 'border-slate-200'
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Use ${c}`}
              />
            ))}

            <input
              type="color"
              value={form.accentColor}
              onChange={(e) =>
                setForm({ ...form, accentColor: e.target.value })
              }
              className="h-8 w-10 rounded-lg border border-slate-200 cursor-pointer p-0"
              title="Custom color"
            />

            <input
              type="text"
              value={form.accentColor}
              onChange={(e) =>
                setForm({ ...form, accentColor: e.target.value })
              }
              className="w-28 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 outline-none text-xs font-mono"
            />
          </div>

          <p className="text-[11px] text-slate-400">
            Used for your academy branding on the public page.
          </p>
        </div>

        {/* ============================================
            ACADEMY NAME
        ============================================ */}

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Building2 className="h-4 w-4 text-slate-400" />
            Academy Name
            <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            placeholder="e.g., Al-Qalam Islamic Academy"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm placeholder:text-slate-400"
          />
        </div>

        {/* ============================================
            SLUG
        ============================================ */}

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <LinkIcon className="h-4 w-4 text-slate-400" />
            Slug (URL)
            <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) =>
              setForm({
                ...form,
                slug: e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9-]/g, '-')
                  .replace(/-+/g, '-'),
              })
            }
            required
            placeholder="al-qalam-academy"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm placeholder:text-slate-400 font-mono"
          />
        </div>

        {/* Slug preview */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
            Your public URL
          </p>
          <p className="text-xs sm:text-sm text-slate-600 truncate font-mono">
            quranandislamic.com/academy/
            <span className="text-emerald-600 font-semibold">
              {form.slug || 'your-slug'}
            </span>
          </p>
        </div>

        {/* ============================================
            DESCRIPTION
        ============================================ */}

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Sparkles className="h-4 w-4 text-slate-400" />
            Description
            <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            rows={4}
            required
            placeholder="Describe your academy, its vision, and what you offer..."
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm resize-none placeholder:text-slate-400 leading-relaxed"
          />
          <p className="text-[11px] text-slate-400">
            This will be shown on your public academy page.
          </p>
        </div>

        {/* ============================================
            CONTACT EMAIL
        ============================================ */}

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Mail className="h-4 w-4 text-slate-400" />
            Contact Email
            <span className="text-rose-500">*</span>
          </label>
          <input
            type="email"
            value={form.contactEmail}
            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            required
            placeholder="academy@example.com"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm placeholder:text-slate-400"
          />
          <p className="text-[11px] text-slate-400">
            Used for inquiries from prospective students.
          </p>
        </div>

        {/* ============================================
            ADDRESS
        ============================================ */}

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <MapPin className="h-4 w-4 text-slate-400" />
            Address
            <span className="text-slate-400 text-xs font-normal">
              (optional)
            </span>
          </label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="e.g., Lahore, Pakistan"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* ============================================
          FORM FOOTER
      ============================================ */}

      <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={isBusy}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all duration-300 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                {isEditing ? 'Save Changes' : 'Create Academy'}
              </>
            )}
          </button>

          <Link
            href="/owner/dashboard"
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-all duration-300"
          >
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}