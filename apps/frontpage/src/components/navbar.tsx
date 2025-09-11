'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  onMobileMenuToggle?: (isOpen: boolean) => void;
}

export default function Navbar({ onMobileMenuToggle }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLoginButton, setShowLoginButton] = useState<boolean>(false);
  const lastIsScrolled = useRef<boolean>(false);
  const tickingRef = useRef<boolean>(false);

  const toggleMobileMenu = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onMobileMenuToggle?.(newState);
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
    return () => window.removeEventListener('scroll', onScroll as EventListener);
  }, []);

  // Fetch feature flag to control Sign In visibility
  useEffect(() => {
    const handleFeatureFlags = async () => {
      try {
        const response = await fetch('/api/feature-flags?flag=show_signin_button');
        const data = await response.json();
        setShowLoginButton(data === 'true');
      } catch {
        setShowLoginButton(false);
      }
    };
    handleFeatureFlags();
  }, []);

  const mobileMenuItems = [
    { name: 'When & Where', href: '#d-time' },
    { name: 'Schedule', href: '#schedule' },
    { name: 'FAQ', href: '#faq' },
    { name: 'Sponsors', href: '#sponsors' },
    { name: 'Apply', href: '#apply' },
  ];

  return (
    <nav
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] text-center fancy-shadow transition-[background-color,border-color,border-radius,box-shadow,opacity,transform,width,height,padding] duration-500 ease-out border ${
        isScrolled
          ? 'w-[calc(100%-2rem)] md:w-[65%] lg:w-[65%] bg-black/80 rounded-full shadow-2xl border-black/50 h-14 px-4 md:px-6 md:h-12'
          : 'w-[calc(100%-2rem)] md:w-[95%] lg:w-[95%] bg-black/90 rounded-2xl md:rounded-full border-black/30 md:border-black/40 h-16 px-6 md:px-8'
      }`}
      style={{
        boxShadow: isScrolled
          ? '0 0 12px rgba(147, 51, 234, 0.28), 0 0 24px rgba(147, 51, 234, 0.18)'
          : '0 4px 14px rgba(0, 0, 0, 0.20), 0 0 16px rgba(147, 51, 234, 0.12)',
      }}
    >
      <div className="flex items-center justify-between h-full pl-3 pr-3 md:pl-4 md:pr-4">
        <div className="flex items-center">
          <a href="#" className="flex items-center hover:opacity-80 transition">
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

        {/* Desktop Navigation */}
        <div className="hidden md:flex xl:space-x-8 lg:space-x-6 md:space-x-4 justify-center w-full ml-8">
          {[
            { name: 'When & Where', href: '#d-time' },
            { name: 'Schedule', href: '#schedule' },
            { name: 'FAQ', href: '#faq' },
            { name: 'Sponsors', href: '#sponsors' },
            { name: 'Apply', href: '#apply' },
          ].map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-white font-franklinGothic lg:text-lg md:text-base font-normal hover:text-purple-300 transition shrink"
            >
              {item.name}
            </a>
          ))}
        </div>

        {/* Desktop Sign In Button (feature-flagged) */}
        {showLoginButton && (
          <div className="hidden md:flex items-center ml-4">
            <a
              href={`${process.env.NEXT_PUBLIC_AUTH_APP_URL}/login`}
              className="text-white font-franklinGothic md:text-base font-normal border border-purple-400/80 rounded-full px-4 py-2 hover:shadow-[0_0_18px_rgba(147,51,234,0.35),0_0_28px_rgba(147,51,234,0.2)] transition"
            >
              Sign In
            </a>
          </div>
        )}

        {/* Mobile Hamburger Menu */}
        <button
          className="md:hidden text-white focus:outline-none z-[110] relative transition-transform duration-300 hover:scale-110"
          onClick={toggleMobileMenu}
          aria-label="Toggle Menu"
        >
          <div className="w-8 h-8 flex items-center justify-center">
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </div>
        </button>

        {/* Mobile Dropdown Menu */}
        <div
          className={`md:hidden absolute top-full left-1/2 transform -translate-x-1/2 w-[calc(100%-1rem)] mt-2 bg-black/90 rounded-2xl border border-purple-500/20 flex flex-col items-center space-y-3 py-6 transition-all duration-300 z-[105] ${
            isOpen
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
          }`}
          style={{
            boxShadow: isOpen
              ? '0 10px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(147, 51, 234, 0.3)'
              : 'none',
          }}
        >
          {(
            showLoginButton
              ? [...mobileMenuItems, { name: 'Sign In', href: `${process.env.NEXT_PUBLIC_AUTH_APP_URL}/login` }]
              : mobileMenuItems
            ).map((item, index) => {
            const isApply = item.name === 'Apply';
            return (
              <a
                key={item.name}
                href={item.href}
                className={`font-franklinGothic text-white text-lg font-normal transition-all duration-200 hover:scale-105 rounded-lg ${
                  isApply
                    ? 'bg-transparent text-white border border-purple-400/80 ring-0 shadow-[0_0_18px_rgba(147,51,234,0.35),0_0_28px_rgba(147,51,234,0.2)] hover:shadow-[0_0_24px_rgba(147,51,234,0.45),0_0_36px_rgba(147,51,234,0.28)] animate-pulse w-[90%] px-8 py-3 text-center'
                    : item.name === 'Sign In'
                      ? 'bg-transparent text-white border border-purple-400/80 ring-0 w-[90%] px-8 py-3 text-center'
                      : 'hover:text-purple-300 hover:bg-purple-500/10 px-6 py-2'
                } ${isOpen ? `animate-fadeInUp` : ''}`}
                style={{
                  animationDelay: isOpen ? `${index * 50}ms` : '0ms',
                }}
                onClick={() => {
                  setIsOpen(false);
                  onMobileMenuToggle?.(false);
                }}
              >
                {item.name}
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
