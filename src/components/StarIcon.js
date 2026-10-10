import React from 'react';

/**
 * Clean, modern SVG Star Icon
 * Replaces emoji stars (⭐) with a crisp vector graphic.
 */
export function StarIcon({ 
  size = 14, 
  fill = '#F59E0B', 
  stroke = '#D97706', 
  strokeWidth = 1,
  style = {},
  className = ''
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style
      }}
      className={className}
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

/**
 * 5-Star Row Component (e.g. for reviews or interactive rating)
 */
export function StarRatingRow({
  rating = 5,
  maxStars = 5,
  size = 15,
  interactive = false,
  onRate,
  style = {}
}) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', ...style }}>
      {Array.from({ length: maxStars }, (_, i) => {
        const starIndex = i + 1;
        const isFilled = starIndex <= Math.round(rating);
        return (
          <span
            key={i}
            onClick={() => interactive && onRate && onRate(starIndex)}
            style={{
              cursor: interactive ? 'pointer' : 'default',
              display: 'inline-flex',
              alignItems: 'center',
              transition: 'transform 0.15s ease',
              ...(interactive ? { transform: 'scale(1)' } : {})
            }}
            onMouseEnter={(e) => {
              if (interactive) e.currentTarget.style.transform = 'scale(1.2)';
            }}
            onMouseLeave={(e) => {
              if (interactive) e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <StarIcon
              size={size}
              fill={isFilled ? '#F59E0B' : 'rgba(156, 163, 175, 0.25)'}
              stroke={isFilled ? '#D97706' : '#9CA3AF'}
              strokeWidth={1}
            />
          </span>
        );
      })}
    </div>
  );
}

export default StarIcon;
