'use client';

import { useState } from 'react';
import { VideoCameraIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/app/hooks/useAuth';
import dynamic from 'next/dynamic';

// ============================================================
// ZOOM MODAL
// ============================================================

const ZoomModal = dynamic(
  () => import('@/app/components/ZoomModal'),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />

            <p className="text-gray-700 font-medium">
              Loading Zoom meeting...
            </p>
          </div>
        </div>
      </div>
    ),
  }
);

// ============================================================
// TYPES
// ============================================================

interface ZoomLinkButtonProps {
  zoomLink: string;
}

interface ZoomMeetingData {
  meetingNumber: string;
  password: string;
}

type ZoomRole = 'host' | 'participant';

// ============================================================
// COMPONENT
// ============================================================

export default function ZoomLinkButton({
  zoomLink,
}: ZoomLinkButtonProps) {
  const { user } = useAuth();

  const [showModal, setShowModal] =
    useState(false);

  // ==========================================================
  // PARSE ZOOM LINK
  // ==========================================================

  const parseZoomLink = (
    url: string
  ): ZoomMeetingData | null => {
    try {
      if (
        !url ||
        typeof url !== 'string'
      ) {
        return null;
      }

      const cleanUrl =
        url.trim();

      if (!cleanUrl) {
        return null;
      }

      const parsedUrl =
        new URL(cleanUrl);

      const pathParts =
        parsedUrl.pathname
          .split('/')
          .filter(Boolean);

      /*
       * Supported Zoom URL:
       *
       * https://us05web.zoom.us/j/89638884879?pwd=xxxxx
       */

      const meetingIndex =
        pathParts.findIndex(
          (part) =>
            part.toLowerCase() ===
            'j'
        );

      if (
        meetingIndex === -1 ||
        !pathParts[
          meetingIndex + 1
        ]
      ) {
        return null;
      }

      const meetingNumber =
        decodeURIComponent(
          pathParts[
            meetingIndex + 1
          ]
        ).trim();

      if (!meetingNumber) {
        return null;
      }

      const password =
        parsedUrl.searchParams.get(
          'pwd'
        )?.trim() || '';

      return {
        meetingNumber,
        password,
      };
    } catch (error) {
      console.error(
        'Failed to parse Zoom meeting URL:',
        error
      );

      return null;
    }
  };

  // ==========================================================
  // NO ZOOM LINK
  // ==========================================================

  if (!zoomLink) {
    return (
      <span className="text-xs text-gray-400 italic">
        No Zoom meeting
      </span>
    );
  }

  // ==========================================================
  // PARSE ZOOM LINK
  // ==========================================================

  const zoomData =
    parseZoomLink(zoomLink);

  if (!zoomData) {
    return (
      <span className="text-xs text-red-500">
        Invalid Zoom link
      </span>
    );
  }

  // ==========================================================
  // USER ROLE
  // ==========================================================

  const isTeacher =
    user?.role === 'teacher';

  const isStudent =
    user?.role === 'student';

  /*
   * IMPORTANT:
   *
   * Teacher:
   *   role = host
   *
   * Student:
   *   role = participant
   *
   * Owner/Admin بھی اگر اس button کو استعمال کرے
   * تو اسے participant رکھا گیا ہے، کیونکہ اس button
   * کا بنیادی مقصد Teacher/Student classroom ہے۔
   */

  const zoomRole: ZoomRole =
    isTeacher
      ? 'host'
      : 'participant';

  // ==========================================================
  // USER INFORMATION
  // ==========================================================

  const userName =
    user?.name?.trim() ||
    (isTeacher
      ? 'Teacher'
      : isStudent
      ? 'Student'
      : 'User');

  const userEmail =
    user?.email?.trim() || '';

  // ==========================================================
  // BUTTON TEXT
  // ==========================================================

  const buttonLabel =
    isTeacher
      ? 'Start Class'
      : 'Join Class';

  // ==========================================================
  // BUTTON STYLE
  // ==========================================================

  const buttonClassName =
    isTeacher
      ? `
        inline-flex
        items-center
        justify-center
        gap-2
        px-4
        py-2
        rounded-xl
        bg-indigo-600
        hover:bg-indigo-700
        active:bg-indigo-800
        text-white
        transition-all
        duration-200
        font-medium
        shadow-sm
        hover:shadow-md
        focus:outline-none
        focus:ring-2
        focus:ring-indigo-500
        focus:ring-offset-2
      `
      : `
        inline-flex
        items-center
        justify-center
        gap-2
        px-4
        py-2
        rounded-xl
        bg-green-600
        hover:bg-green-700
        active:bg-green-800
        text-white
        transition-all
        duration-200
        font-medium
        shadow-sm
        hover:shadow-md
        focus:outline-none
        focus:ring-2
        focus:ring-green-500
        focus:ring-offset-2
      `;

  // ==========================================================
  // OPEN MODAL
  // ==========================================================

  const handleOpen = () => {
    setShowModal(true);
  };

  // ==========================================================
  // CLOSE MODAL
  // ==========================================================

  const handleClose = () => {
    setShowModal(false);
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      {/* ======================================================
          START / JOIN BUTTON
      ====================================================== */}

      <button
        type="button"
        onClick={handleOpen}
        className={buttonClassName}
        title={
          isTeacher
            ? 'Start this class as host'
            : 'Join this class'
        }
      >
        <VideoCameraIcon className="w-5 h-5" />

        {buttonLabel}
      </button>

      {/* ======================================================
          ZOOM MODAL
      ====================================================== */}

      {showModal && (
        <ZoomModal
          meetingNumber={
            zoomData.meetingNumber
          }
          password={
            zoomData.password
          }
          userName={userName}
          userEmail={userEmail}
          zoomLink={zoomLink}

          /*
           * IMPORTANT:
           *
           * Teacher => host
           * Student => participant
           *
           * ZoomModal کو یہ prop استعمال کرتے ہوئے
           * اپنے signature API سے صحیح role لینا ہوگا۔
           */
          role={zoomRole}

          onClose={handleClose}
        />
      )}
    </>
  );
}