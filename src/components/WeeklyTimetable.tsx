'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { useApp } from '@/context/AppContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays, 
  ChevronDown, 
  ChevronUp, 
  Car, 
  Phone, 
  MessageSquare, 
  ShieldCheck, 
  CheckCircle2, 
  Star, 
  X, 
  Sparkles,
  Accessibility,
  Armchair
} from 'lucide-react';
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
  { key: 'mon', name: 'Monday', dateStr: '9 Nov 2026', isoDate: '2026-11-09', isHoliday: true, holidayReason: 'HARI DEEPAVALI' },
  { key: 'tue', name: 'Tuesday', dateStr: '10 Nov 2026', isoDate: '2026-11-10', isToday: true },
  { key: 'wed', name: 'Wednesday', dateStr: '11 Nov 2026', isoDate: '2026-11-11' },
  { key: 'thu', name: 'Thursday', dateStr: '12 Nov 2026', isoDate: '2026-11-12' },
  { key: 'fri', name: 'Friday', dateStr: '13 Nov 2026', isoDate: '2026-11-13' },
  { key: 'sat', name: 'Saturday', dateStr: '14 Nov 2026', isoDate: '2026-11-14' },
  { key: 'sun', name: 'Sunday', dateStr: '15 Nov 2026', isoDate: '2026-11-15' },
];

