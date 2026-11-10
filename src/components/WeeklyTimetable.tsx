'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, CalendarDays } from 'lucide-react';
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
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [selectedIsoDate, setSelectedIsoDate] = useState<string>('2026-11-10');
  const [selectedDayObj, setSelectedDayObj] = useState<DaySchedule>(DEFAULT_DAYS[1]);

  const handleSelectDay = (day: DaySchedule) => {
    setSelectedDayObj(day);
    setSelectedIsoDate(day.isoDate);
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    if (!newDate) return;
    setSelectedIsoDate(newDate);

    // Format new date
    const d = new Date(`${newDate}T12:00:00Z`);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayName = dayNames[d.getUTCDay()];
    const dateFormatted = `${d.getUTCDate()} ${monthNames[d.getUTCMonth()]}, ${d.getUTCFullYear()}`;

    const customDay: DaySchedule = {
      key: `custom-${newDate}`,
      name: dayName,
      dateStr: dateFormatted,
      isoDate: newDate,
      isToday: newDate === '2026-11-10',
    };

    setSelectedDayObj(customDay);
  };

  const getSlotStatus = (day: DaySchedule, slot: string) => {
    if (day.isHoliday) {
      return { status: 'close', label: day.holidayReason || 'Closed' };
    }

    const slotStart = slot.split(' - ')[0].trim().toLowerCase();
    
    const matchedBookings = bookings.filter(b => {
      const bTime = b.appointment_time.trim().toLowerCase();
      const bDate = b.date?.toLowerCase() || '';
      const dayMatches = bDate.includes(day.name.toLowerCase()) || day.isToday;
      return dayMatches && (bTime.startsWith(slotStart) || slot.toLowerCase().includes(bTime));
    });

    if (matchedBookings.length === 0) {
      if (day.key === 'thu') {
        return { status: 'booked', label: 'Booked' };
      }
      if (day.key === 'wed' && (slot.startsWith('02:00') || slot.startsWith('02:30') || slot.startsWith('03:00') || slot.startsWith('03:30') || slot.startsWith('04:00'))) {
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

  return (
    <div className="w-full bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
      {/* 1. CHOOSE DATE OF SERVICE (WITH SELECT DATE BUTTON) */}
      <div className="p-5 border-b border-neutral-200 bg-neutral-50/70 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-extrabold text-neutral-900 tracking-tight">
            1. Choose Date of Service
          </h3>

          <div className="flex items-center gap-2">
            {/* USER SPEC: SELECT DATE BUTTON TO CHOOSE EXACT DATE */}
            <div className="relative inline-flex items-center">
              <label
                htmlFor="exact-date-picker"
                className="cursor-pointer flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-teal-800 text-white font-extrabold text-xs shadow-xs hover:bg-teal-900 transition-all tap-target"
              >
                <CalendarDays className="h-4 w-4" />
                <span>Select Date: {selectedDayObj.dateStr}</span>
              </label>
              <input
                id="exact-date-picker"
                type="date"
                value={selectedIsoDate}
                onChange={handleDateInputChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>

            {/* Week Offset Navigation */}
            <div className="flex items-center gap-1 text-xs font-bold text-teal-800">
              <button
                type="button"
                onClick={() => setWeekOffset(w => w - 1)}
                className="p-1 rounded-lg hover:bg-neutral-200 tap-target"
                title="Previous Week"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setWeekOffset(w => w + 1)}
                className="p-1 rounded-lg hover:bg-neutral-200 tap-target"
                title="Next Week"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Date Selector Cards */}
        <div className="grid grid-cols-7 gap-2">
          {DEFAULT_DAYS.map((day) => {
            const isSelected = selectedIsoDate === day.isoDate;

            return (
              <button
                key={day.key}
                type="button"
                onClick={() => handleSelectDay(day)}
                className={`py-3 px-1 rounded-2xl text-center transition-all tap-target flex flex-col items-center justify-center border-2 ${
                  isSelected
                    ? 'bg-teal-800 text-white border-teal-800 shadow-md scale-[1.03]'
                    : day.isHoliday
                    ? 'bg-red-50 text-red-900 border-red-200 hover:border-red-400'
                    : day.isToday
                    ? 'bg-cyan-50 text-cyan-900 border-cyan-400 hover:bg-cyan-100'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                }`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-teal-200' : 'text-neutral-400'}`}>
                  {day.name.slice(0, 3)}
                </span>
                <span className="text-base font-black tracking-tight mt-0.5">
                  {day.dateStr.split(' ')[0]}
                </span>
                {day.isHoliday && (
                  <span className={`text-[8px] font-bold uppercase mt-0.5 ${isSelected ? 'text-red-200' : 'text-red-600'}`}>
                    Holiday
                  </span>
                )}
              </button>
            );
          })}
        </div>
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
