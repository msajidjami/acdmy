'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, X } from 'lucide-react';

/* STEMBoardOverlay کو dynamic import — بڑی فائل ہے، lazy load */
const STEMBoardOverlay = dynamic(
  () => import('@/app/components/teacher/boards/STEMBoardOverlay'),
  { ssr: false }
);

export default function StemBoardLauncher() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {show && !open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-5 right-5 z-[60] flex items-center gap-2"
          >
            {/* Close button for the launcher itself */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShow(false);
              }}
              className="h-7 w-7 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/70 hover:text-white transition"
              title="Hide"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {/* Main button */}
            <motion.button
              onClick={() => setOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative inline-flex items-center gap-2 h-14 pl-3 pr-5 rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 text-white font-bold shadow-2xl shadow-fuchsia-600/40 hover:shadow-fuchsia-500/60 transition-all"
              title="Open STEM Teaching Board"
            >
              {/* Pulsing ring */}
              <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 opacity-0 group-hover:opacity-100 blur-md -z-10 transition" />

              <span className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </span>

              <span className="flex flex-col items-start leading-tight">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">
                  STEM Board
                </span>
                <span className="text-sm font-bold">Open Board</span>
              </span>

              {/* Sparkle dot */}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400" />
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-screen STEM Board Overlay */}
      {open && (
        <STEMBoardOverlay onClose={() => setOpen(false)} />
      )}
    </>
  );
}