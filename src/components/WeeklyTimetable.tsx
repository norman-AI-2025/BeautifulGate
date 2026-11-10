'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, CalendarDays, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { TransitBooking } from '@/types';

interface WeeklyTimetableProps {
  bookings: TransitBooking[];
  onSelectSlot: (dayName: string, timeSlot: string) => void;
}

export const TIME_SLOTS_TABLE = [
  '08:00 am - 08:30 am',
  '08:30 am - 09:00 am',
  '09:00 am - 09:30 am',
  '09:30 am - 10:00 am',
  '10:00 am - 10:30 am',
  '10:30 am - 11:00 am',
  '11:00 am - 11:30 am',
  '11:30 am - 12:00 pm',
  '12:00 pm - 12:30 pm',
  '12:30 pm - 01:00 pm',
  '01:00 pm - 01:30 pm',
  '01:30 pm - 02:00 pm',
  '02:00 pm - 02:30 pm',
  '02:30 pm - 03:00 pm',
  '03:00 pm - 03:30 pm',
  '03:30 pm - 04:00 pm',
  '04:00 pm - 04:30 pm',
];

interface DaySchedule {
  key: string;
  name: string;
  dateStr: string;
  isoDate: string;
  isHoliday?: boolean;
  holidayReason?: string;
  isToday?: boolean;
}

const DEFAULT_DAYS: DaySchedule[] = [
  { key: 'mon', name: 'Monday', dateStr: '9 Nov, 2026', isoDate: '2026-11-09', isHoliday: true, holidayReason: 'HARI DEEPAVALI' },
  { key: 'tue', name: 'Tuesday', dateStr: '10 Nov, 2026', isoDate: '2026-11-10', isToday: true },
  { key: 'wed', name: 'Wednesday', dateStr: '11 Nov, 2026', isoDate: '2026-11-11' },
  { key: 'thu', name: 'Thursday', dateStr: '12 Nov, 2026', isoDate: '2026-11-12' },
  { key: 'fri', name: 'Friday', dateStr: '13 Nov, 2026', isoDate: '2026-11-13' },
  { key: 'sat', name: 'Saturday', dateStr: '14 Nov, 2026', isoDate: '2026-11-14' },
  { key: 'sun', name: 'Sunday', dateStr: '15 Nov, 2026', isoDate: '2026-11-15' },
];

