import React from 'react';

/**
 * Reusable, consistent Clinic Logo / Avatar component
 * Displays:
 * 1. clinic.profilePic if available (custom uploaded logo)
 * 2. Specialty emoji if custom (e.g. 🦷, 👶)
 * 3. Consistent SVG medical clinic building icon with green accent background
 */
export function ClinicLogo({ 
  clinic, 
  size = 38, 
  iconSize, 
  borderRadius = 'var(--radius-sm, 10px)', 
  style = {},
  className = ''
}) {
  if (!clinic) return null;

  const actualIconSize = iconSize || Math.round(size * 0.58);

  // 1. Custom uploaded profile picture / logo
  if (clinic.profilePic) {
    return (
      <div 
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius,
          overflow: 'hidden',
          background: 'transparent',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--border)',
          ...style
        }}
      >
        <img 
          src={clinic.profilePic} 
          alt={clinic.name || 'Clinic'} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
      </div>
    );
  }

  // 2. Custom specialty emoji (e.g. Dentistry 🦷 or Pediatrics 👶)
  if (clinic.icon && clinic.icon !== '🏥') {
    const bg = clinic.icon === '🦷' ? '#FAEEDA' : clinic.icon === '👶' ? '#FBEAF0' : 'var(--green-light)';
    return (
      <div 
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius,
          background: bg,
          fontSize: `${Math.round(size * 0.48)}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          ...style
        }}
      >
        {clinic.icon}
      </div>
    );
  }

  // 3. Default clean SVG Medical Clinic building icon
  return (
    <div 
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius,
        background: 'var(--green-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...style
      }}
    >
      <svg 
        width={actualIconSize} 
        height={actualIconSize} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="var(--green-dark)" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M12 6v4" />
        <path d="M10 8h4" />
        <path d="M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18" />
        <path d="M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h2" />
        <path d="M10 22v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4" />
      </svg>
    </div>
  );
}

export default ClinicLogo;
