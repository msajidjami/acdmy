// app/components/SyllabusButton.tsx
'use client';

import { useState } from 'react';
import { FileText, X } from 'lucide-react';

interface SyllabusButtonProps {
  courseId: string;
  courseTitle: string;
  syllabusDescription?: string;
  files?: { fileName: string; fileUrl: string }[];
}

export default function SyllabusButton({
  courseId,
  courseTitle,
  syllabusDescription = '',
  files = [],
}: SyllabusButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasContent = files.length > 0 || syllabusDescription.length > 0;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium transition flex items-center gap-1.5 whitespace-nowrap"
      >
        <FileText size={16} /> Syllabus
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {courseTitle} – Syllabus
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {!hasContent ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p>No syllabus content available for this course yet.</p>
                <p className="text-sm mt-1">Please check back later.</p>
              </div>
            ) : (
              <>
                {syllabusDescription && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-wrap">
                      {syllabusDescription}
                    </p>
                  </div>
                )}

                {files.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">PDF Files</h3>
                    <ul className="space-y-2">
                      {files.map((file, idx) => (
                        <li key={idx}>
                          <a
                            href={file.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-teal-600 hover:underline"
                          >
                            <FileText size={16} /> {file.fileName}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}