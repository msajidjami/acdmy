'use client';

import { useRouter } from 'next/navigation';

const actions = [
  {
    title: 'Browse Courses',
    href: '/courses',
  },
  {
    title: 'Book Free Trial',
    href: '/trial',
  },
  {
    title: 'Islamic AI',
    href: '/dashboard/ai',
  },
  {
    title: 'Islamic Library',
    href: '/articles',
  },
];

export default function QuickActions() {

  const router = useRouter();

  return (

    <div className="bg-white rounded-2xl shadow p-6">

      <h2 className="font-bold text-xl mb-5">

        Quick Actions

      </h2>

      <div className="grid md:grid-cols-2 gap-4">

        {actions.map((item) => (

          <button
            key={item.title}
            onClick={() => router.push(item.href)}
            className="rounded-xl border p-5 hover:bg-green-600 hover:text-white transition"
          >
            {item.title}
          </button>

        ))}

      </div>

    </div>

  );

}