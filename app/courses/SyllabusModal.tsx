// app/courses/SyllabusModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, File, Loader2 } from 'lucide-react';

interface SyllabusFile {
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  fileSize?: number;
}

interface SyllabusData {
  title: string;
  description: string;
  files: SyllabusFile[];
}

interface SyllabusModalProps {
  courseId: string;
  courseTitle: string;
  onClose: () => void;
}

export default function SyllabusModal({ courseId, courseTitle, onClose }: SyllabusModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SyllabusData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSyllabus = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/courses/${courseId}/syllabus`);
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed to load syllabus');
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSyllabus();
  }, [courseId]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Syllabus: {courseTitle}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p>{error}</p>
            </div>
          ) : data && data.files.length === 0 && !data.description ? (
            <div className="text-center py-8 text-gray-500">
              <File className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p>No syllabus materials available for this course.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Description */}
              {data?.description && (
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{data.description}</p>
                </div>
              )}

              {/* PDF Files */}
              {data?.files && data.files.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Materials ({data.files.length})
                  </h3>
                  <div className="space-y-2">
                    {data.files.map((file) => (
                      <a
                        key={file.fileUrl}
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition group"
                      >
                        <File className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                            {file.fileName}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {formatFileSize(file.fileSize)} • {new Date(file.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-xs text-purple-600 dark:text-purple-400 group-hover:underline">
                          View PDF
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}