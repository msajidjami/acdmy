'use client';

import { useEffect } from 'react';

export default function ViewRecorder({ articleId }: { articleId: string }) {
  useEffect(() => {
    // Get or create user ID
    let userId = localStorage.getItem('viewer_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('viewer_id', userId);
    }

    // Call the view API
    fetch('/api/articles/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId, userId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          console.log('✅ View recorded successfully:', data);
        } else {
          console.error('❌ View API error:', data.error);
        }
      })
      .catch((err) => console.error('❌ View recording failed:', err));
  }, [articleId]);

  return null;
}