import React, { useRef, useState } from 'react';
import { Sparkles, Maximize2, Play, Pause } from 'lucide-react';

export default function LifePlanet() {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: 340,
        height: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible',
      }}
    >
      {/* Outer Cyber Radar Ring 1 */}
      <div
        style={{
          position: 'absolute',
          width: 330,
          height: 330,
          borderRadius: '50%',
          border: '1px dashed rgba(0, 242, 254, 0.3)',
          boxShadow: '0 0 35px rgba(0, 242, 254, 0.15)',
          pointerEvents: 'none',
          animation: 'spin 45s linear infinite',
        }}
      />

      {/* Outer Counter-Rotating Ring 2 */}
      <div
        style={{
          position: 'absolute',
          width: 290,
          height: 290,
          borderRadius: '50%',
          border: '1px solid rgba(168, 85, 247, 0.25)',
          borderTop: '2px solid #a855f7',
          borderBottom: '2px solid #00f2fe',
          pointerEvents: 'none',
          animation: 'spin 30s linear infinite reverse',
        }}
      />

      {/* Satellite Optical Node 1 */}
      <div
        style={{
          position: 'absolute',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#00f2fe',
          boxShadow: '0 0 12px #00f2fe',
          top: 15,
          left: '50%',
          transform: 'translateX(-50%)',
          animation: 'pulseGlow 3s ease-in-out infinite',
        }}
      />

      {/* Satellite Optical Node 2 */}
      <div
        style={{
          position: 'absolute',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#ec4899',
          boxShadow: '0 0 10px #ec4899',
          bottom: 25,
          right: '18%',
          animation: 'pulseGlow 2.5s ease-in-out infinite reverse',
        }}
      />

      {/* Main Holographic Video Portal */}
      <div
        onClick={togglePlay}
        style={{
          position: 'relative',
          width: 250,
          height: 250,
          borderRadius: '50%',
          overflow: 'hidden',
          background: '#05070e',
          border: '2px solid rgba(0, 242, 254, 0.6)',
          boxShadow: '0 0 45px rgba(0, 242, 254, 0.4), inset 0 0 35px rgba(168, 85, 247, 0.3)',
          cursor: 'pointer',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title={isPlaying ? 'Click to Pause' : 'Click to Play'}
      >
        <video
          ref={videoRef}
          src="/dashboard-animation.mp4"
          autoPlay
          loop
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'contrast(1.08) brightness(1.04)',
            transform: 'scale(1.08)',
          }}
        />

        {/* Holographic Scanline Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,242,254,0.06) 0%, transparent 40%, rgba(168,85,247,0.08) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Radial Vignette Lens */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            boxShadow: 'inset 0 0 40px rgba(5,7,14,0.7)',
            pointerEvents: 'none',
          }}
        />

        {/* Play/Pause Indicator if paused */}
        {!isPlaying && (
          <div
            style={{
              position: 'absolute',
              background: 'rgba(5,7,14,0.6)',
              borderRadius: '50%',
              padding: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(0,242,254,0.4)',
              boxShadow: '0 0 20px rgba(0,242,254,0.5)',
            }}
          >
            <Play size={24} color="#00f2fe" fill="#00f2fe" />
          </div>
        )}
      </div>

      {/* Dynamic Telemetry Pill Underneath */}
      <div
        style={{
          position: 'absolute',
          bottom: -16,
          zIndex: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(9, 13, 32, 0.85)',
          border: '1px solid rgba(0, 242, 254, 0.4)',
          borderRadius: 20,
          padding: '4px 12px',
          boxShadow: '0 0 15px rgba(0, 242, 254, 0.25)',
          backdropFilter: 'blur(8px)',
          fontSize: '0.68rem',
          fontWeight: 700,
          color: '#00f2fe',
          letterSpacing: '0.08em',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: isPlaying ? '#10b981' : '#f59e0b',
            boxShadow: isPlaying ? '0 0 8px #10b981' : 'none',
          }}
        />
        <span>FLUID DYNAMICS // ACTIVE</span>
      </div>
    </div>
  );
}
