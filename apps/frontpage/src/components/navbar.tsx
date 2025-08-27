'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Link, Menu, X } from 'lucide-react';
import { Button } from './ui/button';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLoginButton, setShowLoginButton] = useState(false);
  const [authAppLoginUrl, setAuthAppLoginUrl] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    const handleFeatureFlags = async () => {
      const response = await fetch(
        '/api/feature-flags?flag=show_signin_button',
      );
      const data = await response.json();
      setShowLoginButton(data === 'true');
    };

    handleFeatureFlags();

    if (window) {
      setAuthAppLoginUrl(
        `${process.env.NEXT_PUBLIC_AUTH_APP_URL}/login?redirect_to=${window.location.href}profile`,
      );
      window.addEventListener('scroll', handleScroll);
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] px-[15px] md:px-[5px] text-center fancy-shadow md:h-12 transition-all duration-1000 ease-in-out border ${
        isScrolled
          ? 'w-[600px] bg-black/80 backdrop-blur-md rounded-full mx-4 shadow-2xl border-black/50'
          : 'w-full bg-black border-transparent'
      }`}
      style={{
        boxShadow: isScrolled
          ? '0 0 20px rgba(11, 10, 100, 0.8), 0 0 40px rgba(11, 10, 100, 0.6), 0 0 80px rgba(11, 10, 100, 0.4), 0 0 120px rgba(11, 10, 100, 0.2)'
          : 'none',
      }}
    >
      <div className="flex items-center justify-between px-20 md:px-5 h-full">
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
            { name: 'Sponsors', href: '#sponsors' },
            { name: 'Schedule', href: '#schedule' },
            { name: 'FAQ', href: '#faq' },
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
          {showLoginButton && (
            <Button variant="outline" asChild>
              <Link href={authAppLoginUrl}>Login</Link>
            </Button>
          )}
        </div>

        {/* Mobile Navigation */}
        <button
          className="md:hidden text-white focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Menu"
        >
          {isOpen ? <X size={32} /> : <Menu size={32} />}
        </button>

        <div
          className={`absolute top-full left-0 w-full bg-purple-950 bg-opacity-80 backdrop-blur-md flex flex-col items-center space-y-4 py-4 transition-all ${
            isOpen
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-95 pointer-events-none'
          }`}
        >
          {[
            { name: 'When & Where', href: '#d-time' },
            { name: 'Apply', href: '#apply' },
            { name: 'Sponsors', href: '#founders-arena' },
            { name: 'Schedule', href: '#schedule' },
            { name: 'FAQ', href: '#faq' },
          ].map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="font-franklinGothic text-white text-xl font-normal hover:text-purple-300 transition"
              onClick={() => setIsOpen(false)}
            >
              {item.name}
            </a>
          ))}
          {showLoginButton && (
            <Button variant="outline" asChild>
              <Link href={authAppLoginUrl}>Login</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
