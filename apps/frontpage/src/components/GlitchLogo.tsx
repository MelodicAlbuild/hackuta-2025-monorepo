'use client';
/* eslint-disable @next/next/no-img-element */

import React from 'react';
import useWindowSize from '@/hooks/useWindowSize';

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
  const { width: viewportWidth } = useWindowSize();
  const isMobile = viewportWidth > 0 && viewportWidth < 768;
  const duration = `${durationMs}ms`;
  const startDelay = `${startDelayMs}ms`;
  const wrapperClasses = `${isMobile ? '' : 'glitch'} ${wrapperClassName}`.trim();
  const baseImgClasses = `${isMobile ? '' : 'glitch-base'} block w-full h-auto ${imgClassName}`.trim();
  const style = isMobile
    ? undefined
    : ({
        ['--glitch-duration']: duration,
        ['--glitch-start-delay']: startDelay,
      } as GlitchStyle);

  return (
    <div className={wrapperClasses} style={style}>
      {/* Base image */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={baseImgClasses}
        decoding="async"
        loading="eager"
      />

      {/* Overlay layers for glitch effect */}
      {!isMobile && (
        <>
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
        </>
      )}
    </div>
  );
}
