'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Instagram, Linkedin, Mail, Github } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();

  const navLinks = [
    { label: 'About', href: '#about' },
    { label: 'Schedule', href: '#schedule' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Sponsors', href: '#sponsors' },
    { label: 'Apply', href: '#apply' },
  ];

  const socials = [
    {
      name: 'Instagram',
      href: 'https://instagram.com/hackuta',
      Icon: Instagram,
    },
    {
      name: 'LinkedIn',
      href: 'https://www.linkedin.com/company/hackuta',
      Icon: Linkedin,
    },
    { name: 'GitHub', href: 'https://github.com/hackuta', Icon: Github },
    { name: 'Email', href: 'mailto:contact@hackuta.org', Icon: Mail },
  ];

  return (
    <footer className="w-full border-t border-purple-500/20 bg-black/80 text-white">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        {/* Top section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 py-12">
          {/* Brand */}
          <div>
            <Link
              href="#"
              className="inline-flex items-center gap-3 hover:opacity-90 transition"
            >
              <Image
                src="/Logo.svg"
                alt="HackUTA"
                width={36}
                height={36}
                priority
              />
              <span className="font-franklinGothic text-2xl tracking-wide">
                HackUTA
              </span>
            </Link>
            <p className="mt-4 text-sm text-gray-300 leading-relaxed font-franklinGothic">
              HackUTA is UTA’s premier hackathon bringing together students to
              build, learn, and create over a high‑energy 24 hours.
            </p>

            {/* Socials */}
            <div className="mt-6 flex items-center gap-3">
              {socials.map(({ name, href, Icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  className="group inline-flex h-9 w-9 items-center justify-center rounded-full border border-purple-400/30 bg-black/40 hover:bg-purple-500/10 hover:border-purple-400/60 transition shadow-[0_0_10px_rgba(147,51,234,0.15)]"
                >
                  <Icon className="h-4 w-4 text-gray-200 group-hover:text-purple-200" />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-200/90">
              Explore
            </h3>
            <ul className="mt-4 space-y-2">
              {navLinks.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-gray-300 hover:text-purple-300 transition font-franklinGothic"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Event Info */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-200/90">
              Event
            </h3>
            <ul className="mt-4 space-y-2 text-gray-300 font-franklinGothic">
              <li>October 4–5, 2025,</li>
              <li>SWSH and SEIR,</li>
              <li>University of Texas at Arlington,</li>
              <li>Arlington, TX</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-200/90">
              Contact
            </h3>
            <ul className="mt-4 space-y-2 text-gray-300 font-franklinGothic">
              <li>
                <a
                  href="mailto:contact@hackuta.org"
                  className="hover:text-purple-300 transition"
                >
                  contact@hackuta.org
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-purple-500/20 py-6">
          <p className="text-xs sm:text-sm text-gray-400 font-franklinGothic">
            © {year} HackUTA. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs sm:text-sm">
            <a
              href="http://mlh.io/code-of-conduct"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-purple-300 transition"
            >
              Code of Conduct
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
