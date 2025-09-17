'use client';

import { type ReactNode } from 'react';

import Map from '../map';

type EventDetail = {
  id: string;
  label: string;
  description: string;
  iconWrapperClass: string;
  icon: ReactNode;
  actions?: ReactNode;
};

export default function WhenWhere() {
  const details: EventDetail[] = [
    {
      id: 'when',
      label: 'When',
      description: 'October 4–5, 2025',
      iconWrapperClass:
        'border-red-400/40 bg-red-500/15 text-red-200 shadow-[0_0_20px_rgba(248,113,113,0.25)]',
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      id: 'where',
      label: 'Where',
      description: 'SWSH/SEIR, UTA',
      iconWrapperClass:
        'border-blue-400/40 bg-blue-500/15 text-blue-200 shadow-[0_0_20px_rgba(96,165,250,0.25)]',
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    {
      id: 'directions',
      label: 'Directions',
      description: 'Pick your preferred map app and head our way.',
      iconWrapperClass:
        'border-sky-400/40 bg-sky-500/15 text-sky-200 shadow-[0_0_20px_rgba(125,211,252,0.25)]',
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7h18M5 7v10a2 2 0 002 2h10a2 2 0 002-2V7"
          />
        </svg>
      ),
      actions: (
        <>
          <a
            className="font-franklinGothic px-5 py-2.5 text-base font-semibold text-white rounded-2xl transition-all duration-300 hover:scale-105 text-center bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 hover:border-white/30 shadow-lg hover:shadow-2xl hover:shadow-red-500/30"
            target="_blank"
            href="https://www.google.com/maps/place/School+of+Social+Work+and+Smart+Hospital+(SWSH)/@32.7274712,-97.1117394,20.09z/data=!4m12!1m5!3m4!2zMzLCsDQzJzQxLjUiTiA5N8KwMDYnMzkuMCJX!8m2!3d32.7281944!4d-97.1108333!3m5!1s0x864e7d733472202d:0x48ce4f3f6b59840c!8m2!3d32.7273039!4d-97.1113082!16s%2Fg%2F1hdztzc3s?entry=ttu"
          >
            Google Maps
          </a>
          <a
            className="font-franklinGothic px-5 py-2.5 text-base font-semibold text-white rounded-2xl transition-all duration-300 hover:scale-105 text-center bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 hover:border-white/30 shadow-lg hover:shadow-2xl hover:shadow-red-500/30"
            target="_blank"
            href="https://maps.apple.com/?address=501%20W%20Mitchell%20St%0AArlington,%20TX%20%2076019%0AUnited%20States&auid=15965471530354566328&ll=32.727529,-97.111612&lsp=9902&q=School%20of%20Social%20Work&t=m "
          >
            Apple Maps
          </a>
        </>
      ),
    },
  ];

  return (
    <section
      id="about"
      className="py-12 mt-4 sm:mt-6 md:mt-8 lg:mt-4 scroll-mt-28"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col items-center text-center gap-2">
          <h2 className="text-3xl sm:text-5xl font-bold text-white">
            Event Details
          </h2>
          <p className="mt-2 text-gray-300 font-franklinGothic">
            Everything you need to plan your visit.
          </p>
        </div>

        <article className="faq-glow grid grid-cols-1 overflow-hidden rounded-3xl border border-red-500/30 bg-gradient-to-br from-red-900/30 via-blue-900/20 to-black/60 backdrop-blur-xl md:grid-cols-12">
          <ul className="divide-y divide-white/10 bg-black/30 md:col-span-5">
            {details.map((detail) => (
              <li
                key={detail.id}
                className="px-6 py-5 sm:px-7 sm:py-6 transition-colors duration-300 hover:bg-red-500/10"
              >
                <div className="flex items-start gap-4">
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-full border ${detail.iconWrapperClass}`}
                  >
                    {detail.icon}
                  </span>
                  <div className="flex-1">
                    <span className="text-xs uppercase tracking-[0.3em] text-gray-300 font-franklinGothic">
                      {detail.label}
                    </span>
                    <p className="mt-2 text-base sm:text-lg font-semibold text-white font-franklinGothic">
                      {detail.description}
                    </p>
                    {detail.actions ? (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {detail.actions}
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="border-t border-red-500/20 bg-black/30 p-5 sm:p-6 md:col-span-7 md:border-l md:border-t-0">
            <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-3">
              <Map embedded />
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
