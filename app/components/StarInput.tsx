'use client';

import { useState } from 'react';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';

export default function StarInput({
  value,
  onChange,
  size = 32,
  disabled = false,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <div className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => {
        const active = i <= display;
        return (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => onChange(i)}
            onMouseEnter={() => !disabled && setHovered(i)}
            onMouseLeave={() => setHovered(0)}
            className={`transition-transform active:scale-90 disabled:cursor-not-allowed ${
              !disabled && 'hover:scale-110'
            }`}
            aria-label={`Rate ${i} star${i > 1 ? 's' : ''}`}
          >
            {active ? (
              <StarSolid
                className="text-amber-500 drop-shadow-sm"
                style={{ width: size, height: size }}
              />
            ) : (
              <StarOutline
                className="text-slate-300"
                style={{ width: size, height: size }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}