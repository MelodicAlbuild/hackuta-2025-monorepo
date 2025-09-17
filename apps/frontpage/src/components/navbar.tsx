'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  onMobileMenuToggle?: (isOpen: boolean) => void;
}

const DESKTOP_LINKS = [
  { name: 'About', href: '#about' },
  { name: 'Schedule', href: '#schedule' },
  { name: 'FAQ', href: '#faq' },
  { name: 'Sponsors', href: '#sponsors' },
  { name: 'Apply', href: '#apply' },
];

const MOBILE_ANIMATION_DELAY_MS = 50;

export default function Navbar({ onMobileMenuToggle }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const lastIsScrolled = useRef(false);
  const tickingRef = useRef(false);

  const toggleMobileMenu = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    onMobileMenuToggle?.(nextState);
  };

  useEffect(() => {
    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;

      requestAnimationFrame(() => {
        const next = window.scrollY > 50;
        if (next !== lastIsScrolled.current) {
          lastIsScrolled.current = next;
          setIsScrolled(next);
        }
        tickingRef.current = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () =>
      window.removeEventListener('scroll', onScroll as EventListener);
  }, []);

  const authBaseUrl = process.env.NEXT_PUBLIC_AUTH_APP_URL?.replace(/\/$/, '');
  const signInHref = authBaseUrl ? `${authBaseUrl}/login` : '/login';

  useEffect(() => {
    let isMounted = true;

    const loadState = async () => {
      try {
        const statusResponse = await fetch('/api/registration-status');
        const statusData = await statusResponse.json();

        if (!isMounted) return;

        setIsLoggedIn(Boolean(statusData?.registered));
      } catch {
        if (!isMounted) return;

        setIsLoggedIn(false);
      }
    };

    loadState();

    return () => {
      isMounted = false;
    };
  }, []);

  const shouldShowLogin = !isLoggedIn;
  const portalBaseUrl = process.env.NEXT_PUBLIC_PORTAL_APP_URL?.replace(
    /\/$/,
    '',
  );
  const defaultPortalHref =
    typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:3002'
      : 'https://portal.hackuta.org';
  const portalHref = portalBaseUrl || defaultPortalHref;

  const mobileMenuItems = [
    ...DESKTOP_LINKS,
    shouldShowLogin ? { name: 'Login', href: signInHref } : null,
    isLoggedIn ? { name: 'Portal', href: portalHref } : null,
  ].filter(Boolean) as { name: string; href: string }[];

  const desktopSignInClasses =
    'relative overflow-hidden cursor-target font-franklinGothic font-semibold text-white text-sm md:text-base rounded-full px-6 py-2 border border-red-500/80 bg-transparent transition-all duration-300 hover:scale-[1.05] shadow-[0_0_18px_rgba(239,68,68,0.4),0_0_28px_rgba(239,68,68,0.24)] hover:shadow-[0_0_24px_rgba(239,68,68,0.5),0_0_36px_rgba(239,68,68,0.32)]';
  const mobileGlowClasses =
    'relative overflow-hidden cursor-target font-franklinGothic font-semibold text-white text-lg w-[90%] px-8 py-3 text-center rounded-2xl border border-red-500/80 shadow-[0_0_18px_rgba(239,68,68,0.4),0_0_28px_rgba(239,68,68,0.24)] transition-all duration-200 hover:scale-105 animate-pulse';
  const mobileLinkClasses =
    'cursor-target font-franklinGothic text-white text-lg font-normal rounded-lg px-6 py-2 transition-all duration-200 hover:scale-105 hover:text-red-300 hover:bg-red-500/10';

  return (
    <nav
      className={`fixed top-4 left-1/2 z-[100] -translate-x-1/2 fancy-shadow transition-[background-color,border-color,border-radius,box-shadow,opacity,transform,width,height,padding] duration-500 ease-out border ${
        isScrolled
          ? 'h-14 w-[calc(100%-2rem)] md:w-[65%] lg:w-[65%] rounded-full border-black/50 bg-black/80 shadow-2xl'
          : 'h-16 w-[calc(100%-2rem)] md:w-[95%] lg:w-[95%] rounded-2xl border-black/30 bg-black/90 md:rounded-full'
      }`}
      style={{
        boxShadow: isScrolled
          ? '0 0 12px rgba(239, 68, 68, 0.3), 0 0 24px rgba(239, 68, 68, 0.2)'
          : '0 4px 14px rgba(0, 0, 0, 0.20), 0 0 16px rgba(239, 68, 68, 0.14)',
      }}
    >
      <div className="flex h-full w-full items-center gap-3 px-4 md:px-6">
        <div className="flex items-center gap-3 flex-shrink-0">
          <a href="#" className="flex items-center transition hover:opacity-80">
            <Image
              src="/Logo.svg"
              alt="Main Logo"
              width={isScrolled ? 25 : 30}
              height={isScrolled ? 28 : 34}
              priority
              className="transition-all duration-300 ease-in-out"
            />
          </a>
        </div>

        <div className="hidden flex-1 items-center md:ml-12 lg:ml-16 justify-center gap-5 md:flex lg:gap-6 xl:gap-8">
          {DESKTOP_LINKS.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="cursor-target text-white font-franklinGothic md:text-base lg:text-lg font-normal transition hover:text-red-300"
            >
              {item.name}
            </a>
          ))}
        </div>

        {shouldShowLogin && (
          <div className="hidden items-center justify-end flex-shrink-0 md:flex">
            <a href={signInHref} className={desktopSignInClasses}>
              <span className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/40 via-transparent to-red-500/10 opacity-80" />
              <span className="relative z-10">Login</span>
            </a>
          </div>
        )}
        {isLoggedIn && (
          <div className="hidden items-center justify-end flex-shrink-0 md:flex">
            <a href={portalHref} className={desktopSignInClasses}>
              <span className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/40 via-transparent to-red-500/10 opacity-80" />
              <span className="relative z-10">Portal</span>
            </a>
          </div>
        )}

        <button
          type="button"
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/20 md:hidden"
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div
        className={`md:hidden absolute top-full left-1/2 w-[calc(100%-1rem)] -translate-x-1/2 transform rounded-2xl border border-red-500/20 bg-black/90 py-6 transition-all duration-300 ${
          isOpen
            ? 'pointer-events-auto mt-2 opacity-100 shadow-[0_10px_40px_rgba(0,0,0,0.4),0_0_20px_rgba(239,68,68,0.3)]'
            : 'pointer-events-none mt-0 -translate-y-2 scale-95 opacity-0'
        }`}
      >
        <div className="flex flex-col items-center space-y-3">
          {mobileMenuItems.map((item, index) => {
            const isHighlight = item.name === 'Login' || item.name === 'Portal';
            const itemClasses = `${
              isHighlight ? mobileGlowClasses : mobileLinkClasses
            } ${isOpen ? 'animate-fadeInUp' : ''}`;

            return (
              <a
                key={item.name}
                href={item.href}
                className={itemClasses}
                style={{
                  animationDelay: isOpen
                    ? `${index * MOBILE_ANIMATION_DELAY_MS}ms`
                    : undefined,
                }}
                onClick={() => {
                  setIsOpen(false);
                  onMobileMenuToggle?.(false);
                }}
              >
                {isHighlight && (
                  <span className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/40 via-transparent to-red-500/10 opacity-80" />
                )}
                <span className={isHighlight ? 'relative z-10' : undefined}>
                  {item.name}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
