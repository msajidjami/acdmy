// app/components/ArticleViewCounter.tsx
'use client';

import { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';

export default function ArticleViewCounter({
  articleId,
  initialViews,
}: {
  articleId: string;
  initialViews: number;
}) {
  const [views, setViews] = useState(initialViews);

  useEffect(() => {
    // Get or create user ID
    let userId = localStorage.getItem('viewer_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('viewer_id', userId);
    }

    // Record the view and update the counter
    fetch('/api/articles/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId, userId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.uniqueViews !== undefined) {
          setViews(data.uniqueViews);
        }
      })
      .catch((err) => console.error('View recording failed:', err));
  }, [articleId]);

  return (
    <span className="flex items-center gap-1">
      <Eye className="w-4 h-4" />
      {views} {views === 1 ? 'view' : 'views'}
    </span>
  );
}