export const WeeklyTimetable: React.FC<WeeklyTimetableProps> = ({
  bookings,
  onSelectSlot,
}) => {
  const { t, language } = useLanguage();
  const { profiles } = useApp();
  const driverProfile = profiles.find(p => p.role === 'driver');
  const [selectedIsoDate, setSelectedIsoDate] = useState<string>('2026-11-10');
  const [selectedDayObj, setSelectedDayObj] = useState<DaySchedule>(DEFAULT_DAYS[1]);

  // Expandable calendar state
  const [isCalendarExpanded, setIsCalendarExpanded] = useState<boolean>(false);
  const [calendarMonth, setCalendarMonth] = useState<number>(10); // 0-indexed: 10 is November
  const [calendarYear, setCalendarYear] = useState<number>(2026);

  // USER SPEC: "at book a service tab , toyota Hiace (WVV 4108 ) , make it allow click to expand to see the image and details of the van and driver"
  const [isVanDetailsExpanded, setIsVanDetailsExpanded] = useState<boolean>(false);

  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthNamesZh = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ];
  const monthNamesMs = [
    'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
    'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
  ];

  const currentMonthNames = language === 'zh' ? monthNamesZh : language === 'ms' ? monthNamesMs : monthNamesEn;

  const weekdayHeaders = language === 'zh' 
    ? ['日', '一', '二', '三', '四', '五', '六'] 
    : language === 'ms' 
    ? ['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'] 
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const getLocalizedDayName = (dayKeyOrName: string) => {
    const lower = dayKeyOrName.toLowerCase();
    if (lower.includes('mon')) return t('timetable.mon', 'Mon');
    if (lower.includes('tue')) return t('timetable.tue', 'Tue');
    if (lower.includes('wed')) return t('timetable.wed', 'Wed');
    if (lower.includes('thu')) return t('timetable.thu', 'Thu');
    if (lower.includes('fri')) return t('timetable.fri', 'Fri');
    if (lower.includes('sat')) return t('timetable.sat', 'Sat');
    if (lower.includes('sun')) return t('timetable.sun', 'Sun');
    return dayKeyOrName;
  };

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
    setIsCalendarExpanded(false);
  };

  const getSlotStatus = (day: DaySchedule, slot: string) => {
    if (day.isHoliday) {
      return { status: 'close', label: day.holidayReason || t('timetable.legendClosed', 'Closed') };
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
        return { status: 'booked', label: t('timetable.legendBooked', 'Booked') };
      }
      if ((day.key === 'wed' || day.name === 'Wednesday') && (slot.startsWith('02:00') || slot.startsWith('02:30') || slot.startsWith('03:00') || slot.startsWith('03:30') || slot.startsWith('04:00'))) {
        return { status: 'booked', label: t('timetable.legendBooked', 'Booked') };
      }
      return { status: 'available', label: '' };
    }

    const hasPending = matchedBookings.some(b => b.status === 'pending');
    if (hasPending) {
      return { status: 'pending', label: t('timetable.legendPending', 'Pending') };
    }

    const approvedCount = matchedBookings.filter(b => b.status !== 'declined').length;
    if (approvedCount >= 7) {
      return { status: 'booked', label: t('timetable.legendBooked', 'Booked') };
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
            1. {t('timetable.selectDate', 'Choose Date of Service')}
          </h3>

          <button
            type="button"
            onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F37021] text-white font-black text-xs shadow-xs hover:bg-[#D9530F] transition-all tap-target self-start sm:self-auto"
          >
            <CalendarDays className="h-4 w-4 text-orange-200" />
            <span>
              {t('timetable.selectDate', 'Select Date')}: {getLocalizedDayName(selectedDayObj.name)}, {selectedDayObj.dateStr}
            </span>
            {isCalendarExpanded ? (
              <ChevronUp className="h-4 w-4 ml-1" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-1" />
            )}
          </button>
        </div>

        {/* EXPANDED INTERACTIVE CALENDAR FOR ANY UPCOMING DATE */}
        {isCalendarExpanded && (
          <div className="rounded-2xl border-2 border-[#F37021] bg-white p-4 shadow-xl space-y-3 animate-in fade-in-50 duration-200">
            {/* Calendar Month Navigation Header */}
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <span className="font-extrabold text-sm text-neutral-950">
                {currentMonthNames[calendarMonth]} {calendarYear}
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
              {weekdayHeaders.map((w, idx) => (
                <span key={idx}>{w}</span>
              ))}
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
                const isUpcoming = dayIso >= '2026-11-09';

                return (
                  <button
                    key={dayIso}
                    type="button"
                    disabled={!isUpcoming}
                    onClick={() => handleSelectCalendarDate(calendarYear, calendarMonth, dayNum)}
                    className={`h-9 rounded-xl font-bold text-xs flex flex-col items-center justify-center transition-all tap-target ${
                      isSelected
                        ? 'bg-[#F37021] text-white font-black shadow-md scale-105'
                        : isToday
                        ? 'bg-orange-100 text-orange-950 border border-orange-300 font-extrabold hover:bg-orange-200'
                        : isHoliday
                        ? 'bg-red-50 text-red-900 border border-red-300'
                        : isUpcoming
                        ? 'hover:bg-orange-50 text-neutral-800 hover:border-orange-400 border border-transparent'
                        : 'text-neutral-300 cursor-not-allowed'
                    }`}
                  >
                    <span>{dayNum}</span>
                    {isToday && <span className="h-1 w-1 rounded-full bg-[#F37021] -mt-0.5" />}
                  </button>
                );
              })}
            </div>

            <p className="text-[10px] text-[#F37021] text-center font-bold pt-1">
              {t('timetable.clickUpcomingDate', 'Click any upcoming date to expand its accessible transit timetable')}
            </p>
          </div>
        )}
      </div>

      {/* 2. EXPANDED TIMETABLE FOR THAT PARTICULAR DATE ONLY */}
      <div className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-neutral-900 tracking-tight">
              2. {t('timetable.availableTimeslotsFor', 'Available Timeslots for')} {getLocalizedDayName(selectedDayObj.name)}, {selectedDayObj.dateStr}
            </h3>
            {selectedDayObj.isToday && (
              <span className="text-[10px] font-black bg-orange-100 text-orange-950 px-2 py-0.5 rounded-full border border-orange-300">
                {t('common.today', 'Today')}
              </span>
            )}
          </div>

          {/* USER SPEC: Clickable to expand van and driver image & details */}
          <button
            type="button"
            onClick={() => setIsVanDetailsExpanded(!isVanDetailsExpanded)}
            className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all tap-target self-start sm:self-auto shadow-2xs hover:shadow-xs active:scale-95 ${
              isVanDetailsExpanded
                ? 'border-[#F37021] bg-[#18181B] text-white shadow-sm'
                : 'border-orange-200 bg-orange-50/80 hover:bg-orange-100 text-orange-950'
            }`}
            title={t('vanInfo.clickToView', 'Click to view vehicle & driver details')}
          >
            <Car className={`h-4 w-4 ${isVanDetailsExpanded ? 'text-[#F37021]' : 'text-[#F37021]'}`} />
            <span className="font-extrabold">Toyota HiAce (WVV 4108)</span>
            {isVanDetailsExpanded ? (
              <ChevronUp className="h-4 w-4 text-orange-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-neutral-500 group-hover:text-[#F37021]" />
            )}
          </button>
        </div>

        {/* EXPANDED VAN & DRIVER IMAGE AND SPECIFICATION PANEL */}
        {isVanDetailsExpanded && (
          <div className="rounded-3xl border-2 border-orange-400 bg-gradient-to-br from-white via-orange-50/30 to-amber-50/40 p-5 sm:p-6 shadow-xl space-y-5 animate-in fade-in-50 duration-200">
            {/* Header with Title, Badge, and Close Button */}
            <div className="flex items-center justify-between pb-3 border-b border-orange-200/80">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-[#F37021] text-white flex items-center justify-center shadow-xs">
                  <Car className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-neutral-900 tracking-tight">
                    {t('vanInfo.title', 'Vehicle & Driver Specifications')}
                  </h4>
                  <p className="text-[11px] text-neutral-500 font-medium">
                    {t('vanInfo.cleanliness', 'Daily hospital-grade UV & cabin surface sanitization')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-900 border border-orange-300 px-2.5 py-1 rounded-full">
                  <ShieldCheck className="h-3 w-3 text-[#F37021]" />
                  {t('vanInfo.badge', 'Official NGO Fleet')}
                </span>
                <button
                  type="button"
                  onClick={() => setIsVanDetailsExpanded(false)}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200/60 transition-colors tap-target"
                  aria-label="Close vehicle details"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* 2-Column Responsive Card: Van Details (Left) & Driver Details (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* 1. VAN CARD (7 Cols) */}
              <div className="lg:col-span-7 rounded-2xl border border-neutral-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-4 flex flex-col justify-between">
                <div>
                  {/* Van Photo */}
                  <div className="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 shadow-inner group">
                    <Image
                      src="/images/toyota-hiace-van.jpg"
                      alt="Toyota HiAce High-Roof Commuter Accessible Van"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      priority
                    />
                    <div className="absolute top-3 left-3 bg-neutral-950/80 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border border-white/20 flex items-center gap-1.5 shadow-sm">
                      <Accessibility className="h-3.5 w-3.5 text-[#F37021]" />
                      <span>Hydraulic Lift Equipped</span>
                    </div>

                    <div className="absolute bottom-3 right-3 font-mono text-xs font-black bg-neutral-900 text-white px-3 py-1 rounded-lg border-2 border-amber-400 shadow-md">
                      WVV 4108
                    </div>
                  </div>

                  {/* Van Details Header */}
                  <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#F37021] block">
                        Toyota Mobility Service
                      </span>
                      <h5 className="text-base sm:text-lg font-black text-neutral-900 mt-0.5">
                        {t('vanInfo.model', 'Toyota HiAce High-Roof Commuter')}
                      </h5>
                    </div>
                    <span className="text-[11px] font-bold text-neutral-600 bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 rounded-full">
                      Pearl White
                    </span>
                  </div>

                  {/* Seating Specs Pill Grid */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-2.5 flex items-center gap-2">
                      <Accessibility className="h-4 w-4 text-[#F37021] shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-orange-900 block">Wheelchair Bays</span>
                        <p className="font-mono font-black text-neutral-900 text-xs">2 Dedicated Spaces</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 flex items-center gap-2">
                      <Armchair className="h-4 w-4 text-neutral-600 shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-neutral-500 block">Cabin Seating</span>
                        <p className="font-mono font-black text-neutral-900 text-xs">5 Regular Seats</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Built-in Accessibility Equipment List */}
                <div className="pt-3 border-t border-neutral-100 space-y-1.5 text-xs">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">
                    {t('vanInfo.equipment', 'Accessibility & Safety Equipment')}
                  </span>
                  <div className="flex items-start gap-2 text-neutral-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="font-medium text-[11px]">{t('vanInfo.spec1', 'Heavy-Duty Rear Hydraulic Wheelchair Lift (350kg capacity)')}</span>
                  </div>
                  <div className="flex items-start gap-2 text-neutral-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="font-medium text-[11px]">{t('vanInfo.spec2', '4-Point Q’Straint Wheelchair Floor Anchor Clamps')}</span>
                  </div>
                  <div className="flex items-start gap-2 text-neutral-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="font-medium text-[11px]">{t('vanInfo.spec3', 'High-Roof Clearance with Ergonomic Interior Grab Rails')}</span>
                  </div>
                </div>
              </div>

              {/* 2. DRIVER CARD (5 Cols) */}
              <div className="lg:col-span-5 rounded-2xl border border-neutral-200/90 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  {/* Driver Portrait & Bio Header */}
                  <div className="flex items-center gap-3.5">
                    <div className="relative h-18 w-18 sm:h-20 sm:w-20 rounded-2xl overflow-hidden border-2 border-orange-400 shadow-md shrink-0">
                      <Image
                        src={driverProfile?.avatar_url || '/images/driver-johan.jpg'}
                        alt={driverProfile?.full_name || 'Driver'}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute bottom-1 right-1 bg-emerald-600 text-white rounded-full p-0.5 shadow-xs">
                        <CheckCircle2 className="h-3 w-3 stroke-[3]" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-block mb-1">
                        Verified Operator
                      </span>
                      <h5 className="text-base font-black text-neutral-900 leading-tight truncate">
                        {driverProfile?.full_name || t('nav.driverRole', 'Driver')}
                      </h5>
                      <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                        {t('vanInfo.driverTitle', 'Dedicated NGO Assisted Transit Driver')}
                      </p>
                      
                      {/* Rating Stars */}
                      <div className="flex items-center gap-1 text-amber-500 mt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className="h-3 w-3 fill-amber-400 text-amber-500" />
                        ))}
                        <span className="text-[11px] font-black text-neutral-800 ml-1">5.0</span>
                      </div>
                    </div>
                  </div>

                  {/* Experience & Certification Badges */}
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="rounded-xl bg-orange-50/70 border border-orange-200 p-2.5">
                      <span className="text-[10px] font-bold text-orange-950 uppercase tracking-wider block">
                        Experience
                      </span>
                      <p className="text-xs font-black text-orange-900 mt-0.5">
                        {t('vanInfo.experience', '8 Years Certified Accessible Transit Experience')}
                      </p>
                    </div>

                    <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-2.5 space-y-1">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                        Safety Accreditations
                      </span>
                      <p className="text-[11px] font-semibold text-neutral-800 flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>Defensive Driving & Emergency Evasion</span>
                      </p>
                      <p className="text-[11px] font-semibold text-neutral-800 flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>Wheelchair Tie-Down (WTORS) Specialist</span>
                      </p>
                      <p className="text-[11px] font-semibold text-neutral-800 flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>St. John Certified First Aid & CPR</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Direct Driver Contact Action Buttons */}
                <div className="pt-3 border-t border-neutral-100 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block text-center">
                    {t('vanInfo.contact', 'Contact Driver')} (Johan)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href="tel:+60193827104"
                      className="h-10 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-900 font-extrabold text-xs flex items-center justify-center gap-1.5 tap-target shadow-xs transition-all active:scale-95"
                    >
                      <Phone className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{t('vanInfo.call', 'Call')}</span>
                    </a>

                    <a
                      href="https://wa.me/60193827104"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-900 font-extrabold text-xs flex items-center justify-center gap-1.5 tap-target shadow-xs transition-all active:scale-95"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{t('vanInfo.whatsapp', 'WhatsApp')}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedDayObj.isHoliday ? (
          <div className="rounded-3xl bg-[#8B1E24] text-white p-8 text-center space-y-2 shadow-inner">
            <h4 className="text-lg font-black tracking-wide">{selectedDayObj.holidayReason}</h4>
            <p className="text-xs text-red-200 font-medium">
              {t('timetable.closedOnHoliday', 'Van transit service is closed on this public holiday. Please choose another date above.')}
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
                      ? 'bg-white border-neutral-200 hover:border-[#F37021] hover:shadow-md cursor-pointer'
                      : status === 'booked'
                      ? 'bg-[#00c0f0] border-[#00c0f0] text-neutral-950 font-bold cursor-not-allowed opacity-90'
                      : status === 'pending'
                      ? 'bg-yellow-400 border-yellow-400 text-yellow-950 font-bold'
                      : 'bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed'
                  }`}
                >
                  <span className={`font-mono text-xs font-black ${isAvailable ? 'text-neutral-900' : 'text-inherit'}`}>
                    {slot}
                  </span>

                  {status === 'booked' && (
                    <span className="text-[10px] uppercase font-black bg-neutral-900 text-white px-2 py-0.5 rounded">
                      {t('timetable.legendBooked', 'Booked')}
                    </span>
                  )}

                  {status === 'pending' && (
                    <span className="text-[10px] uppercase font-black bg-yellow-900 text-white px-2 py-0.5 rounded">
                      {t('timetable.legendPending', 'Pending')}
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
            <span>{t('timetable.legendAvailable', 'Available')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3.5 w-3.5 rounded-md bg-[#00c0f0]" />
            <span>{t('timetable.legendBooked', 'Booked')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3.5 w-3.5 rounded-md bg-yellow-400" />
            <span>{t('timetable.legendPending', 'Pending')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
