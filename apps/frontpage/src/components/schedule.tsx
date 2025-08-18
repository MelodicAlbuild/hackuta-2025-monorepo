"use client";

import scheduleData from "../../schedule.json";
import useWindowSize from "@/hooks/useWindowSize";

type ScheduleEvent = {
  id: number;
  label: string;
  "time-start": string;
};

type ScheduleDay = {
  id: number;
  label: string;
  "time-start": string;
  "time-end": string;
  indent: boolean;
  inline?: boolean;
  children?: ScheduleEvent[];
};

export default function Schedule() {
  const size = useWindowSize();

  return (
    <div className="grid grid-cols-3 gap-4 md:w-[40%] sm:w-[70%]">
      {scheduleData.map((day, index) => {
        let reval = (
          <div
            className="text-white lg:text-2xl md:text-xl border rounded-lg p-2 col-span-3"
            key={day.id}
          >
            <h1 className="xl:text-3xl lg:text-2xl underline">
              {day["label"]}
            </h1>
            <h2>
              {day["time-start"] != "" ? (
                <p>Starts At: {day["time-start"]}</p>
              ) : (
                <></>
              )}
            </h2>
            {day["time-end"] != "" ? <p>Ends At: {day["time-end"]}</p> : <></>}

            {(day as ScheduleDay)["children"] != undefined ? (
              <div className="flex justify-center mt-4 md:pb-4 sm:pb-2">
                <div className="grid grid-cols-1 gap-4 w-[70%]">
                  {(day as ScheduleDay)["children"]!.map((event) => (
                    <div
                      className="text-white xl:text-2xl lg:text-xl border rounded-lg p-2"
                      key={event.id}
                    >
                      <h3>
                        {event["label"]}: {event["time-start"]}
                      </h3>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div key={"null-" + index}></div>
            )}
          </div>
        );

        if (
          (day as ScheduleDay).inline != null &&
          (day as ScheduleDay).inline &&
          size.width >= 968
        ) {
          reval = (
            <div
              className="text-white lg:text-2xl md:text-xl border rounded-lg p-2"
              key={day.id}
            >
              <h1 className="xl:text-3xl lg:text-2xl underline">
                {day["label"]}
              </h1>
              <h2>
                {day["time-start"] != "" ? (
                  <p>Starts At: {day["time-start"]}</p>
                ) : (
                  <></>
                )}
              </h2>
              {day["time-end"] != "" ? (
                <p>Ends At: {day["time-end"]}</p>
              ) : (
                <></>
              )}
            </div>
          );
        }

        return reval;
      })}
    </div>
  );
}
