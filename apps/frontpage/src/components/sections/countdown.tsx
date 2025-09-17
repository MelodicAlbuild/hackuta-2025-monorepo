'use client';

import { useEffect, useMemo, useState } from 'react';

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
};

function getTimeLeft(target: Date): TimeLeft {
  const now = new Date();
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, isPast: false };
}

export default function Countdown() {
  // Target: Oct 4, 2025 in US Central Time (UTC-05 at that date)
  const target = useMemo(() => new Date('2025-10-04T00:00:00-05:00'), []);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(target));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(target));
    }, 1000);
    return () => clearInterval(interval);
  }, [target]);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <section
      aria-label="Countdown to HackUTA on Oct 4, 2025"
      className="w-full px-6 sm:px-10 mt-[-40px] md:mt-0 relative z-[20]"
    >
      <div className="max-w-4xl mx-auto">
        <div className="font-franklinGothic text-center mb-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            Countdown to HackUTA 2025
          </h2>
          <p className="mt-2 text-gray-300 text-sm sm:text-base">
            October 4, 2025 • SWSH/SEIR
          </p>
        </div>

        <div className="grid gap-2">
          <div className="grid grid-cols-7 items-center justify-center justify-items-center gap-x-2 sm:gap-x-3 md:gap-x-4">
            <TimeNumber value={pad(timeLeft.days)} />
            <Colon blinkOn={timeLeft.seconds % 2 === 0} />
            <TimeNumber value={pad(timeLeft.hours)} />
            <Colon blinkOn={timeLeft.seconds % 2 === 0} />
            <TimeNumber value={pad(timeLeft.minutes)} />
            <Colon blinkOn={timeLeft.seconds % 2 === 0} />
            <TimeNumber value={pad(timeLeft.seconds)} />
          </div>
          <div className="grid grid-cols-7">
            <div className="col-start-1 text-center text-xs sm:text-sm uppercase tracking-[0.2em] text-gray-300 font-franklinGothic">
              Days
            </div>
            <div className="col-start-3 text-center text-xs sm:text-sm uppercase tracking-[0.2em] text-gray-300 font-franklinGothic">
              Hours
            </div>
            <div className="col-start-5 text-center text-xs sm:text-sm uppercase tracking-[0.2em] text-gray-300 font-franklinGothic">
              Minutes
            </div>
            <div className="col-start-7 text-center text-xs sm:text-sm uppercase tracking-[0.2em] text-gray-300 font-franklinGothic">
              Seconds
            </div>
          </div>
        </div>

        {timeLeft.isPast && (
          <p className="mt-3 text-center text-gray-300 font-franklinGothic">
            The event has started — see you there!
          </p>
        )}
      </div>
    </section>
  );
}

function TimeNumber({ value }: { value: string }) {
  return (
    <div className="relative inline-flex items-center justify-center overflow-hidden rounded-2xl border border-white/20 px-4 sm:px-5 py-3 sm:py-4 shadow-lg shadow-red-500/30 backdrop-blur-md">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 rounded-2xl bg-gradient-to-br from-gray-600/60 via-transparent to-red-500/60 opacity-40"
      />
      <span className="relative z-10 font-franklinCondensed text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white drop-shadow-[0_0_20px_rgba(220,38,38,0.25)]">
        {value}
      </span>
    </div>
  );
}

function Colon({ blinkOn }: { blinkOn: boolean }) {
  return (
    <span
      aria-hidden
      className={
        `font-franklinCondensed select-none text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white align-middle transition-opacity duration-300 ` +
        (blinkOn ? 'opacity-100' : 'opacity-20')
      }
    >
      :
    </span>
  );
}
