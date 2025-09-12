'use client';

import Image from 'next/image';

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Mouser Electronics */}
          <div className="group bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm border border-purple-500/30 rounded-3xl p-8 transition-all duration-500 hover:scale-105 hover:border-purple-400/60 hover:shadow-2xl hover:shadow-purple-500/20">
            <div className="flex flex-col items-center text-center h-full">
              <div className="mb-6">
                <a
                  href="https://www.mouser.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block transition-transform duration-300 group-hover:scale-110"
                >
                  <Image
                    src="/MouserElectronics.svg"
                    alt="Mouser Electronics"
                    className="w-full max-w-[200px] h-auto"
                    width={500}
                    height={300}
                  />
                </a>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 font-franklinGothic">
                MOUSER ELECTRONICS
              </h3>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-franklinGothic flex-grow">
                Worldwide leading authorized distributor of semiconductors and
                electronic components for over 700 industry leading
                manufacturers.
              </p>
            </div>
          </div>

          {/* The Founder's Arena */}
          <div className="group bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm border border-purple-500/30 rounded-3xl p-8 transition-all duration-500 hover:scale-105 hover:border-purple-400/60 hover:shadow-2xl hover:shadow-purple-500/20">
            <div className="flex flex-col items-center text-center h-full">
              <div className="mb-6">
                <a
                  href="https://www.thefoundersarena.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block transition-transform duration-300 group-hover:scale-110"
                >
                  <Image
                    src="/FoundersArena.svg"
                    alt="The Founder's Arena"
                    className="w-full max-w-[180px] h-auto"
                    width={250}
                    height={75}
                  />
                </a>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 font-franklinGothic">
                THE FOUNDER'S ARENA
              </h3>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-franklinGothic flex-grow">
                A unique "go-to-market" Accelerator for WealthTech companies
                looking to scale across the global market with expert guidance.
              </p>
            </div>
          </div>

          {/* Major League Hacking */}
          <div className="group bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm border border-purple-500/30 rounded-3xl p-8 transition-all duration-500 hover:scale-105 hover:border-purple-400/60 hover:shadow-2xl hover:shadow-purple-500/20">
            <div className="flex flex-col items-center text-center h-full">
              <div className="mb-6">
                <a
                  href="https://mlh.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block transition-transform duration-300 group-hover:scale-110"
                >
                  <Image
                    src="/mlh-logo-color.png"
                    alt="Major League Hacking"
                    className="w-full max-w-[180px] h-auto"
                    width={300}
                    height={100}
                  />
                </a>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 font-franklinGothic">
                MAJOR LEAGUE HACKING
              </h3>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-franklinGothic flex-grow">
                The official student hackathon league. An engaged and passionate
                maker community of the next generation of technology leaders.
              </p>
            </div>
          </div>

          {/* Pure Button */}
          <div className="group bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm border border-purple-500/30 rounded-3xl p-8 transition-all duration-500 hover:scale-105 hover:border-purple-400/60 hover:shadow-2xl hover:shadow-purple-500/20 lg:col-start-2">
            <div className="flex flex-col items-center text-center h-full">
              <div className="mb-6">
                <a
                  href="https://mail.mlh.io/e/c/eyJlIjoxNTI0ODIsImVtYWlsX2lkIjoiZXhhbXBsZSIsImhyZWYiOiJodHRwczovL21saC5saW5rL01MSC1QdXJlQnV0dG9ucy1oYWNrYXRob25zP2Fqc191aWQ9MDE5NjNjZjEtNmZlNy00NmU1LThiOWItOWYzYjQ1ZTQ5YTQxXHUwMDI2dXRtX2NhbXBhaWduPU1lbWJlcitFdmVudCstK1B1cmUrQnV0dG9ucytJbnRyb1x1MDAyNnV0bV9jb250ZW50PVB1cmUrQnV0dG9ucytJbnRyb1x1MDAyNnV0bV9tZWRpdW09RW1haWxcdTAwMjZ1dG1fc291cmNlPUN1c3RvbWVyLmlvIiwidCI6MTc0NDgwNzUxMX0/465b97fffd84c977c1b3f1e4dc23b3c937dce616e1a19b195fbefe37581efec1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block transition-transform duration-300 group-hover:scale-110"
                >
                  <Image
                    src="/PureButtonsLogo.png"
                    alt="Pure Button"
                    className="w-full max-w-[180px] h-auto"
                    width={300}
                    height={100}
                  />
                </a>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 font-franklinGothic">
                PURE BUTTON
              </h3>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-franklinGothic flex-grow">
                Pure Buttons manufactures high quality promotional products like
                custom buttons, fridge magnets, and custom stickers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
