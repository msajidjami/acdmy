'use client';

import { Bell } from 'lucide-react';

const notifications = [

    {
        title: 'Tomorrow Quran Class',
        time: '9:00 AM',
    },

    {
        title: 'Homework Submitted Successfully',
        time: 'Yesterday',
    },

    {
        title: 'Teacher Added Feedback',
        time: '2 Days Ago',
    },

    {
        title: 'Attendance Updated',
        time: '3 Days Ago',
    },

];

export default function NotificationsPanel() {

    return (

        <div className="bg-white rounded-2xl shadow-sm border p-6">

            <div className="flex items-center gap-3 mb-6">

                <Bell className="text-green-600" />

                <h2 className="font-bold text-xl">

                    Notifications

                </h2>

            </div>

            <div className="space-y-4">

                {notifications.map((item, index) => (

                    <div
                        key={index}
                        className="border rounded-xl p-4 hover:bg-gray-50"
                    >

                        <p className="font-semibold">

                            {item.title}

                        </p>

                        <p className="text-sm text-gray-500 mt-1">

                            {item.time}

                        </p>

                    </div>

                ))}

            </div>

        </div>

    );

}