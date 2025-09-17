'use client';

import Image from 'next/image';

const sponsors = [
  {
    name: 'Mouser Electronics',
    href: 'https://www.mouser.com/',
    logo: '/mouserWhite.png',
    width: 300,
    height: 140,
  },
  {
    name: "The Founder's Arena",
    href: 'https://www.thefoundersarena.com/',
    logo: '/FoundersArena.svg',
    width: 240,
    height: 120,
  },
  {
    name: 'Major League Hacking',
    href: 'https://mlh.io/',
    logo: '/mlh-logo-color.png',
    width: 260,
    height: 120,
  },
  {
    name: 'Pure Buttons',
    href: 'https://mail.mlh.io/e/c/eyJlIjoxNTI0ODIsImVtYWlsX2lkIjoiZXhhbXBsZSIsImhyZWYiOiJodHRwczovL21saC5saW5rL01MSC1QdXJlQnV0dG9ucy1oYWNrYXRob25zP2Fqc191aWQ9MDE5NjNjZjEtNmZlNy00NmU1LThiOWItOWYzYjQ1ZTQ5YTQxXHUwMDI2dXRtX2NhbXBhaWduPU1lbWJlcitFdmVudCstK1B1cmUrQnV0dG9ucytJbnRyb1x1MDAyNnV0bV9jb250ZW50PVB1cmUrQnV0dG9ucytJbnRyb1x1MDAyNnV0bV9tZWRpdW09RW1haWxcdTAwMjZ1dG1fc291cmNlPUN1c3RvbWVyLmlvIiwidCI6MTc0NDgwNzUxMX0/465b97fffd84c977c1b3f1e4dc23b3c937dce616e1a19b195fbefe37581efec1',
    logo: '/PureButtonsLogo.png',
    width: 260,
    height: 120,
  },
  {
    name: 'IEEE',
    href: 'https://www.ieee.org/',
    logo: '/ieee_logo.svg',
    width: 240,
    height: 100,
  },
  {
    name: 'Red Bull',
    href: 'https://www.redbull.com/',
    logo: '/redbull.png',
    width: 200,
    height: 120,
  },
  {
    name: 'CSE Department',
    href: 'https://www.uta.edu/academics/schools-colleges/engineering/academics/departments/computer-science-engineering',
    logo: '/cselogo.png',
    width: 200,
    height: 120,
  },
];

export default function Sponsors() {
  return (
    <section id="sponsors" className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-bold mb-4 text-white">
            Our Amazing Sponsors
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 font-franklinGothic max-w-2xl mx-auto">
            Special thanks to our incredible sponsors who make HackUTA 2025
            possible
          </p>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-red-500/30 bg-black/40 px-6 py-12 sm:px-10 sm:py-14">
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-blue-500/20" />
          <span className="pointer-events-none absolute -top-24 right-12 h-72 w-72 rounded-full bg-red-500/20 blur-3xl" />
          <span className="pointer-events-none absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sponsors.map(({ name, href, logo, width, height }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex h-32 items-center justify-center overflow-hidden rounded-2xl border border-red-500/30 px-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-red-500/50 faq-glow hover:shadow-[0_25px_50px_-12px_rgba(248,113,113,0.05)]"
              >
                <span
                  className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      'radial-gradient(circle at top, rgba(248,113,113,0.25), transparent 60%)',
                  }}
                />
                <Image
                  src={logo}
                  alt={name}
                  width={width}
                  height={height}
                  className="relative z-10 w-auto max-h-16 sm:max-h-20 object-contain drop-shadow-[0_0_35px_rgba(255,255,255,0.10)]"
                />
                <span className="sr-only">{name}</span>
              </a>
            ))}
          </div>
          <div className="relative mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:text-sm text-gray-300/80">
            <span className="uppercase tracking-[0.35em] text-red-200">
              Interested in sponsoring?
            </span>
            <a
              className="font-franklinGothic underline decoration-red-400/60 underline-offset-4 transition hover:text-white"
              href="mailto:sponsor@hackuta.org"
            >
              sponsor@hackuta.org
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
