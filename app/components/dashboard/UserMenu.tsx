'use client';

import { useState } from "react";
import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";

export default function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [open, setOpen] = useState(false);

  return (
    <div className="relative">

      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3"
      >
        <img
          src={user?.avatar || "/avatar.png"}
          className="w-11 h-11 rounded-full border"
          alt=""
        />

        <div className="hidden md:block text-left">

          <h3 className="font-semibold">

            {user?.name}

          </h3>

          <p className="text-xs text-gray-500">

            {user?.email}

          </p>

        </div>

        <ChevronDown size={18} />

      </button>

      {open && (

        <div className="absolute right-0 mt-4 w-64 bg-white rounded-xl shadow-lg border overflow-hidden">

          <button
            onClick={() => router.push("/dashboard/profile")}
            className="flex items-center gap-3 w-full px-5 py-4 hover:bg-gray-100"
          >
            <User size={18} />

            Profile

          </button>

          <button
            onClick={() => router.push("/dashboard/settings")}
            className="flex items-center gap-3 w-full px-5 py-4 hover:bg-gray-100"
          >
            <Settings size={18} />

            Settings

          </button>

          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-5 py-4 hover:bg-red-50 text-red-600"
          >
            <LogOut size={18} />

            Logout

          </button>

        </div>

      )}

    </div>
  );
}