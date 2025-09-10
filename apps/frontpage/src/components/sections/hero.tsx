'use client';

import Image from 'next/image';

export default function Hero() {
  return (
    <div className="relative w-full min-h-[130vh] md:min-h-[170vh] flex justify-center items-start">
      {/* Logo Container with glow */}
      <div className="absolute w-full top-[5%] sm:top-[20%] md:top-[10%] lg:top-[12%] left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center">
        <Image
          src="/Logo.svg"
          alt="Main Logo"
          className="absolute bottom-[-400px] sm:bottom-[-400px] md:bottom-[-400px] w-[50%] sm:w-[60%] max-w-[250px] sm:max-w-[300px] md:max-w-[400px] h-auto z-50 drop-shadow-[0_0_30px_rgba(61,58,255,0.41)]"
          width={402}
          height={439}
        />
        <Image
          src="/hackutalogo.svg"
          alt="HackUTA Logo"
          className="absolute bottom-[-460px] sm:bottom-[-460px] md:bottom-[-510px] w-[50%] sm:w-[60%] max-w-[250px] sm:max-w-[300px] md:max-w-[400px] h-auto z-50 drop-shadow-[0_0_30px_rgba(61,58,255,0.41)]"
          width={418}
          height={113}
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
