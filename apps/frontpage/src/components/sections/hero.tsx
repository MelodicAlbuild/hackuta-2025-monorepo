'use client';

import Image from 'next/image';
import GlitchLogo from '@/components/GlitchLogo';

export default function Hero() {
  return (
    <div className="relative w-full min-h-[130vh] md:min-h-[170vh] flex justify-center items-start">
      {/* Logo Container with glow */}
      <div className="absolute w-full top-[12%] sm:top-[2%] md:top-[1%] lg:top-[1.5%] left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center">
        <GlitchLogo
          src="/Logo.svg"
          alt="Main Logo"
          width={402}
          height={439}
          durationMs={1000}
          startDelayMs={700}
          wrapperClassName="absolute bottom-[-80px] sm:bottom-[-90px] md:bottom-[-100px] w-[50%] sm:w-[60%] max-w-[250px] sm:max-w-[300px] md:max-w-[400px] h-auto z-50"
          imgClassName="drop-shadow-[0_0_30px_rgba(61,58,255,0.41)]"
        />
        <GlitchLogo
          src="/hackutalogo.svg"
          alt="HackUTA Logo"
          width={418}
          height={113}
          durationMs={1000}
          startDelayMs={700}
          wrapperClassName="absolute bottom-[-80px] sm:bottom-[-90px] md:bottom-[-100px] w-[50%] sm:w-[60%] max-w-[250px] sm:max-w-[300px] md:max-w-[400px] h-auto z-50"
          imgClassName="drop-shadow-[0_0_30px_rgba(61,58,255,0.41)]"
        />
      </div>

      {/* Buildings + Glow */}
      <div className="absolute w-full top-[60%] sm:top-[55%] md:top-[30%] left-0 flex justify-center items-end">
        <div className="relative w-full">
          <Image
            src="/BuildingGlow.svg"
            alt="Building Glow"
            className="absolute top-[40px] sm:top-[60px] md:top-[40px] w-full h-auto z-10 building-glow-mask"
            width={1438}
            height={730}
          />
          <Image
            src="/Buildings.svg"
            alt="Buildings"
            className="absolute top-0 w-full h-auto z-20 building-mask"
            width={1440}
            height={761}
          />
        </div>
      </div>
    </div>
  );
}
