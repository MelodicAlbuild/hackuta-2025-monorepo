'use client';

import InterestForm from '@/components/interest-form';

export default function Apply() {
  return (
    <section id="apply" className="py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-5xl font-bold mb-6 text-white">
            ARE YOU READY TO GO BEYOND?
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 font-franklinGothic max-w-2xl mx-auto mb-8">
            Join hundreds of innovators, creators, and dreamers for 24 hours of
            building the future. Register now and be part of something
            extraordinary.
          </p>

          <div className="flex flex-col items-center space-y-8">
            <div className="flex flex-col sm:flex-row gap-6 items-center justify-center w-full max-w-lg">
              <InterestForm />
              <a
                href="https://discord.gg/2bVsYS3SgS"
                target="_blank"
                rel="noopener noreferrer"
                className="font-franklinGothic relative px-10 py-4 text-lg font-semibold text-white rounded-2xl transition-all duration-300 hover:scale-105 text-center min-w-[220px] bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 hover:border-white/30 shadow-lg hover:shadow-2xl hover:shadow-purple-500/30"
              >
                <span className="relative z-10">JOIN DISCORD</span>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50"></div>
              </a>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400 font-franklinGothic">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>24 Hours of Hacking</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Free Food & Swag</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Amazing Prizes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
