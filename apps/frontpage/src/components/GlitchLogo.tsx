'use client';
/* eslint-disable @next/next/no-img-element */

import React from 'react';

type GlitchLogoProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  wrapperClassName?: string;
  imgClassName?: string;
  durationMs?: number; // how long the glitch runs
  startDelayMs?: number; // delay before glitch starts
};

interface GlitchStyle extends React.CSSProperties {
  ['--glitch-duration']?: string;
  ['--glitch-start-delay']?: string;
}

export default function GlitchLogo({
  src,
  alt,
  width,
  height,
  wrapperClassName = '',
  imgClassName = '',
  durationMs = 900,
  startDelayMs = 0,
}: GlitchLogoProps) {
  const duration = `${durationMs}ms`;
  const startDelay = `${startDelayMs}ms`;

  return (
    <div
      className={`glitch ${wrapperClassName}`}
      style={{
        ['--glitch-duration']: duration,
        ['--glitch-start-delay']: startDelay,
      } as GlitchStyle}
    >
      {/* Base image */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`glitch-base block w-full h-auto ${imgClassName}`}
        decoding="async"
        loading="eager"
      />

      {/* Overlay layers for glitch effect */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="glitch-layer glitch-layer-a pointer-events-none"
        decoding="async"
      />
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="glitch-layer glitch-layer-b pointer-events-none"
        decoding="async"
      />
    </div>
  );
}
