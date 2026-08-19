// app/admin/courses/[id]/syllabus/SyllabusManager.tsx
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Upload, X, Trash2, Loader2, File, Save } from 'lucide-react';

interface FileItem {
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  fileSize?: number;
}

interface CourseData {
  id: string;
  title: string;
  description: string;
  files: FileItem[];
  syllabusDescription?: string;
  syllabusUpdatedAt?: string | null;
}

interface SyllabusManagerProps {
  course: CourseData;
}

export default function SyllabusManager({ course }: SyllabusManagerProps) {
  const router = useRouter();
  const [files, setFiles] = useState<FileItem[]>(course.files);
  const [description, setDescription] = useState(course.syllabusDescription || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Save Syllabus Description ──────────────────────────────────
  const handleSaveSyllabus = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/courses/${course.id}/syllabus`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syllabusDescription: description }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Save failed');

      setSuccess('Syllabus saved successfully!');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Upload PDF ──────────────────────────────────────────────────
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      setError('Only PDF files are allowed.');
      return;
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
      setError('File size must be less than 20MB.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch(`/api/admin/courses/${course.id}/syllabus`, {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Upload failed');

      setFiles([...files, result.file]);
      setSuccess('PDF uploaded successfully!');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // ── Delete PDF ──────────────────────────────────────────────────
  const handleDelete = async (fileUrl: string) => {
    if (!confirm('Delete this PDF file?')) return;

    setDeleting(fileUrl);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(
        `/api/admin/courses/${course.id}/syllabus?fileUrl=${encodeURIComponent(fileUrl)}`,
        { method: 'DELETE' }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Delete failed');

      setFiles(files.filter(f => f.fileUrl !== fileUrl));
      setSuccess('PDF deleted successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      {/* Syllabus Description & Save */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Syllabus Details</h2>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Enter a description for this syllabus (optional)..."
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Last saved: {course.syllabusUpdatedAt ? new Date(course.syllabusUpdatedAt).toLocaleString() : 'Never'}
          </span>
          <button
            onClick={handleSaveSyllabus}
            disabled={saving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition disabled:opacity-70 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Syllabus
              </>
            )}
          </button>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Upload PDF</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleUpload}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition disabled:opacity-70 flex items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload PDF
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Only PDF files up to 20MB are allowed.</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">
          {success}
        </div>
      )}

      {/* Files List */}
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-700">
            Syllabus PDFs ({files.length})
          </h2>
        </div>

        {files.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <File className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p>No PDF files uploaded yet.</p>
            <p className="text-sm">Upload PDFs to build the course syllabus.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.fileUrl}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-emerald-300 transition"
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">
                      {file.fileName}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{formatFileSize(file.fileSize)}</span>
                      <span>•</span>
                      <span>Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-600 transition"
                    title="View PDF"
                  >
                    <File className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(file.fileUrl)}
                    disabled={deleting === file.fileUrl}
                    className="p-2 bg-red-50 hover:bg-red-100 rounded-lg text-red-600 transition disabled:opacity-50"
                    title="Delete"
                  >
                    {deleting === file.fileUrl ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Course Info */}
      <div className="bg-white rounded-2xl shadow p-6 border-l-4 border-emerald-500">
        <h3 className="font-semibold text-gray-700">{course.title}</h3>
        <p className="text-sm text-gray-500 mt-1">{course.description || 'No description'}</p>
      </div>
    </div>
  );
}