export const WeeklyTimetable: React.FC<WeeklyTimetableProps> = ({
  bookings,
  onSelectSlot,
}) => {
  const [selectedIsoDate, setSelectedIsoDate] = useState<string>('2026-11-10');
  const [selectedDayObj, setSelectedDayObj] = useState<DaySchedule>(DEFAULT_DAYS[1]);

  // USER SPEC: "the select date button should click and expand the calendar , to select any upcoming date"
  const [isCalendarExpanded, setIsCalendarExpanded] = useState<boolean>(false);
  const [calendarMonth, setCalendarMonth] = useState<number>(10); // 0-indexed: 10 is November
  const [calendarYear, setCalendarYear] = useState<number>(2026);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleSelectCalendarDate = (year: number, month: number, day: number) => {
    const isoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const d = new Date(year, month, day);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = dayNames[d.getDay()];
    const dateFormatted = `${day} ${shortMonths[month]}, ${year}`;
    const isHoliday = isoDate === '2026-11-09';

    const customDay: DaySchedule = {
      key: `cal-${isoDate}`,
      name: dayName,
      dateStr: dateFormatted,
      isoDate,
      isHoliday,
      holidayReason: isHoliday ? 'HARI DEEPAVALI' : undefined,
      isToday: isoDate === '2026-11-10',
    };

    setSelectedDayObj(customDay);
    setSelectedIsoDate(isoDate);
    setIsCalendarExpanded(false); // Close calendar after selection
  };

  const getSlotStatus = (day: DaySchedule, slot: string) => {
    if (day.isHoliday) {
      return { status: 'close', label: day.holidayReason || 'Closed' };
    }

    const slotStart = slot.split(' - ')[0].trim().toLowerCase();
    
    const matchedBookings = bookings.filter(b => {
      const bTime = b.appointment_time.trim().toLowerCase();
      const bDate = b.date?.toLowerCase() || '';
      const dayMatches = bDate.includes(day.name.toLowerCase()) || (day.isToday && !b.date);
      return dayMatches && (bTime.startsWith(slotStart) || slot.toLowerCase().includes(bTime));
    });

    if (matchedBookings.length === 0) {
      if (day.key === 'thu' || day.name === 'Thursday') {
        return { status: 'booked', label: 'Booked' };
      }
      if ((day.key === 'wed' || day.name === 'Wednesday') && (slot.startsWith('02:00') || slot.startsWith('02:30') || slot.startsWith('03:00') || slot.startsWith('03:30') || slot.startsWith('04:00'))) {
        return { status: 'booked', label: 'Booked' };
      }
      // Available slot: leave it completely blank!
      return { status: 'available', label: '' };
    }

    const hasPending = matchedBookings.some(b => b.status === 'pending');
    if (hasPending) {
      return { status: 'pending', label: 'Pending' };
    }

    const approvedCount = matchedBookings.filter(b => b.status !== 'declined').length;
    if (approvedCount >= 7) {
      return { status: 'booked', label: 'Booked' };
    }

    return { status: 'available', label: '' };
  };

  const handleCellClick = (day: DaySchedule, slot: string, slotStatus: string) => {
    if (slotStatus === 'close' || slotStatus === 'booked') {
      return;
    }
    const cleanTime = slot.split(' - ')[0].toUpperCase();
    onSelectSlot(`${day.name}, ${day.dateStr}`, cleanTime);
  };

  // Generate days for the expanded calendar month
  const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(y => y - 1);
    } else {
      setCalendarMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(y => y + 1);
    } else {
      setCalendarMonth(m => m + 1);
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
      {/* 1. CHOOSE DATE OF SERVICE (WITH EXPANDABLE CALENDAR BUTTON) */}
      <div className="p-5 border-b border-neutral-200 bg-neutral-50/70 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-extrabold text-neutral-900 tracking-tight">
            1. Choose Date of Service
          </h3>

          {/* USER SPEC: Click and expand the calendar to select any upcoming date */}
          <button
            type="button"
            onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-800 text-white font-extrabold text-xs shadow-xs hover:bg-teal-900 transition-all tap-target self-start sm:self-auto"
          >
            <CalendarDays className="h-4 w-4 text-cyan-300" />
            <span>Select Date: {selectedDayObj.name}, {selectedDayObj.dateStr}</span>
            {isCalendarExpanded ? (
              <ChevronUp className="h-4 w-4 ml-1" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-1" />
            )}
          </button>
        </div>

        {/* EXPANDED INTERACTIVE CALENDAR FOR ANY UPCOMING DATE */}
        {isCalendarExpanded && (
          <div className="rounded-2xl border-2 border-teal-800 bg-white p-4 shadow-xl space-y-3 animate-in fade-in-50 duration-200">
            {/* Calendar Month Navigation Header */}
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <span className="font-extrabold text-sm text-teal-950">
                {monthNames[calendarMonth]} {calendarYear}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-700 tap-target"
                  title="Previous Month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-700 tap-target"
                  title="Next Month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-neutral-400">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>

            {/* Month Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((dayNum, idx) => {
                if (dayNum === null) {
                  return <div key={`empty-${idx}`} className="h-9" />;
                }

                const dayIso = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isSelected = selectedIsoDate === dayIso;
                const isToday = dayIso === '2026-11-10';
                const isHoliday = dayIso === '2026-11-09';
                
                // Check if date is upcoming or today
                const isUpcoming = dayIso >= '2026-11-09';

                return (
                  <button
                    key={dayIso}
                    type="button"
                    disabled={!isUpcoming}
                    onClick={() => handleSelectCalendarDate(calendarYear, calendarMonth, dayNum)}
                    className={`h-9 rounded-xl font-bold text-xs flex flex-col items-center justify-center transition-all tap-target ${
                      isSelected
                        ? 'bg-teal-800 text-white font-black shadow-md scale-105'
                        : isToday
                        ? 'bg-cyan-100 text-cyan-950 border border-cyan-400 font-extrabold hover:bg-cyan-200'
                        : isHoliday
                        ? 'bg-red-50 text-red-900 border border-red-300'
                        : isUpcoming
                        ? 'hover:bg-teal-50 text-neutral-800 hover:border-teal-400 border border-transparent'
                        : 'text-neutral-300 cursor-not-allowed'
                    }`}
                  >
                    <span>{dayNum}</span>
                    {isToday && <span className="h-1 w-1 rounded-full bg-cyan-700 -mt-0.5" />}
                  </button>
                );
              })}
            </div>

            <p className="text-[10px] text-teal-800 text-center font-medium pt-1">
              Click any upcoming date to expand its accessible transit timetable
            </p>
          </div>
        )}
      </div>

      {/* 2. EXPANDED TIMETABLE FOR THAT PARTICULAR DATE ONLY */}
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-neutral-900 tracking-tight">
              2. Available Timeslots for {selectedDayObj.name}, {selectedDayObj.dateStr}
            </h3>
            {selectedDayObj.isToday && (
              <span className="text-[10px] font-bold bg-cyan-100 text-cyan-900 px-2 py-0.5 rounded-full border border-cyan-300">
                Today
              </span>
            )}
          </div>
          <span className="text-xs font-mono font-bold text-neutral-500">
            Toyota HiAce (WVV 4108)
          </span>
        </div>

        {selectedDayObj.isHoliday ? (
          <div className="rounded-3xl bg-[#8B1E24] text-white p-8 text-center space-y-2 shadow-inner">
            <h4 className="text-lg font-black tracking-wide">{selectedDayObj.holidayReason}</h4>
            <p className="text-xs text-red-200 font-medium">
              Van transit service is closed on this public holiday. Please choose another date above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {TIME_SLOTS_TABLE.map((slot) => {
              const { status } = getSlotStatus(selectedDayObj, slot);
              const isAvailable = status === 'available';

              return (
                <button
                  key={slot}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => handleCellClick(selectedDayObj, slot, status)}
                  className={`h-16 px-4 rounded-2xl border-2 transition-all flex items-center justify-between tap-target ${
                    isAvailable
                      ? 'bg-white border-neutral-200 hover:border-teal-700 hover:shadow-md cursor-pointer'
                      : status === 'booked'
                      ? 'bg-[#00c0f0] border-[#00c0f0] text-teal-950 font-bold cursor-not-allowed opacity-90'
                      : status === 'pending'
                      ? 'bg-yellow-400 border-yellow-400 text-yellow-950 font-bold'
                      : 'bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed'
                  }`}
                >
                  <span className={`font-mono text-xs font-black ${isAvailable ? 'text-neutral-900' : 'text-inherit'}`}>
                    {slot}
                  </span>

                  {/* USER SPEC: FOR AVAILABLE JUST LEAVE IT BLANK, DONT PUT NOTES! */}
                  {status === 'booked' && (
                    <span className="text-[10px] uppercase font-black bg-teal-950 text-white px-2 py-0.5 rounded">
                      Booked
                    </span>
                  )}

                  {status === 'pending' && (
                    <span className="text-[10px] uppercase font-black bg-yellow-900 text-white px-2 py-0.5 rounded">
                      Pending
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-6 pt-3 border-t border-neutral-100 text-xs font-bold text-neutral-600">
          <div className="flex items-center gap-2">
            <span className="inline-block h-3.5 w-3.5 rounded-md border-2 border-neutral-300 bg-white" />
            <span>Available (Blank)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3.5 w-3.5 rounded-md bg-[#00c0f0]" />
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3.5 w-3.5 rounded-md bg-yellow-400" />
            <span>Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
};
