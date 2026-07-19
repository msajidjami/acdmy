// components/enrollment/EnrollmentButton.tsx
'use client';

import { useState } from 'react';
import EnrollmentForm from './EnrollmentForm';

interface EnrollmentButtonProps {
  className?: string;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
}

export default function EnrollmentButton({
  className = '',
  children = 'Enroll Now',
  variant = 'primary',
}: EnrollmentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const variantClasses = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100',
    secondary: 'bg-white hover:bg-gray-50 text-emerald-700 border border-gray-200',
    outline: 'bg-transparent hover:bg-emerald-50 text-emerald-700 border border-emerald-600',
  };

  return (
    <>
      <button
        onClick={openModal}
        className={`px-6 py-3 rounded-lg font-medium transition ${variantClasses[variant]} ${className}`}
      >
        {children}
      </button>
      {isOpen && <EnrollmentForm onClose={closeModal} />}
    </>
  );
}