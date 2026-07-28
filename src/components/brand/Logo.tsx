
interface LogoProps {
  size?: number;
  showText?: boolean;
  variant?: 'full' | 'dark' | 'light' | 'mono';
  className?: string;
}

export function Logo({ size = 48, showText = true, variant = 'full', className = '' }: LogoProps) {
  // Determine color variables based on variant
  const isLight = variant === 'light';
  const isMono = variant === 'mono';

  const leafColor = isMono ? (isLight ? '#000000' : '#ffffff') : '#00E676';
  const dnaColor = isMono ? (isLight ? '#000000' : '#ffffff') : '#00D4FF';
  const orbitColor = isMono ? (isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)') : 'url(#orbitGrad)';
  const textColor = isLight ? '#0c0b15' : '#ffffff';
  const subtitleColor = isLight ? '#555268' : 'rgba(255,255,255,0.5)';

  return (
    <div className={`flex items-center gap-3 select-none ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="leafGrad" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00FF87" />
            <stop offset="100%" stopColor="#00E676" />
          </linearGradient>
          
          <linearGradient id="dnaGrad" x1="100" y1="20" x2="40" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00D4FF" />
            <stop offset="100%" stopColor="#0984e3" />
          </linearGradient>
          
          <linearGradient id="orbitGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#00E676" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#0052D4" stopOpacity="0.6" />
          </linearGradient>

          {/* Glow Filters */}
          {!isMono && (
            <filter id="premiumGlow" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          )}
        </defs>

        {/* Outer Circular Universe Orbit Ring */}
        <circle 
          cx="60" 
          cy="60" 
          r="52" 
          stroke={orbitColor} 
          strokeWidth="1.5" 
          strokeDasharray="4 4"
        />

        {/* Outer Solid Orbit Segment */}
        <path
          d="M 60 8 A 52 52 0 0 1 112 60"
          stroke={isMono ? leafColor : 'url(#leafGrad)'}
          strokeWidth="3.5"
          strokeLinecap="round"
          filter={isMono ? undefined : 'url(#premiumGlow)'}
        />
        <path
          d="M 60 112 A 52 52 0 0 1 8 60"
          stroke={isMono ? dnaColor : 'url(#dnaGrad)'}
          strokeWidth="3.5"
          strokeLinecap="round"
          filter={isMono ? undefined : 'url(#premiumGlow)'}
        />

        {/* Neural AI Nodes on Orbit */}
        {!isMono && (
          <>
            <circle cx="112" cy="60" r="4.5" fill="#00FF87" filter="url(#premiumGlow)" />
            <circle cx="8" cy="60" r="4.5" fill="#00D4FF" filter="url(#premiumGlow)" />
            <circle cx="60" cy="8" r="3.5" fill="#ffffff" />
            <circle cx="60" cy="112" r="3.5" fill="#ffffff" />
          </>
        )}

        {/* Central Core: Combined Leaf + Human Body Helix */}
        {/* Left Helix Ribbon / Organic Leaf Strand */}
        <path
          d="M 60 28 C 45 42, 35 60, 45 80 C 50 90, 60 92, 60 92 C 60 92, 54 80, 52 70 C 50 55, 55 40, 60 28 Z"
          fill={isMono ? leafColor : 'url(#leafGrad)'}
          opacity="0.9"
        />

        {/* Right Helix Ribbon / DNA Strand */}
        <path
          d="M 60 28 C 75 42, 85 60, 75 80 C 70 90, 60 92, 60 92 C 60 92, 66 80, 68 70 C 70 55, 65 40, 60 28 Z"
          fill={isMono ? dnaColor : 'url(#dnaGrad)'}
          opacity="0.9"
        />

        {/* Intersecting DNA Rungs / Connection Links (Subtle Medical Cross shape in center) */}
        <line x1="48" y1="52" x2="72" y2="52" stroke={isLight ? '#ffffff' : '#0c0b15'} strokeWidth="2.5" />
        <line x1="45" y1="65" x2="75" y2="65" stroke={isLight ? '#ffffff' : '#0c0b15'} strokeWidth="2.5" />
        <line x1="48" y1="78" x2="72" y2="78" stroke={isLight ? '#ffffff' : '#0c0b15'} strokeWidth="2.5" />

        {/* AI Center Node (Brain/Core) */}
        <circle 
          cx="60" 
          cy="60" 
          r="6.5" 
          fill="#ffffff" 
          stroke={isMono ? leafColor : '#00E676'} 
          strokeWidth="2" 
          filter={isMono ? undefined : 'url(#premiumGlow)'} 
        />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <span 
            className="font-display font-bold tracking-tight" 
            style={{ 
              fontSize: `${size * 0.42}px`, 
              fontWeight: 800, 
              color: textColor,
              letterSpacing: '-0.03em'
            }}
          >
            Nutri<span style={{ color: isMono ? leafColor : '#00E676' }}>Verse</span>
          </span>
          <span 
            className="font-mono tracking-widest uppercase" 
            style={{ 
              fontSize: `${size * 0.15}px`, 
              color: subtitleColor, 
              letterSpacing: '0.22em',
              fontWeight: 500,
              marginTop: '1px'
            }}
          >
            AI HEALTH
          </span>
        </div>
      )}
    </div>
  );
}
