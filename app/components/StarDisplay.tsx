'use client';

import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';

export default function StarDisplay({
  rating,
  size = 16,
  showNumber = false,
  count = 0,
}: {
  rating: number;
  size?: number;
  showNumber?: boolean;
  count?: number;
}) {
  const rounded = Math.round(rating * 2) / 2; // 0.5 steps

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = i <= rounded;
          const half = !filled && i - 0.5 === rounded;

          return (
            <span
              key={i}
              className="relative inline-block"
              style={{ width: size, height: size }}
            >
              {/* Outline (base) */}
              <StarOutline
                className="absolute inset-0 text-amber-300"
                style={{ width: size, height: size }}
              />

              {/* Fill */}
              {(filled || half) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: half ? size / 2 : size }}
                >
                  <StarSolid
                    className="text-amber-500"
                    style={{ width: size, height: size }}
                  />
                </span>
              )}
            </span>
          );
        })}
      </div>

      {showNumber && (
        <span className="text-xs font-bold text-slate-700">
          {rating.toFixed(1)}
        </span>
      )}

      {count > 0 && (
        <span className="text-[11px] text-slate-400 font-medium">
          ({count})
        </span>
      )}
    </div>
  );
}