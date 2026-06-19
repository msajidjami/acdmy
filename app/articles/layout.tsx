// app/articles/layout.tsx
import { ReactNode } from 'react';
import { ArticleSidebar } from '@/app/components/ArticleSidebar';

export default function ArticlesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 pt-24 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">
          <main className="lg:w-3/4">{children}</main>
          <aside className="lg:w-1/4">
            <ArticleSidebar />
          </aside>
        </div>
      </div>
    </div>
  );
}