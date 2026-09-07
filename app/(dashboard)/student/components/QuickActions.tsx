'use client';

import { useRouter } from 'next/navigation';

import {
    Video,
    BookOpen,
    Brain,
    Calendar,
    Library,
    User,
} from 'lucide-react';

export default function QuickActions() {

    const router = useRouter();

    const actions = [

        {
            title: 'Join Class',
            icon: Video,
            href: '/dashboard/student/classes',
            color: 'bg-green-500',
        },

        {
            title: 'Homework',
            icon: BookOpen,
            href: '/dashboard/student/homework',
            color: 'bg-blue-500',
        },

        {
            title: 'Islamic AI',
            icon: Brain,
            href: '/dashboard/ai',
            color: 'bg-pink-500',
        },

        {
            title: 'Schedule',
            icon: Calendar,
            href: '/dashboard/student/calendar',
            color: 'bg-orange-500',
        },

        {
            title: 'Library',
            icon: Library,
            href: '/articles',
            color: 'bg-indigo-500',
        },

        {
            title: 'Profile',
            icon: User,
            href: '/dashboard/profile',
            color: 'bg-purple-500',
        },

    ];

    return (

        <div className="bg-white rounded-2xl shadow-sm border p-6">

            <h2 className="font-bold text-xl mb-6">

                Quick Actions

            </h2>

            <div className="grid grid-cols-2 gap-4">

                {actions.map((item) => {

                    const Icon = item.icon;

                    return (

                        <button
                            key={item.title}
                            onClick={() => router.push(item.href)}
                            className="rounded-xl border hover:shadow-lg transition p-5 text-center"
                        >

                            <div className={`mx-auto w-14 h-14 rounded-full ${item.color} flex items-center justify-center text-white`}>

                                <Icon />

                            </div>

                            <p className="mt-3 font-semibold">

                                {item.title}

                            </p>

                        </button>

                    );

                })}

            </div>

        </div>

    );

}