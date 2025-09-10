'use client';

import scheduleData from '../../../schedule.json';
import useWindowSize from '@/hooks/useWindowSize';

type ScheduleEvent = {
  id: number;
  label: string;
  'time-start': string;
};

type ScheduleDay = {
  id: number;
  label: string;
  'time-start': string;
  'time-end': string;
  indent: boolean;
  inline?: boolean;
  children?: ScheduleEvent[];
};

export default function Schedule() {
  const size = useWindowSize();

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-5xl font-bold mb-4 text-white">
          HackUTA Schedule
        </h2>
        <p className="text-lg sm:text-xl text-gray-300 font-franklinGothic max-w-2xl mx-auto">
          Plan your 24-hour hackathon journey with our detailed event schedule
        </p>
      </div>
      <div className="w-full max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {scheduleData.map((day) => {
            const isInline = (day as ScheduleDay).inline && size.width >= 968;

            return (
              <div
                key={day.id}
                className={`px-6 py-2 ${
                  !isInline ? 'lg:col-span-2 xl:col-span-3' : ''
                }`}
              >
                <div className="flex flex-col h-full">
                  <div className="mb-4">
                    <div className="flex flex-col sm:flex-row sm:justify-center gap-4 text-gray-300 font-franklinGothic">
                      {day['time-start'] && (
                        <div className="flex items-center justify-center gap-3 bg-white/10 rounded-xl px-4 py-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <div className="text-center">
                            <div className="text-xs text-gray-400 uppercase tracking-wide">
                              Start
                            </div>
                            <div className="text-sm sm:text-base font-semibold text-white">
                              {day['time-start']}
                            </div>
                          </div>
                        </div>
                      )}
                      {day['time-end'] && (
                        <div className="flex items-center justify-center gap-3 bg-white/10 rounded-xl px-4 py-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <div className="text-center">
                            <div className="text-xs text-gray-400 uppercase tracking-wide">
                              End
                            </div>
                            <div className="text-sm sm:text-base font-semibold text-white">
                              {day['time-end']}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {(day as ScheduleDay).children && (
                    <div className="flex-1">
                      <div className="space-y-4">
                        {(day as ScheduleDay).children!.map((event) => (
                          <div key={event.id} className="p-4">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                              <h4 className="text-white font-semibold text-sm sm:text-base font-franklinGothic">
                                {event.label}
                              </h4>
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                                <span className="text-purple-300 text-xs sm:text-sm font-franklinGothic">
                                  {event['time-start']}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
