'use client';

import Image from 'next/image';

interface MLHBadgeProps {
  isMobileMenuOpen?: boolean;
}

export default function MLHBadge({ isMobileMenuOpen = false }: MLHBadgeProps) {
  return (
    <>
      {/* Desktop Badge - fixed at top-right corner */}
      <a
        href="https://mlh.io/na?utm_source=na-hackathon&utm_medium=TrustBadge&utm_campaign=2026-season&utm_content=black"
        target="_blank"
        rel="noopener noreferrer"
        className="hidden md:block fixed top-0 right-2 w-[90px] z-[100]"
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
        className={`md:hidden fixed top-20 right-10 -mt-2 w-[60px] sm:w-[70px] transition-all duration-300 z-[100] ${
          isMobileMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
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
