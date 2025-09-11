'use client';

import Map from '../map';

export default function WhenWhere() {
  return (
    <section
      id="about"
      className="py-12 mt-4 sm:mt-6 md:mt-8 lg:mt-4 scroll-mt-28"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col items-center text-center gap-2">
          <h2 className="text-3xl sm:text-5xl font-bold text-white">About</h2>
          <p className="mt-2 text-gray-300 font-franklinGothic">
            Everything you need to plan your visit.
          </p>
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm border border-white/10 p-5 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-center md:items-center">
            {/* Details Column */}
            <div className="md:col-span-5 flex flex-col gap-5 md:self-center">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4 text-purple-300"
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
                  <p className="text-sm uppercase tracking-wide text-gray-400 font-franklinGothic">
                    When
                  </p>
                </div>
                <p className="mt-1 text-lg sm:text-xl text-white font-franklinGothic">
                  October 4–5, 2025
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4 text-blue-300"
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
                  <p className="text-sm uppercase tracking-wide text-gray-400 font-franklinGothic">
                    Where
                  </p>
                </div>
                <p className="mt-1 text-lg sm:text-xl text-white font-franklinGothic">
                  SWSH/SEIR, UTA
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4 text-sky-300"
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
                  <p className="text-sm uppercase tracking-wide text-gray-400 font-franklinGothic">
                    Directions
                  </p>
                </div>
                <div className="mt-2 flex gap-3 justify-center">
                  <a
                    className="font-franklinGothic px-5 py-2.5 text-base font-semibold text-white rounded-2xl transition-all duration-300 hover:scale-105 text-center bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 hover:border-white/30 shadow-lg hover:shadow-2xl hover:shadow-purple-500/30"
                    target="_blank"
                    href="https://www.google.com/maps/place/School+of+Social+Work+and+Smart+Hospital+(SWSH)/@32.7274712,-97.1117394,20.09z/data=!4m12!1m5!3m4!2zMzLCsDQzJzQxLjUiTiA5N8KwMDYnMzkuMCJX!8m2!3d32.7281944!4d-97.1108333!3m5!1s0x864e7d733472202d:0x48ce4f3f6b59840c!8m2!3d32.7273039!4d-97.1113082!16s%2Fg%2F1hdztzc3s?entry=ttu"
                  >
                    Google Maps
                  </a>
                  <a
                    className="font-franklinGothic px-5 py-2.5 text-base font-semibold text-white rounded-2xl transition-all duration-300 hover:scale-105 text-center bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 hover:border-white/30 shadow-lg hover:shadow-2xl hover:shadow-purple-500/30"
                    target="_blank"
                    href="https://maps.apple.com/?address=501%20W%20Mitchell%20St%0AArlington,%20TX%20%2076019%0AUnited%20States&auid=15965471530354566328&ll=32.727529,-97.111612&lsp=9902&q=School%20of%20Social%20Work&t=m "
                  >
                    Apple Maps
                  </a>
                </div>
              </div>
            </div>

            {/* Map Column */}
            <div className="md:col-span-7 rounded-2xl border border-white/10 bg-white/5 p-3 h-full">
              <Map embedded />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
