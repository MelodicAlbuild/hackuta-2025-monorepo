'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import useWindowSize from '@/hooks/useWindowSize';

type RevealProps = {
  children: ReactNode;
  /** Pixels before the element enters the viewport to trigger (e.g., "0px 0px -80px 0px") */
  rootMargin?: string;
  /** Optional class to apply when visible */
  visibleClassName?: string;
  /** Optional class to apply when hidden (initial state) */
  hiddenClassName?: string;
  /** Delay per child index in ms when mapping multiple Reveals */
  delayMs?: number;
  /** Index for staggering; consumer passes index when mapping */
  index?: number;
  /** Enable parallax and blur as the element scrolls into view */
  enableParallax?: boolean;
  /** Starting translateY in pixels before fully revealed */
  translateFromPx?: number;
  /** Maximum blur in pixels before fully revealed */
  maxBlurPx?: number;
  /** Multiplier to make blur clear earlier ( >1 clears sooner ) */
  blurSpeedMultiplier?: number;
};

export default function Reveal({
  children,
  rootMargin = '0px 0px -80px 0px',
  visibleClassName = 'opacity-100 translate-y-0',
  hiddenClassName = 'opacity-0 translate-y-6',
  delayMs = 80,
  index = 0,
  enableParallax = true,
  translateFromPx = 36,
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1 how revealed it is
  const tickingRef = useRef(false);
  const { width } = useWindowSize();
  const disableEffects = width > 0 && width < 768;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (disableEffects || prefersReducedMotion) {
      setIsVisible(true);
      setProgress(1);
    }

    let didCancel = false;

    const computeProgress = () => {
      if (!element) return 0;
      const rect = element.getBoundingClientRect();
      const viewportH =
        window.innerHeight || document.documentElement.clientHeight;
      const start = viewportH * 0.9; // start revealing when top reaches 90% viewport
      const end = viewportH * 0.2; // fully revealed by 20% viewport
      const raw = 1 - (rect.top - end) / (start - end);
      const clamped = Math.max(0, Math.min(1, raw));
      return clamped;
    };

    const updateOnScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(() => {
        if (didCancel) return;
        const p = computeProgress();
        setProgress(p);
        if (p > 0.02 && !isVisible) setIsVisible(true);
        tickingRef.current = false;
      });
    };

    const parallaxActive = enableParallax && !prefersReducedMotion && !disableEffects;

    // Initial compute
    if (parallaxActive) {
      setProgress(computeProgress());
      window.addEventListener('scroll', updateOnScroll, { passive: true });
      window.addEventListener('resize', updateOnScroll);
    } else if (!disableEffects && !prefersReducedMotion) {
      setProgress(1);
    }

    // IntersectionObserver to ensure visibility class toggles at least once
    const observer = !disableEffects
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting && !didCancel) {
                setIsVisible(true);
              }
            });
          },
          { root: null, rootMargin, threshold: 0.15 },
        )
      : null;
    if (observer) observer.observe(element);

    return () => {
      didCancel = true;
      observer?.disconnect();
      if (parallaxActive) {
        window.removeEventListener('scroll', updateOnScroll as EventListener);
        window.removeEventListener('resize', updateOnScroll as EventListener);
      }
    };
  }, [rootMargin, enableParallax, disableEffects, isVisible]);

  const transitionDelay = `${Math.max(0, index) * delayMs}ms`;

  const parallaxEnabled = enableParallax && !disableEffects;
  const effectiveProgress = parallaxEnabled ? progress : isVisible ? 1 : 0;
  const translateYPx = (1 - effectiveProgress) * translateFromPx;
  // Blur effect disabled for performance across browsers

  const baseClassName = disableEffects
    ? visibleClassName
    : isVisible
      ? visibleClassName
      : hiddenClassName;
  const transitionClasses = disableEffects
    ? ''
    : 'transition-all duration-200 ease-out will-change-[transform,opacity]';
  const className = `${transitionClasses} ${baseClassName}`.trim();

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transitionDelay: disableEffects ? undefined : transitionDelay,
        transform: `translate3d(0, ${translateYPx.toFixed(2)}px, 0)`,
        opacity: disableEffects ? 1 : effectiveProgress,
      }}
    >
      {children}
    </div>
  );
}
