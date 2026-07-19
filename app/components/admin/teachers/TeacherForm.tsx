'use client';

import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  Info,
  Upload,
  Mic,
  Video,
  FileText,
  CheckCircle,
  X,
  Plus,
} from 'lucide-react';

// ==============================
// Zod Validation Schema (no defaults)
// ==============================

const teacherFormSchema = z.object({
  fullName: z.string().min(1, 'Full Name is required'),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  phone: z.string().optional(),
  gender: z.enum(['male', 'female']),
  country: z.string().optional(),
  city: z.string().optional(),
  timezone: z.string().optional(),
  qualification: z.string().min(1, 'Qualification is required'),
  experience: z.number().min(0, 'Experience cannot be negative'),
  languages: z.array(z.string()),
  subjects: z.array(z.string()),
  bio: z.string().min(1, 'Bio is required'),
  zoomEmail: z.string().email('Invalid email address').min(1, 'Zoom Email is required'),
  isVerified: z.boolean(),
  active: z.boolean(),
});

type TeacherFormValues = z.infer<typeof teacherFormSchema>;

// ==============================
// Types for Props
// ==============================

export interface TeacherFormProps {
  initialData?: Partial<TeacherFormValues> & {
    avatar?: string;
    introAudio?: string;
    introVideo?: string;
    certificates?: string[];
  };
  onSubmit: (data: FormData | TeacherSubmission) => void;
  languageOptions: { label: string; value: string }[];
  subjectOptions: { label: string; value: string }[];
  isLoading?: boolean;
}

export interface TeacherSubmission extends TeacherFormValues {
  avatar?: File | string;
  introAudio?: File | string;
  introVideo?: File | string;
  certificates?: (File | string)[];
}

// ==============================
// Constants
// ==============================

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20 MB

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const ACCEPTED_CERT_TYPES = [...ACCEPTED_IMAGE_TYPES, 'application/pdf'];

// ==============================
// Reusable Input Components
// ==============================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  containerClassName = '',
  className = '',
  id,
  ...props
}) => {
  const inputId = id || label.toLowerCase().replace(/\s/g, '-');
  return (
    <div className={`mb-4 ${containerClassName}`}>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`
            w-full rounded-lg border border-gray-300 dark:border-gray-600 
            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
            px-4 py-2.5 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-red-500 dark:border-red-400' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  containerClassName?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  containerClassName = '',
  className = '',
  id,
  rows = 4,
  ...props
}) => {
  const textareaId = id || label.toLowerCase().replace(/\s/g, '-');
  return (
    <div className={`mb-4 ${containerClassName}`}>
      <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <textarea
        id={textareaId}
        rows={rows}
        className={`
          w-full rounded-lg border border-gray-300 dark:border-gray-600 
          bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
          px-4 py-2.5 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${error ? 'border-red-500 dark:border-red-400' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { label: string; value: string }[];
  error?: string;
  containerClassName?: string;
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  containerClassName = '',
  className = '',
  id,
  placeholder,
  ...props
}) => {
  const selectId = id || label.toLowerCase().replace(/\s/g, '-');
  return (
    <div className={`mb-4 ${containerClassName}`}>
      <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <select
        id={selectId}
        className={`
          w-full rounded-lg border border-gray-300 dark:border-gray-600 
          bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
          px-4 py-2.5 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${error ? 'border-red-500 dark:border-red-400' : ''}
          ${className}
        `}
        {...props}
      >
        <option value="">{placeholder || 'Select...'}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};

interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  containerClassName?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  label,
  checked,
  onChange,
  disabled = false,
  containerClassName = '',
}) => {
  return (
    <div className={`flex items-center justify-between mb-4 ${containerClassName}`}>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  );
};

// ==============================
// MultiSelect Component (Controlled)
// ==============================

