'use client';

import { useState, useEffect } from 'react';
import Schedule from '@/components/sections/schedule';
import Faq from '@/components/sections/faq';
import Navbar from '@/components/navbar';
import Hero from '@/components/sections/hero';
import WhenWhere from '@/components/sections/when-where';
import Apply from '@/components/sections/apply';
import Sponsors from '@/components/sections/sponsors';
import Footer from '@/components/footer';
import MLHBadge from '@/components/mlh-badge';
import Reveal from '@/components/reveal';

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileMenuToggle = (isOpen: boolean) => {
    setIsMobileMenuOpen(isOpen);
  };

  useEffect(() => {
    // Prevent auto-scroll on page load by clearing hash and scrolling to top
    if (typeof window !== 'undefined') {
      // Remove any hash from URL on initial load
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      // Ensure page starts at top
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <div className="scrollbar-hide bg-gradient-to-b from-black via-blue-950 to-blue-950 min-h-screen">
      <Navbar onMobileMenuToggle={handleMobileMenuToggle} />

      <MLHBadge isMobileMenuOpen={isMobileMenuOpen} />
      <Hero />

      {/* Main Content */}
      <div className="font-franklinCondensed text-white text-center w-[100vw] mx-auto px-6 sm:px-10 p-[20px] mt-[-60px] sm:mt-[-40px] md:mt-0 relative z-[10]">
        <Reveal>
          <WhenWhere />
        </Reveal>

        <div className="mt-8" />
        <Reveal>
          <Apply />
        </Reveal>

        <section id="schedule" className="py-8">
          <Reveal>
            <Schedule />
          </Reveal>
        </section>

        <section id="faq" className="py-12">
          <Reveal>
            <Faq />
          </Reveal>
        </section>

        <Reveal>
          <Sponsors />
        </Reveal>
      </div>
      <Footer />
    </div>
  );
}
