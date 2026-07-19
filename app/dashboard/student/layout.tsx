'use client';

import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function StudentLayout({ children }: Props) {
  return (
    <div className="space-y-8">

      {children}

    </div>
  );
}