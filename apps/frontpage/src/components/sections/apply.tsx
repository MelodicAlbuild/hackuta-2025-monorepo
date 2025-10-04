'use client';

export default function Apply() {
  return (
    <section id="apply" className="py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-5xl lg:text-4xl font-bold mb-6 text-white">
            ARE YOU READY TO ENTER THE HACKERVERSE?
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 font-franklinGothic max-w-2xl mx-auto mb-8">
            Join hundreds of innovators, creators, and dreamers for 24 hours of
            building the future. Register now and be part of the hackerverse.
          </p>

          <div className="flex flex-col items-center space-y-8">
            <div className="flex flex-col sm:flex-row gap-6 items-center justify-center w-full max-w-lg">
              <a
                href="https://discord.gg/2bVsYS3SgS"
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-target font-franklinGothic relative px-10 py-4 text-lg font-semibold text-white rounded-2xl transition-all duration-300 hover:scale-105 text-center min-w-[220px] bg-gradient-to-r from-red-900/20 to-blue-900/20 backdrop-blur-sm border border-red-500/30 hover:border-red-500/50 faq-glow shadow-[0_0_18px_rgba(239,68,68,0.4),0_0_28px_rgba(239,68,68,0.24)] hover:shadow-[0_0_24px_rgba(239,68,68,0.5),0_0_36px_rgba(239,68,68,0.32)]"
              >
                <span className="relative z-10">JOIN DISCORD</span>
              </a>
              <a
                href="https://hackuta7.devpost.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-target font-franklinGothic relative px-10 py-4 text-lg font-semibold text-white rounded-2xl transition-all duration-300 hover:scale-105 text-center min-w-[220px] bg-gradient-to-r from-red-900/20 to-blue-900/20 backdrop-blur-sm border border-red-500/30 hover:border-red-500/50 faq-glow shadow-[0_0_18px_rgba(239,68,68,0.4),0_0_28px_rgba(239,68,68,0.24)] hover:shadow-[0_0_24px_rgba(239,68,68,0.5),0_0_36px_rgba(239,68,68,0.32)]"
              >
                <span className="relative z-10">DEVPOST</span>
              </a>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400 font-franklinGothic">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
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
