import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const BAR_COUNT = 64;

/**
 * Helper to parse hex or rgb to [r,g,b]
 */
function parseColor(str, fallback = [79, 70, 255]) {
  if (!str) return fallback;
  const trimmed = str.trim();
  if (trimmed.startsWith('#')) {
    const hex = trimmed.slice(1);
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16),
      ];
    }
    const num = parseInt(hex, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }
  const match = trimmed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (match) {
    return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
  }
  return fallback;
}

function lerpColor(c1, c2, t) {
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
  return `rgb(${r},${g},${b})`;
}

/**
 * VoiceOrb Component — 64-Bar Radial Ring
 * Implements the clean, minimalistic 64-bar frequency ring directly driven by the Web Audio API spectrum,
 * sweeping from system signal-indigo to cyan-pulse with amplitude.
 */
export function VoiceOrb({
  status = 'idle', // 'idle' | 'listening' | 'evaluating' | 'reviewed'
  amplitude = 0, // 0.0 to 1.0 from Web Audio API
  spectrum = null, // Float32Array(64)
  onClick,
  disabled = false,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const isListening = status === 'listening';
  const isThinking = status === 'evaluating';

  // Refs for animation state
  const stateRef = useRef({
    status,
    amplitude,
    spectrum,
    smoothedAmp: 0,
    smoothedSpec: new Float32Array(BAR_COUNT),
  });

  // Keep stateRef in sync without triggering canvas recreation
  useEffect(() => {
    stateRef.current.status = status;
    stateRef.current.amplitude = amplitude;
    stateRef.current.spectrum = spectrum;
  }, [status, amplitude, spectrum]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Handle high DPI display
    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const render = (now) => {
      const t = now / 1000;
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      if (w === 0 || h === 0) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, w, h);

      const currentStatus = stateRef.current.status;
      const rawAmp = stateRef.current.amplitude || 0;
      const rawSpec = stateRef.current.spectrum;

      // Extract system colors dynamically from DOM
      const styles = getComputedStyle(document.documentElement);
      const indigoHex = styles.getPropertyValue('--signal-indigo').trim() || '#4F46FF';
      const cyanHex = styles.getPropertyValue('--cyan-pulse').trim() || '#22D3EE';
      const indigoRgb = parseColor(indigoHex, [79, 70, 255]);
      const cyanRgb = parseColor(cyanHex, [34, 211, 238]);

      let targetAmp = rawAmp;
      const targetSpec = new Float32Array(BAR_COUNT);

      if (currentStatus === 'listening') {
        targetAmp = rawAmp;
        if (rawSpec && rawSpec.length >= BAR_COUNT) {
          for (let i = 0; i < BAR_COUNT; i++) {
            targetSpec[i] = rawSpec[i];
          }
        }
      } else if (currentStatus === 'evaluating') {
        // Thinking state: gentle orbiting wave pattern across the 64 bars
        targetAmp = 0.28 + 0.12 * Math.sin(t * 2.5);
        for (let i = 0; i < BAR_COUNT; i++) {
          const wave = 0.25 + 0.25 * Math.sin(t * 4.0 - (i / BAR_COUNT) * Math.PI * 4);
          targetSpec[i] = Math.max(0.08, wave);
        }
      } else {
        // Idle state: subtle minimalistic breathing motion
        const wobble = reducedMotion ? 0 : 0.04 * Math.sin(t * 0.9);
        targetAmp = 0.08 + wobble;
        for (let i = 0; i < BAR_COUNT; i++) {
          targetSpec[i] = 0.05 + (reducedMotion ? 0 : 0.03 * Math.sin(t * 0.7 + i * 0.3));
        }
      }

      // Smooth amplitude and spectrum
      stateRef.current.smoothedAmp += (targetAmp - stateRef.current.smoothedAmp) * 0.22;
      for (let i = 0; i < BAR_COUNT; i++) {
        stateRef.current.smoothedSpec[i] +=
          (targetSpec[i] - stateRef.current.smoothedSpec[i]) * 0.32;
      }

      const amp = stateRef.current.smoothedAmp;
      const spec = stateRef.current.smoothedSpec;

      const cx = w / 2;
      const cy = h / 2;
      const innerR = Math.min(w, h) * 0.27; // Snug inner radius matching button perimeter
      const mixT = Math.min(1, amp * 1.35);
      const activeColor = lerpColor(indigoRgb, cyanRgb, mixT);

      // 1. Draw 64 Radial Bars
      for (let i = 0; i < BAR_COUNT; i++) {
        const angle = -Math.PI / 2 + (i / BAR_COUNT) * Math.PI * 2;
        const barLen = 4 + spec[i] * 30;

        const x1 = cx + Math.cos(angle) * innerR;
        const y1 = cy + Math.sin(angle) * innerR;
        const x2 = cx + Math.cos(angle) * (innerR + barLen);
        const y2 = cy + Math.sin(angle) * (innerR + barLen);

        ctx.strokeStyle = activeColor;
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // 2. Subtle Soft Aura behind center
      ctx.save();
      ctx.filter = 'blur(10px)';
      ctx.fillStyle = `rgba(${indigoRgb[0]}, ${indigoRgb[1]}, ${indigoRgb[2]}, 0.15)`;
      ctx.beginPath();
      ctx.arc(cx, cy, innerR * 0.82, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 3. Thin Inner Boundary Ring
      ctx.save();
      ctx.strokeStyle = `rgba(${indigoRgb[0]}, ${indigoRgb[1]}, ${indigoRgb[2]}, 0.25)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center w-52 h-52 sm:w-56 sm:h-56 select-none mx-auto"
    >
      {/* 64-Bar Radial Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Central Interactive Core Action Button */}
      <motion.button
        type="button"
        onClick={onClick}
        disabled={disabled || isThinking}
        aria-label={
          isThinking
            ? 'AI is evaluating your answer'
            : isListening
            ? 'Listening. Click to pause mic'
            : 'Click to start speaking'
        }
        className={`relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full cursor-pointer flex flex-col items-center justify-center bg-surface border border-border/80 shadow-md transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-signal-indigo/50 ${
          disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-signal-indigo/50'
        }`}
        whileHover={!disabled && !isThinking ? { scale: 1.05 } : {}}
        whileTap={!disabled && !isThinking ? { scale: 0.95 } : {}}
      >
        {/* Subtle minimal inner gradient highlight - consistent across speak and listening */}
        <div
          className="absolute inset-0 rounded-full opacity-15 pointer-events-none transition-opacity"
          style={{
            background: 'radial-gradient(circle, var(--signal-indigo) 0%, transparent 70%)',
          }}
        />

        {/* Center Icon */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          {isThinking ? (
            <svg
              className="w-7 h-7 text-signal-indigo animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-90"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          ) : (
            <svg
              className="w-7 h-7 text-ink-muted hover:text-ink transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          )}

          {/* Minimalist Micro status caption */}
          <span className="font-mono text-[9px] uppercase tracking-wider text-ink-muted mt-1">
            {isThinking ? 'PROCESSING' : isListening ? 'LISTENING' : 'SPEAK'}
          </span>
        </div>
      </motion.button>
    </div>
  );
}
