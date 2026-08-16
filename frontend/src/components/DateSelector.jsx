import { useState, useEffect, useRef } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { getLocalDateString, formatLocalDate } from "../utils/date";

export default function DateSelector({ selectedDate, onSelectDate }) {
  const todayStr = getLocalDateString(new Date());
  const containerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  const [selectedYear, selectedMonth] = selectedDate.split("-").map(Number);
  const [currentYear, setCurrentYear] = useState(selectedYear || 2026);
  const [currentMonth, setCurrentMonth] = useState((selectedMonth - 1) || 4);

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return getLocalDateString(d);
  });

  const isCustomDateSelected = !dates.includes(selectedDate);

  const handleToggleCalendar = () => {
    if (!isOpen && selectedDate) {
      const [year, month] = selectedDate.split("-").map(Number);
      if (year && month) {
        setCurrentYear(year);
        setCurrentMonth(month - 1);
      }
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const blanks = Array.from({ length: firstDayOfWeek });
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const minDate = new Date(2026, 4, 19);
  const today = new Date();

  const isPrevDisabled =
    currentYear < minDate.getFullYear() ||
    (currentYear === minDate.getFullYear() && currentMonth <= minDate.getMonth());

  const isNextDisabled =
    currentYear > today.getFullYear() ||
    (currentYear === today.getFullYear() && currentMonth >= today.getMonth());

  const handlePrevMonth = () => {
    if (isPrevDisabled) return;
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };

  const handleNextMonth = () => {
    if (isNextDisabled) return;
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex gap-4 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-1 items-center">
        {dates.map((date) => {
          const isToday = date === todayStr;
          const displayDate = formatLocalDate(date, { month: "short", day: "numeric" });
          return (
            <button
              key={date}
              onClick={() => onSelectDate(date)}
              className={`whitespace-nowrap px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-300 border cursor-pointer ${
                selectedDate === date
                  ? "bg-theme-accent text-theme-bg border-theme-accent shadow-md shadow-theme-fg/5"
                  : "bg-transparent text-theme-muted hover:text-theme-fg border-theme-border/80 hover:border-theme-muted/50"
              }`}
            >
              {isToday ? "Today" : displayDate}
            </button>
          );
        })}

        <button
          onClick={handleToggleCalendar}
          className={`w-[34px] h-[34px] flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-300 border cursor-pointer ${
            isCustomDateSelected
              ? "bg-theme-accent text-theme-bg border-theme-accent shadow-md shadow-theme-fg/5 scale-105"
              : "bg-transparent text-theme-muted hover:text-theme-fg border-theme-border/80 hover:border-theme-muted/50"
          }`}
          title={isCustomDateSelected ? `Selected: ${formatLocalDate(selectedDate)}` : "Select custom date"}
          aria-label="Select custom date"
        >
          <Calendar className="w-4 h-4" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2.5 z-50 bg-theme-card-bg/95 backdrop-blur-md border border-theme-border shadow-xl rounded-2xl p-4 w-72">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black tracking-widest text-theme-fg uppercase">
              {new Date(currentYear, currentMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                disabled={isPrevDisabled}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  isPrevDisabled ? "text-theme-muted/30 cursor-not-allowed" : "text-theme-muted hover:text-theme-fg hover:bg-theme-selection-bg"
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNextMonth}
                disabled={isNextDisabled}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  isNextDisabled ? "text-theme-muted/30 cursor-not-allowed" : "text-theme-muted hover:text-theme-fg hover:bg-theme-selection-bg"
                }`}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <span key={d} className="text-[10px] font-extrabold uppercase text-theme-muted/70 tracking-widest">{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {blanks.map((_, idx) => <div key={`blank-${idx}`} className="w-8 h-8" />)}
            {days.map((day) => {
              const dayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isSelectable = dayStr >= "2026-05-19" && dayStr <= todayStr;
              const isSelected = dayStr === selectedDate;
              const isDayToday = dayStr === todayStr;
              return (
                <button
                  key={day}
                  onClick={() => { if (isSelectable) { onSelectDate(dayStr); setIsOpen(false); } }}
                  disabled={!isSelectable}
                  className={`w-8 h-8 rounded-full flex flex-col items-center justify-center text-xs font-bold transition-all relative cursor-pointer ${
                    isSelected
                      ? "bg-theme-accent text-theme-bg shadow-md scale-110"
                      : isSelectable
                      ? "text-theme-fg hover:bg-theme-selection-bg"
                      : "text-theme-muted/20 cursor-not-allowed"
                  }`}
                >
                  <span>{day}</span>
                  {isDayToday && !isSelected && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-theme-accent" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
