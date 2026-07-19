'use client';

import { Bell } from "lucide-react";

export default function NotificationBell() {
  return (
    <button className="relative">

      <Bell size={22} />

      <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">

        0

      </span>

    </button>
  );
}