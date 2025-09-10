'use client';

export default function WhenWhere() {
  return (
    <section
      id="d-time"
      className="py-12 mt-4 sm:mt-6 md:mt-8 lg:mt-4 scroll-mt-28"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-5xl font-bold mb-6 text-white">
            WHEN AND WHERE?
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 font-franklinGothic max-w-2xl mx-auto mb-8">
            Mark your calendars! Here's everything you need to know about the
            event details.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* When Card */}
            <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-sm border border-purple-500/40 rounded-3xl p-8 transition-all duration-500 hover:border-purple-400/60 hover:shadow-2xl hover:shadow-purple-500/20">
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                  <svg
                    className="w-8 h-8 text-purple-300"
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
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 font-franklinGothic">
                  WHEN
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-lg sm:text-xl text-gray-200 font-franklinGothic">
                      October 4th - 5th, 2025
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Where Card */}
            <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-sm border border-blue-500/40 rounded-3xl p-8 transition-all duration-500 hover:border-blue-400/60 hover:shadow-2xl hover:shadow-blue-500/20">
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                  <svg
                    className="w-8 h-8 text-blue-300"
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
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 font-franklinGothic">
                  WHERE
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-lg sm:text-xl text-gray-200 font-franklinGothic">
                      SWSH/SEIR, UTA Campus
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
