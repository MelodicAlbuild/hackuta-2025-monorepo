import React from 'react';

type MapProps = { src?: string; embedded?: boolean };

const Map = ({ src, embedded }: MapProps) => {
  const iframe = (
    <iframe
      src={
        src
          ? src
          : 'https://www.google.com/maps/d/embed?mid=1o_POO-JK5FeDJP21R0HpgCwcUhNO1iQ&ehbc=2E312F'
      }
      className="absolute inset-0 w-full h-full rounded-xl"
    />
  );

  const legend = (
    <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5">
      <div className="flex items-center gap-2">
        <span
          className="w-3.5 h-3.5 rounded bg-red-500 border border-white/40"
          aria-hidden="true"
        ></span>
        <span className="text-sm sm:text-base text-gray-200 font-franklinGothic">
          Event Venue
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="w-3.5 h-3.5 rounded bg-blue-500 border border-white/40"
          aria-hidden="true"
        ></span>
        <span className="text-sm sm:text-base text-gray-200 font-franklinGothic">
          Parking
        </span>
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-full">
          <div className="relative w-full max-[640px]:h-[320px] h-[400px]">
            {iframe}
            {/* Overlay legend */}
            <div className="absolute left-[50%] bottom-3 translate-x-[-50%] flex items-center gap-3 rounded-2xl bg-black/50 backdrop-blur-sm border border-white/20 px-3 py-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded bg-red-500 border border-white/40"
                  aria-hidden="true"
                ></span>
                <span className="text-xs sm:text-sm text-gray-100 font-franklinGothic">
                  Venue
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded bg-blue-500 border border-white/40"
                  aria-hidden="true"
                ></span>
                <span className="text-xs sm:text-sm text-gray-100 font-franklinGothic">
                  Parking
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="z-100 bg-transparent flex flex-col items-center justify-start pt-0 px-5 box-border gap-[24px_0px] max-w-full text-center text-57xl text-white">
      <div className="text-3xl sm:text-5xl font-bold mb-2 text-white font-franklinGothic flex flex-row items-start justify-center py-0 px-5">
        Venue & Parking
      </div>
      <div className="flex justify-center w-full px-4">
        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-sm border border-purple-500/40 rounded-3xl p-6 sm:p-8 transition-all duration-500 hover:border-purple-400/60 hover:shadow-2xl hover:shadow-purple-500/20 flex flex-col items-center justify-center gap-5 w-full max-w-4xl">
          <div className="w-full flex justify-center">{iframe}</div>
          {legend}
        </div>
      </div>
    </section>
  );
};

export default Map;