interface MultiSelectProps {
  label: string;
  options: { label: string; value: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  error?: string;
  containerClassName?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  selected,
  onChange,
  placeholder = 'Select options...',
  error,
  containerClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const removeTag = (value: string) => {
    onChange(selected.filter((v) => v !== value));
  };

  const selectedLabels = selected.map((v) => options.find((o) => o.value === v)?.label || v);

  return (
    <div className={`mb-4 ${containerClassName}`} ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <div
        className={`
          relative w-full rounded-lg border border-gray-300 dark:border-gray-600 
          bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
          px-4 py-2.5 transition-colors focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent
          ${error ? 'border-red-500 dark:border-red-400' : ''}
          cursor-pointer
        `}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1.5">
          {selectedLabels.length === 0 ? (
            <span className="text-gray-400 dark:text-gray-500">{placeholder}</span>
          ) : (
            selectedLabels.map((label, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-sm text-blue-800 dark:text-blue-200"
              >
                {label}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(selected[idx]);
                  }}
                  className="hover:text-red-600 dark:hover:text-red-400"
                >
                  <X size={14} />
                </button>
              </span>
            ))
          )}
        </div>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg max-h-60 overflow-auto">
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => toggleOption(opt.value)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-200">{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

// ==============================
// Single File Upload Component (Controlled)
// ==============================

interface SingleFileUploadProps {
  label: string;
  accept: string;
  maxSize: number;
  file: File | null;
  onFileChange: (file: File | null) => void;
  previewUrl?: string;
  onRemove?: () => void;
  error?: string;
  containerClassName?: string;
  icon?: React.ReactNode;
  previewType?: 'image' | 'audio' | 'video';
}

export const SingleFileUpload: React.FC<SingleFileUploadProps> = ({
  label,
  accept,
  maxSize,
  file,
  onFileChange,
  previewUrl,
  onRemove,
  error,
  containerClassName = '',
  icon,
  previewType = 'image',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewObjectURL, setPreviewObjectURL] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewObjectURL(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewObjectURL(null);
    }
  }, [file]);

  const displayUrl = file ? previewObjectURL : previewUrl || null;
  const isExisting = !file && previewUrl;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const allowedTypes = accept.split(',').map((t) => t.trim());
    if (!allowedTypes.includes(selectedFile.type)) {
      alert(`Please upload a valid file type: ${allowedTypes.join(', ')}`);
      return;
    }
    if (selectedFile.size > maxSize) {
      alert(`File size exceeds maximum allowed (${maxSize / (1024 * 1024)} MB)`);
      return;
    }

    onFileChange(selectedFile);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemove = () => {
    onFileChange(null);
    if (onRemove) onRemove();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={`mb-4 ${containerClassName}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <div className="flex flex-col gap-2">
        {displayUrl && (
          <div className="relative rounded-lg border border-gray-200 dark:border-gray-700 p-2 bg-gray-50 dark:bg-gray-800/50">
            {previewType === 'image' && (
              <img src={displayUrl} alt="Preview" className="max-h-48 w-auto rounded object-contain" />
            )}
            {previewType === 'audio' && (
              <audio controls src={displayUrl} className="w-full max-w-md" />
            )}
            {previewType === 'video' && (
              <video controls src={displayUrl} className="max-h-48 w-auto rounded" />
            )}
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 rounded-full bg-red-100 dark:bg-red-900/30 p-1 text-red-600 hover:bg-red-200 dark:hover:bg-red-800"
            >
              <X size={16} />
            </button>
            {isExisting && (
              <span className="absolute bottom-2 left-2 text-xs text-gray-500 dark:text-gray-400">Existing file</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {icon || <Upload size={18} />}
            {file ? 'Replace File' : 'Upload File'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
          {file && (
            <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
              {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </span>
          )}
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </div>
  );
};

// ==============================
// Multiple File Upload Component
// ==============================

interface MultipleFileUploadProps {
  label: string;
  accept: string;
  maxSize: number;
  files: File[];
  onFilesChange: (files: File[]) => void;
  existingUrls?: string[];
  onRemoveExisting?: (index: number) => void;
  error?: string;
  containerClassName?: string;
  icon?: React.ReactNode;
}

export const MultipleFileUpload: React.FC<MultipleFileUploadProps> = ({
  label,
  accept,
  maxSize,
  files,
  onFilesChange,
  existingUrls = [],
  onRemoveExisting,
  error,
  containerClassName = '',
  icon,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const validFiles: File[] = [];
    const allowedTypes = accept.split(',').map((t) => t.trim());
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (!allowedTypes.includes(file.type)) {
        alert(`Invalid file type: ${file.name}. Allowed: ${allowedTypes.join(', ')}`);
        continue;
      }
      if (file.size > maxSize) {
        alert(`File too large: ${file.name} (max ${maxSize / (1024 * 1024)} MB)`);
        continue;
      }
      validFiles.push(file);
    }
    if (validFiles.length > 0) {
      onFilesChange([...files, ...validFiles]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onFilesChange(newFiles);
  };

  const allItems = [
    ...existingUrls.map((url, idx) => ({ type: 'existing' as const, url, idx })),
    ...files.map((file, idx) => ({ type: 'new' as const, file, idx })),
  ];

  return (
    <div className={`mb-4 ${containerClassName}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          {allItems.map((item, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-sm text-gray-700 dark:text-gray-200"
            >
              <FileText size={14} />
              <span className="truncate max-w-xs">
                {item.type === 'existing' ? item.url.split('/').pop() || 'Certificate' : item.file.name}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (item.type === 'existing') {
                    if (onRemoveExisting) onRemoveExisting(item.idx);
                  } else {
                    removeFile(item.idx);
                  }
                }}
                className="hover:text-red-600 dark:hover:text-red-400"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {allItems.length === 0 && (
            <span className="text-sm text-gray-400 dark:text-gray-500">No certificates uploaded</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {icon || <Plus size={18} />}
            Add Certificate
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </div>
  );
};

// ==============================
// Main TeacherForm Component using React Hook Form + Zod
// ==============================

export const TeacherForm: React.FC<TeacherFormProps> = ({
  initialData = {},
  onSubmit,
  languageOptions,
  subjectOptions,
  isLoading = false,
}) => {
  // ==============================
  // React Hook Form setup
  // ==============================

  const defaultValues: TeacherFormValues = {
    fullName: initialData.fullName || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    gender: initialData.gender || 'male',
    country: initialData.country || '',
    city: initialData.city || '',
    timezone: initialData.timezone || '',
    qualification: initialData.qualification || '',
    experience: initialData.experience ?? 0,
    languages: initialData.languages || [],
    subjects: initialData.subjects || [],
    bio: initialData.bio || '',
    zoomEmail: initialData.zoomEmail || '',
    isVerified: initialData.isVerified ?? false,
    active: initialData.active ?? true,
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues,
  });

  // ==============================
  // File state (outside react-hook-form for simplicity)
  // ==============================

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [introAudioFile, setIntroAudioFile] = useState<File | null>(null);
  const [introVideoFile, setIntroVideoFile] = useState<File | null>(null);
  const [certificateFiles, setCertificateFiles] = useState<File[]>([]);

  // Existing URLs from initialData
  const existingAvatar = initialData.avatar || null;
  const existingAudio = initialData.introAudio || null;
  const existingVideo = initialData.introVideo || null;
  const existingCertificates = initialData.certificates || [];

  // Removal flags for existing files
  const [removeExistingAvatar, setRemoveExistingAvatar] = useState(false);
  const [removeExistingAudio, setRemoveExistingAudio] = useState(false);
  const [removeExistingVideo, setRemoveExistingVideo] = useState(false);
  const [removeExistingCertificates, setRemoveExistingCertificates] = useState<number[]>([]);

  // ==============================
  // Handlers for file changes
  // ==============================

  const handleAvatarChange = (file: File | null) => {
    setAvatarFile(file);
    if (file) setRemoveExistingAvatar(true);
  };

  const handleAvatarRemove = () => {
    setAvatarFile(null);
    setRemoveExistingAvatar(true);
  };

  const handleAudioChange = (file: File | null) => {
    setIntroAudioFile(file);
    if (file) setRemoveExistingAudio(true);
  };

  const handleAudioRemove = () => {
    setIntroAudioFile(null);
    setRemoveExistingAudio(true);
  };

  const handleVideoChange = (file: File | null) => {
    setIntroVideoFile(file);
    if (file) setRemoveExistingVideo(true);
  };

  const handleVideoRemove = () => {
    setIntroVideoFile(null);
    setRemoveExistingVideo(true);
  };

  const handleCertificatesChange = (files: File[]) => {
    setCertificateFiles(files);
  };

  const handleRemoveExistingCert = (index: number) => {
    setRemoveExistingCertificates((prev) => [...prev, index]);
  };

  // ==============================
  // Submission handler
  // ==============================

  const onFormSubmit = (data: TeacherFormValues) => {
    // Build submission object
    const submission: TeacherSubmission = {
      ...data,
    };

    // Add files if present
    if (avatarFile) {
      submission.avatar = avatarFile;
    } else if (existingAvatar && !removeExistingAvatar) {
      submission.avatar = existingAvatar;
    }

    if (introAudioFile) {
      submission.introAudio = introAudioFile;
    } else if (existingAudio && !removeExistingAudio) {
      submission.introAudio = existingAudio;
    }

    if (introVideoFile) {
      submission.introVideo = introVideoFile;
    } else if (existingVideo && !removeExistingVideo) {
      submission.introVideo = existingVideo;
    }

    // Certificates
    const certs: (File | string)[] = [];
    existingCertificates.forEach((url, idx) => {
      if (!removeExistingCertificates.includes(idx)) {
        certs.push(url);
      }
    });
    certificateFiles.forEach((file) => certs.push(file));
    if (certs.length > 0) {
      submission.certificates = certs;
    }

    // Pass to parent (which can decide to convert to FormData)
    onSubmit(submission);
  };

  // ==============================
  // Timezone options from Intl
  // ==============================

  const timezoneOptions = React.useMemo(() => {
    try {
      const tz = Intl.supportedValuesOf('timeZone');
      return tz.map((z) => ({ label: z, value: z }));
    } catch {
      // Fallback
      return [
        { label: 'America/New_York', value: 'America/New_York' },
        { label: 'Europe/London', value: 'Europe/London' },
        { label: 'Asia/Kolkata', value: 'Asia/Kolkata' },
        { label: 'Asia/Dubai', value: 'Asia/Dubai' },
        { label: 'Australia/Sydney', value: 'Australia/Sydney' },
      ];
    }
  }, []);

  // ==============================
  // Country options (static)
  // ==============================

  const countryOptions = [
    { label: 'United States', value: 'United States' },
    { label: 'United Kingdom', value: 'United Kingdom' },
    { label: 'Canada', value: 'Canada' },
    { label: 'Australia', value: 'Australia' },
    { label: 'Germany', value: 'Germany' },
    { label: 'France', value: 'France' },
    { label: 'India', value: 'India' },
    { label: 'Pakistan', value: 'Pakistan' },
    { label: 'UAE', value: 'UAE' },
    { label: 'Other', value: 'Other' },
  ];

  // ==============================
  // Render
  // ==============================

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
      {/* Section 1: Basic Information */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <User size={20} className="text-blue-600" /> Basic Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="fullName"
            control={control}
            render={({ field }) => (
              <Input
                label="Full Name"
                type="text"
                {...field}
                error={errors.fullName?.message}
                icon={<User size={18} />}
                placeholder="John Doe"
                required
              />
            )}
          />
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                label="Email"
                type="email"
                {...field}
                error={errors.email?.message}
                icon={<Mail size={18} />}
                placeholder="john@example.com"
                required
              />
            )}
          />
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <Input
                label="Phone"
                type="tel"
                {...field}
                error={errors.phone?.message}
                icon={<Phone size={18} />}
                placeholder="+1234567890"
              />
            )}
          />
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <Select
                label="Gender"
                options={[
                  { label: 'Male', value: 'male' },
                  { label: 'Female', value: 'female' },
                ]}
                value={field.value}
                onChange={field.onChange}
                error={errors.gender?.message}
                required
              />
            )}
          />
        </div>
      </section>

      {/* Section 2: Location */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <MapPin size={20} className="text-blue-600" /> Location
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Controller
            name="country"
            control={control}
            render={({ field }) => (
              <Select
                label="Country"
                options={countryOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.country?.message}
                placeholder="Select country"
              />
            )}
          />
          <Controller
            name="city"
            control={control}
            render={({ field }) => (
              <Input
                label="City"
                type="text"
                {...field}
                error={errors.city?.message}
                placeholder="New York"
              />
            )}
          />
          <Controller
            name="timezone"
            control={control}
            render={({ field }) => (
              <Select
                label="Timezone"
                options={timezoneOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.timezone?.message}
                placeholder="Select timezone"
              />
            )}
          />
        </div>
      </section>

      {/* Section 3: Professional */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <GraduationCap size={20} className="text-blue-600" /> Professional
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="qualification"
            control={control}
            render={({ field }) => (
              <Input
                label="Qualification"
                type="text"
                {...field}
                error={errors.qualification?.message}
                icon={<GraduationCap size={18} />}
                placeholder="M.Sc. Computer Science"
                required
              />
            )}
          />
          <Controller
            name="experience"
            control={control}
            render={({ field }) => (
              <Input
                label="Experience (Years)"
                type="number"
                min="0"
                step="0.5"
                {...field}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                error={errors.experience?.message}
                icon={<Briefcase size={18} />}
                placeholder="0"
              />
            )}
          />
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="languages"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  label="Languages"
                  options={languageOptions}
                  selected={field.value}
                  onChange={field.onChange}
                  error={errors.languages?.message}
                  placeholder="Select languages..."
                />
              )}
            />
            <Controller
              name="subjects"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  label="Subjects"
                  options={subjectOptions}
                  selected={field.value}
                  onChange={field.onChange}
                  error={errors.subjects?.message}
                  placeholder="Select subjects..."
                />
              )}
            />
          </div>
        </div>
      </section>

      {/* Section 4: About */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <Info size={20} className="text-blue-600" /> About
        </h2>
        <Controller
          name="bio"
          control={control}
          render={({ field }) => (
            <Textarea
              label="Bio"
              {...field}
              error={errors.bio?.message}
              rows={4}
              placeholder="Tell us about the teacher..."
              required
            />
          )}
        />
      </section>

      {/* Section 5: Uploads */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <Upload size={20} className="text-blue-600" /> Uploads
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SingleFileUpload
            label="Profile Image"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            maxSize={MAX_IMAGE_SIZE}
            file={avatarFile}
            onFileChange={handleAvatarChange}
            previewUrl={(!removeExistingAvatar && existingAvatar) || undefined}
            onRemove={handleAvatarRemove}
            icon={<Upload size={18} />}
            previewType="image"
          />
          <SingleFileUpload
            label="Intro Audio"
            accept={ACCEPTED_AUDIO_TYPES.join(',')}
            maxSize={MAX_AUDIO_SIZE}
            file={introAudioFile}
            onFileChange={handleAudioChange}
            previewUrl={(!removeExistingAudio && existingAudio) || undefined}
            onRemove={handleAudioRemove}
            icon={<Mic size={18} />}
            previewType="audio"
          />
          <SingleFileUpload
            label="Intro Video"
            accept={ACCEPTED_VIDEO_TYPES.join(',')}
            maxSize={MAX_VIDEO_SIZE}
            file={introVideoFile}
            onFileChange={handleVideoChange}
            previewUrl={(!removeExistingVideo && existingVideo) || undefined}
            onRemove={handleVideoRemove}
            icon={<Video size={18} />}
            previewType="video"
          />
          <MultipleFileUpload
            label="Certificates"
            accept={ACCEPTED_CERT_TYPES.join(',')}
            maxSize={MAX_IMAGE_SIZE}
            files={certificateFiles}
            onFilesChange={handleCertificatesChange}
            existingUrls={existingCertificates.filter((_, idx) => !removeExistingCertificates.includes(idx))}
            onRemoveExisting={handleRemoveExistingCert}
            icon={<FileText size={18} />}
          />
        </div>
      </section>

      {/* Section 6: Zoom */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <Video size={20} className="text-blue-600" /> Zoom
        </h2>
        <Controller
          name="zoomEmail"
          control={control}
          render={({ field }) => (
            <Input
              label="Zoom Email"
              type="email"
              {...field}
              error={errors.zoomEmail?.message}
              icon={<Mail size={18} />}
              placeholder="teacher@zoom.us"
              required
            />
          )}
        />
      </section>

      {/* Section 7: Teacher Status */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <CheckCircle size={20} className="text-blue-600" /> Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="isVerified"
            control={control}
            render={({ field }) => (
              <Switch
                label="Verified"
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            name="active"
            control={control}
            render={({ field }) => (
              <Switch
                label="Active"
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      </section>

      {/* Submit */}
      <div className="flex justify-end border-t border-gray-200 dark:border-gray-700 pt-6">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            'Save Teacher'
          )}
        </button>
      </div>
    </form>
  );
};

export default TeacherForm;