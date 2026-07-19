'use client';

import { Moon } from "lucide-react";

export default function DarkModeToggle() {
  return (
    <button className="border rounded-xl p-2 hover:bg-gray-100">

      <Moon size={20} />

    </button>
  );
}