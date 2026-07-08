"use client";

import { Calendar, momentLocalizer, View, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

const localizer = momentLocalizer(moment);

type CalendarEvent = {
  title: string;
  start: Date;
  end: Date;
  subject?: string;
  teacher?: string;
  class?: string;
};

const BigCalendar = ({
  data,
}: {
  data: CalendarEvent[];
}) => {
  const [view, setView] = useState<View>(Views.WORK_WEEK);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const currentDate = dateParam ? new Date(dateParam) : new Date();

  const handleOnChangeView = (selectedView: View) => {
    setView(selectedView);
  };

  const minDate = new Date(currentDate);
  minDate.setHours(8, 0, 0, 0);
  const maxDate = new Date(currentDate);
  maxDate.setHours(17, 0, 0, 0);

  const formattedTime = selectedEvent
    ? `${moment(selectedEvent.start).format("dddd, MMMM D")} · ${moment(selectedEvent.start).format("h:mm A")} - ${moment(selectedEvent.end).format("h:mm A")}`
    : "";

  return (
    <>
      <Calendar
        localizer={localizer}
        events={data}
        startAccessor="start"
        endAccessor="end"
        views={["work_week", "day"]}
        view={view}
        date={currentDate}
        style={{ height: "98%" }}
        onView={handleOnChangeView}
        min={minDate}
        max={maxDate}
        onSelectEvent={(event) => setSelectedEvent(event as CalendarEvent)}
      />

      {selectedEvent && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn"
          onClick={() => setSelectedEvent(null)}
        >
          <div 
            className="w-full max-w-md bg-white dark:bg-[#0D0D0E] rounded-2xl p-6 shadow-2xl border border-gray-100 dark:border-[#27272A] relative text-gray-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg transition"
            >
              ✕
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-skillBlue/10 flex items-center justify-center text-skillBlue font-bold text-lg">
                📅
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedEvent.title}</h3>
                <span className="text-xs text-gray-400">Schedule Details</span>
              </div>
            </div>

            <div className="space-y-3.5 my-5 text-sm">
              {selectedEvent.subject && (
                <div className="flex justify-between border-b border-gray-100 dark:border-zinc-800/80 pb-2">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">Subject</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-200">{selectedEvent.subject}</span>
                </div>
              )}
              {selectedEvent.teacher && (
                <div className="flex justify-between border-b border-gray-100 dark:border-zinc-800/80 pb-2">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">Instructor</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-200">{selectedEvent.teacher}</span>
                </div>
              )}
              {selectedEvent.class && (
                <div className="flex justify-between border-b border-gray-100 dark:border-zinc-800/80 pb-2">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">Batch</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-200">{selectedEvent.class}</span>
                </div>
              )}
              <div className="flex flex-col gap-1.5 pt-1.5">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Timing</span>
                <span className="font-medium text-xs text-skillBlue bg-skillBlue/5 dark:bg-skillBlue/10 p-2.5 rounded-lg border border-skillBlue/10">
                  ⏰ {formattedTime}
                </span>
              </div>
            </div>

            <button 
              onClick={() => setSelectedEvent(null)}
              className="w-full mt-4 bg-skillBlue hover:bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default BigCalendar;
