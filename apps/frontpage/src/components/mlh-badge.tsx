'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface MLHBadgeProps {
  isMobileMenuOpen?: boolean;
}

export default function MLHBadge({ isMobileMenuOpen = false }: MLHBadgeProps) {
  const [isVisible, setIsVisible] = useState(true);
  const lastVisibility = useRef(true);
  const tickingRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;

      requestAnimationFrame(() => {
        const shouldShow = window.scrollY < 40;
        if (shouldShow !== lastVisibility.current) {
          lastVisibility.current = shouldShow;
          setIsVisible(shouldShow);
        }
        tickingRef.current = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const desktopClasses = `hidden md:block fixed top-20 right-16 w-[90px] z-[100] transition-opacity duration-300 ease-in-out ${
    isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
  }`;

  const mobileVisible = isVisible && !isMobileMenuOpen;
  const mobileClasses = `md:hidden fixed top-20 right-10 -mt-2 w-[60px] sm:w-[70px] transition-opacity duration-300 z-[100] ease-in-out ${
    mobileVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
  }`;

  return (
    <>
      {/* Desktop Badge - fixed at top-right corner */}
      <a
        href="https://mlh.io/na?utm_source=na-hackathon&utm_medium=TrustBadge&utm_campaign=2026-season&utm_content=black"
        target="_blank"
        rel="noopener noreferrer"
        className={desktopClasses}
      >
        <Image
          width={90}
          height={157}
          src="https://s3.amazonaws.com/logged-assets/trust-badge/2026/mlh-trust-badge-2026-black.svg"
          alt="Major League Hacking Trust Badge"
          className="w-full h-auto"
        />
      </a>

      {/* Mobile Badge - under navbar */}
      <a
        href="https://mlh.io/na?utm_source=na-hackathon&utm_medium=TrustBadge&utm_campaign=2026-season&utm_content=black"
        target="_blank"
        rel="noopener noreferrer"
        className={mobileClasses}
      >
        <Image
          width={70}
          height={122}
          src="https://s3.amazonaws.com/logged-assets/trust-badge/2026/mlh-trust-badge-2026-black.svg"
          alt="Major League Hacking Trust Badge"
          className="w-full h-auto"
        />
      </a>
    </>
  );
}
