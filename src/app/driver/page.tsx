'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Phone, 
  MessageSquare, 
  MapPin, 
  Building2,
  Car,
  ChevronRight,
  ChevronDown,
  Navigation,
  CheckCircle2,
  CheckCheck,
  Armchair,
  Accessibility,
  Clock,
  RotateCcw,
  HeartHandshake,
  Banknote,
  Calendar,
  CalendarDays,
  AlertCircle,
  Users,
  Check
} from 'lucide-react';
import { TransitBooking, TransitStatus } from '@/types';

// Helper to normalize and sort time slots chronologically
const parseTimeToMinutes = (timeStr: string): number => {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (!match) return 9999;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toLowerCase();
  if (period === 'pm' && hours < 12) hours += 12;
  if (period === 'am' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const normalizeSlotTime = (rawTime: string): string => {
  if (!rawTime) return '08:00 AM';
  const clean = rawTime.trim().split('-')[0].trim();
  // Ensure formatted with uppercase AM/PM
  return clean.replace(/\b(am|pm)\b/i, (m) => m.toUpperCase());
};

interface TimeSlotGroup {
  slotKey: string;
  displayTime: string;
  minutes: number;
  bookings: TransitBooking[];
  isCompleted: boolean;
  isActive: boolean;
  isReady: boolean;
}

interface WeekDayItem {
  key: string;
  dayNameEn: string;
  dayNameZh: string;
  dayNameMs: string;
  dateNum: string;
  isToday: boolean;
}

const WEEK_DAYS: WeekDayItem[] = [
  { key: 'Monday, 9 Nov 2026', dayNameEn: 'Mon', dayNameZh: '周一', dayNameMs: 'Isn', dateNum: '9 Nov', isToday: false },
  { key: 'Tuesday, 10 Nov 2026', dayNameEn: 'Tue', dayNameZh: '周二', dayNameMs: 'Sel', dateNum: '10 Nov', isToday: true },
  { key: 'Wednesday, 11 Nov 2026', dayNameEn: 'Wed', dayNameZh: '周三', dayNameMs: 'Rab', dateNum: '11 Nov', isToday: false },
  { key: 'Thursday, 12 Nov 2026', dayNameEn: 'Thu', dayNameZh: '周四', dayNameMs: 'Kha', dateNum: '12 Nov', isToday: false },
  { key: 'Friday, 13 Nov 2026', dayNameEn: 'Fri', dayNameZh: '周五', dayNameMs: 'Jum', dateNum: '13 Nov', isToday: false },
  { key: 'Saturday, 14 Nov 2026', dayNameEn: 'Sat', dayNameZh: '周六', dayNameMs: 'Sab', dateNum: '14 Nov', isToday: false },
  { key: 'Sunday, 15 Nov 2026', dayNameEn: 'Sun', dayNameZh: '周日', dayNameMs: 'Ahd', dateNum: '15 Nov', isToday: false },
];

const getDayLabel = (d: WeekDayItem, lang: string): string => {
  if (lang === 'zh') return d.dayNameZh;
  if (lang === 'ms') return d.dayNameMs;
  return d.dayNameEn;
};

const formatDisplayDate = (dateStr: string, lang: string): string => {
  if (!dateStr) return '';
  if (lang === 'zh') {
    if (dateStr.includes('9 Nov')) return '11月9日 (周一)';
    if (dateStr.includes('10 Nov')) return '11月10日 (周二 · 今日)';
    if (dateStr.includes('11 Nov')) return '11月11日 (周三)';
    if (dateStr.includes('12 Nov')) return '11月12日 (周四)';
    if (dateStr.includes('13 Nov')) return '11月13日 (周五)';
    if (dateStr.includes('14 Nov')) return '11月14日 (周六)';
    if (dateStr.includes('15 Nov')) return '11月15日 (周日)';
  }
  if (lang === 'ms') {
    if (dateStr.includes('9 Nov')) return 'Isn, 9 Nov 2026';
    if (dateStr.includes('10 Nov')) return 'Sel, 10 Nov 2026 (Hari Ini)';
    if (dateStr.includes('11 Nov')) return 'Rab, 11 Nov 2026';
    if (dateStr.includes('12 Nov')) return 'Kha, 12 Nov 2026';
    if (dateStr.includes('13 Nov')) return 'Jum, 13 Nov 2026';
    if (dateStr.includes('14 Nov')) return 'Sab, 14 Nov 2026';
    if (dateStr.includes('15 Nov')) return 'Ahd, 15 Nov 2026';
  }
  if (dateStr.includes('10 Nov')) return 'Tuesday, 10 Nov 2026 (Today)';
  return dateStr;
};

export default function DriverPage() {
  const { bookings, updateBookingStatus } = useApp();
  const { t, language } = useLanguage();

  // Selected date in weekly calendar view (defaults to today)
  const [selectedDayKey, setSelectedDayKey] = useState<string>('Tuesday, 10 Nov 2026');

  // USER SPEC: "for the driver , it will only receive the task list after the bookings are approved by supervisor"
  const allJohanApprovedBookings = useMemo(() => {
    return bookings.filter(b => 
      b.status !== 'pending' && 
      b.status !== 'declined' && 
      (b.assigned_driver === 'Johan bin Ariffin' || !b.assigned_driver)
    );
  }, [bookings]);

  // Counts of approved bookings per day in the upcoming week
  const dayRunsCountMap = useMemo(() => {
    const map = new Map<string, number>();
    WEEK_DAYS.forEach((d) => {
      const count = allJohanApprovedBookings.filter(b => (b.date || 'Tuesday, 10 Nov 2026') === d.key).length;
      map.set(d.key, count);
    });
    return map;
  }, [allJohanApprovedBookings]);

  // Filter approved bookings for the selected day in the calendar
  const johanBookings = useMemo(() => {
    return allJohanApprovedBookings.filter(b => (b.date || 'Tuesday, 10 Nov 2026') === selectedDayKey);
  }, [allJohanApprovedBookings, selectedDayKey]);

  // Group bookings by TIME SLOT (max 6 passengers per slot)
  const allTimeSlotGroups: TimeSlotGroup[] = useMemo(() => {
    const slotMap = new Map<string, TransitBooking[]>();

    johanBookings.forEach((b) => {
      const slotTime = normalizeSlotTime(b.appointment_time);
      if (!slotMap.has(slotTime)) {
        slotMap.set(slotTime, []);
      }
      slotMap.get(slotTime)!.push(b);
    });

    const groups: TimeSlotGroup[] = [];

    slotMap.forEach((paxBookings, slotTime) => {
      // Sort bookings within the slot
      const sortedBookings = [...paxBookings].sort((a, b) => a.assigned_space.localeCompare(b.assigned_space));

      // Completed if every booking in this slot is dropped off
      const isCompleted = sortedBookings.length > 0 && sortedBookings.every(b => 
        b.status === 'dropped_off' || b.status === 'en_route_next'
      );

      // Active if any booking is currently on route or picked up
      const isActive = sortedBookings.some(b => 
        ['en_route_pickup', 'picked_up', 'en_route_hospital'].includes(b.status)
      );

      groups.push({
        slotKey: slotTime,
        displayTime: slotTime,
        minutes: parseTimeToMinutes(slotTime),
        bookings: sortedBookings,
        isCompleted,
        isActive,
        isReady: false, // Calculated after sorting
      });
    });

    // Sort chronologically by time of day
    groups.sort((a, b) => a.minutes - b.minutes);

    // Mark ready: if active, or if it is the first non-completed upcoming slot
    let foundFirstUpcoming = false;
    groups.forEach((g) => {
      if (!g.isCompleted) {
        if (g.isActive) {
          g.isReady = true;
        } else if (!foundFirstUpcoming) {
          g.isReady = true;
          foundFirstUpcoming = true;
        }
      }
    });

    return groups;
  }, [johanBookings]);

  // USER SPEC: Queue list ONLY shows current and upcoming expand menu (filter out completed slots)
  const queueTimeSlots = useMemo(() => {
    return allTimeSlotGroups.filter(g => !g.isCompleted);
  }, [allTimeSlotGroups]);

  // Active expanded time slot
  const [expandedSlotKey, setExpandedSlotKey] = useState<string | null>(null);

  // Initialize expanded slot to the active mission or the first upcoming slot
  useEffect(() => {
    if (expandedSlotKey === null && queueTimeSlots.length > 0) {
      const activeGroup = queueTimeSlots.find(g => g.isActive) || queueTimeSlots[0];
      setExpandedSlotKey(activeGroup.slotKey);
    }
  }, [queueTimeSlots, expandedSlotKey]);

  // USER SPEC: "after finishing a time slot , it will switch and expand another timeslot"
  useEffect(() => {
    if (!expandedSlotKey) {
      if (queueTimeSlots.length > 0) {
        setExpandedSlotKey(queueTimeSlots[0].slotKey);
      }
      return;
    }

    const currentSlotInQueue = queueTimeSlots.find(g => g.slotKey === expandedSlotKey);
    // If the currently expanded slot is no longer in the queue (it just finished!),
    // immediately switch and expand the next upcoming timeslot
    if (!currentSlotInQueue) {
      if (queueTimeSlots.length > 0) {
        setExpandedSlotKey(queueTimeSlots[0].slotKey);
      } else {
        setExpandedSlotKey(null);
      }
    }
  }, [queueTimeSlots, expandedSlotKey]);

  // Helper for single passenger status transition
  const getPassengerStatusAction = (status: TransitStatus) => {
    switch (status) {
      case 'pending':
      case 'approved':
        return {
          nextStatus: 'en_route_pickup' as TransitStatus,
          label: t('driverManifest.startRouteToPickup', 'Start Route to Pickup'),
          icon: Navigation,
          bgClass: 'bg-[#F37021] hover:bg-[#D9530F] text-white',
        };
      case 'en_route_pickup':
        return {
          nextStatus: 'picked_up' as TransitStatus,
          label: t('driverManifest.donePickUp', 'Done Pick Up'),
          icon: CheckCheck,
          bgClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        };
      case 'picked_up':
        return {
          nextStatus: 'en_route_hospital' as TransitStatus,
          label: t('driverManifest.departToHospital', 'Depart to Hospital'),
          icon: Navigation,
          bgClass: 'bg-[#F37021] hover:bg-[#D9530F] text-white',
        };
      case 'en_route_hospital':
        return {
          nextStatus: 'dropped_off' as TransitStatus,
          label: t('driverManifest.doneDropOff', 'Done Drop Off'),
          icon: MapPin,
          bgClass: 'bg-emerald-700 hover:bg-emerald-800 text-white',
        };
      case 'dropped_off':
      case 'en_route_next':
      default:
        return {
          nextStatus: null,
          label: t('driverManifest.dropOffCompleted', 'Drop Off Completed'),
          icon: CheckCircle2,
          bgClass: 'bg-neutral-100 text-neutral-500 cursor-default border border-neutral-200',
        };
    }
  };

  const handleAdvancePassenger = (bookingId: string, nextStatus: TransitStatus | null) => {
    if (!nextStatus) return;
    updateBookingStatus(bookingId, nextStatus);
  };

  // Advance all passengers in the current time slot to the next collective stage
  const handleAdvanceEntireSlot = (slot: TimeSlotGroup) => {
    // If all are at approved/pending, start pickup route
    const hasUnpicked = slot.bookings.some(b => b.status === 'approved' || b.status === 'pending');
    if (hasUnpicked) {
      slot.bookings.forEach(b => {
        if (b.status === 'approved' || b.status === 'pending') {
          updateBookingStatus(b.id, 'en_route_pickup');
        }
      });
      return;
    }

    // If any are en_route_pickup, mark them picked up
    const hasEnRoutePickup = slot.bookings.some(b => b.status === 'en_route_pickup');
    if (hasEnRoutePickup) {
      slot.bookings.forEach(b => {
        if (b.status === 'en_route_pickup') {
          updateBookingStatus(b.id, 'picked_up');
        }
      });
      return;
    }

    // If any are picked up, depart to hospital
    const hasPickedUp = slot.bookings.some(b => b.status === 'picked_up');
    if (hasPickedUp) {
      slot.bookings.forEach(b => {
        if (b.status === 'picked_up') {
          updateBookingStatus(b.id, 'en_route_hospital');
        }
      });
      return;
    }

    // If any are en_route_hospital, mark dropped off
    const hasEnRouteHospital = slot.bookings.some(b => b.status === 'en_route_hospital');
    if (hasEnRouteHospital) {
      slot.bookings.forEach(b => {
        if (b.status === 'en_route_hospital') {
          updateBookingStatus(b.id, 'dropped_off');
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-neutral-900 pb-28">
      {/* Driver Mobile Header */}
      <div className="bg-gradient-to-r from-neutral-950 via-stone-900 to-orange-950 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-xl mx-auto px-4 py-3.5 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F37021] text-white font-black shadow-sm">
                <Car className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-extrabold">{t('driver.title', 'Driver Console')}</h1>
                  <span className="rounded-md bg-[#F37021] text-white px-2 py-0.5 text-xs font-mono font-black">
                    WVV 4108
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-300 block">
                  {t('common.status', 'Queue Status')}
                </span>
                <span className="text-xs font-extrabold text-white">
                  {queueTimeSlots.length} Slots
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-xl mx-auto px-4 pt-5 sm:px-6 space-y-5">
        {/* ============================================================== */}
        {/* UPCOMING DAYS THIS WEEK CALENDAR                               */}
        {/* ============================================================== */}
        <div className="rounded-3xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-orange-100 text-[#F37021] shadow-xs">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-neutral-900">
                  {t('driver.upcomingWeekCalendar', 'Upcoming Days This Week')}
                </h3>
                <p className="text-[11px] text-neutral-500 font-medium">
                  {t('driver.upcomingWeekDesc', 'Select a day to view approved hospital runs and passenger rosters.')}
                </p>
              </div>
            </div>

            <span className="font-mono text-[10px] font-black px-2.5 py-1 rounded-xl bg-neutral-900 text-white shadow-xs shrink-0">
              {formatDisplayDate(selectedDayKey, language)}
            </span>
          </div>

          {/* 7-Day Calendar Strip */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {WEEK_DAYS.map((d) => {
              const isSelected = selectedDayKey === d.key;
              const runCount = dayRunsCountMap.get(d.key) || 0;
              const dayLabel = getDayLabel(d, language);

              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setSelectedDayKey(d.key)}
                  className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition-all tap-target relative ${
                    isSelected
                      ? 'bg-[#F37021] text-white shadow-md scale-102 font-black'
                      : d.isToday
                      ? 'bg-orange-50/80 hover:bg-orange-100 border border-orange-300 text-neutral-900 font-bold'
                      : 'bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 font-semibold'
                  }`}
                >
                  {/* Today Badge */}
                  {d.isToday && (
                    <span className={`text-[7px] sm:text-[8px] font-black uppercase tracking-wider px-1 rounded-full mb-0.5 leading-tight ${
                      isSelected ? 'bg-white text-[#F37021]' : 'bg-[#F37021] text-white'
                    }`}>
                      {t('driver.today', 'Today')}
                    </span>
                  )}

                  {/* Day of week */}
                  <span className={`text-[10px] uppercase font-mono ${isSelected ? 'text-orange-100' : 'text-neutral-500'}`}>
                    {dayLabel}
                  </span>

                  {/* Date number */}
                  <span className="text-xs font-extrabold mt-0.5">
                    {d.dateNum.split(' ')[0]}
                  </span>

                  {/* Run count pill or dot */}
                  {runCount > 0 ? (
                    <span className={`mt-1 text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold leading-none ${
                      isSelected
                        ? 'bg-white text-[#F37021]'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      {runCount}
                    </span>
                  ) : (
                    <span className={`mt-1.5 h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white/40' : 'bg-neutral-300'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ============================================================== */}
        {/* 1. FOCUS ON TIME: QUEUE LIST GROUPED BY TIMESLOT               */}
        {/* ============================================================== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-extrabold text-neutral-900 tracking-tight">
              {selectedDayKey === 'Tuesday, 10 Nov 2026' 
                ? t('driver.todayQueue', "Today's Transit Queue") 
                : `${formatDisplayDate(selectedDayKey, language)}`}
            </h2>
            <span className="text-xs font-bold text-orange-950 bg-orange-100 border border-orange-300 px-3 py-1 rounded-full">
              {queueTimeSlots.length} Time Slots
            </span>
          </div>

          {queueTimeSlots.length === 0 ? (
            <div className="rounded-3xl border-2 border-neutral-200 bg-white p-7 text-center space-y-3.5 shadow-xs">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-neutral-100 text-neutral-400 mx-auto shadow-inner">
                <Car className="h-8 w-8 text-neutral-400" />
              </div>
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 font-mono font-bold text-xs uppercase tracking-wider border border-neutral-200">
                  <Clock className="h-3.5 w-3.5 text-neutral-500" />
                  {formatDisplayDate(selectedDayKey, language)}
                </span>
                <h3 className="text-xl font-black text-neutral-900 tracking-tight pt-1">
                  {t('driver.noCurrentJob', 'No Current Job')}
                </h3>
                <p className="text-xs font-medium text-neutral-600 max-w-sm mx-auto leading-relaxed">
                  {allTimeSlotGroups.length > 0 
                    ? t('driver.allTasksDone', 'All transit runs completed for this timeslot.')
                    : t('driver.noCurrentJobDesc', 'You have no active transit runs right now. View the weekly calendar below to see upcoming assignments.')}
                </p>
              </div>

              {/* Status helper pill */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 text-xs font-bold">
                <Calendar className="h-3.5 w-3.5 text-[#F37021]" />
                <span>{t('driver.upcomingWeekDesc', 'Select a day to view approved hospital runs and passenger rosters.')}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {queueTimeSlots.map((slotGroup) => {
                const isExpanded = expandedSlotKey === slotGroup.slotKey;
                const isGreenAlert = slotGroup.isReady || slotGroup.isActive;
                const paxCount = slotGroup.bookings.length;

                return (
                  <div
                    key={slotGroup.slotKey}
                    className={`rounded-3xl transition-all duration-200 overflow-hidden shadow-xs ${
                      isGreenAlert
                        ? 'border-2 border-emerald-500 ring-4 ring-emerald-100 bg-white'
                        : 'border-2 border-neutral-200 bg-white hover:border-[#F37021]'
                    }`}
                  >
                    {/* Time Slot Header (Clickable to Expand / Collapse) */}
                    <div
                      onClick={() => setExpandedSlotKey(isExpanded ? null : slotGroup.slotKey)}
                      className="p-4 sm:p-5 cursor-pointer flex items-center justify-between gap-3 tap-target"
                    >
                      <div className="flex-1 pr-2">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          {/* Large Focus on Time */}
                          <span className="font-mono text-base font-black text-orange-950 bg-orange-100 border border-orange-300 px-3 py-0.5 rounded-xl shadow-xs">
                            {slotGroup.displayTime}
                          </span>

                          {/* 15 Mins / Active Alert Badge */}
                          {isGreenAlert && (
                            <span className="text-[10px] font-extrabold uppercase tracking-wide bg-emerald-600 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                              {slotGroup.isActive 
                                ? t('driverManifest.inProgress', 'In Progress') 
                                : t('driverManifest.ready15Mins', 'Ready · Within 15 Mins')}
                            </span>
                          )}
                        </div>

                        {/* Customer count per car seats (Max 6 customers) */}
                        <p className="text-xs font-extrabold text-neutral-800 flex items-center gap-1.5">
                          <span>{paxCount} {paxCount === 1 ? t('driverManifest.customer', 'Customer') : t('driverManifest.customers', 'Customers')}</span>
                          <span className="text-neutral-400 font-normal">·</span>
                          <span className="text-neutral-500 font-medium">{paxCount} / 6 {t('driverManifest.seatsReserved', 'Seats Reserved')}</span>
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-md whitespace-nowrap ${
                          slotGroup.isActive
                            ? 'bg-[#F37021] text-white shadow-xs'
                            : 'bg-emerald-100 text-emerald-900 font-extrabold'
                        }`}>
                          {slotGroup.isActive 
                            ? t('driverManifest.activeMission', 'Active Mission') 
                            : t('driverManifest.upcoming', 'Upcoming')}
                        </span>

                        <div className="flex items-center text-xs font-extrabold text-[#F37021] gap-1">
                          <span>{isExpanded ? t('driverManifest.collapse', 'Collapse') : t('driverManifest.expand', 'Expand')}</span>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 stroke-[2.5]" />
                          ) : (
                            <ChevronRight className="h-4 w-4 stroke-[2.5]" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ============================================================== */}
                    {/* 2. EXPANDED MENU: PRIORITIZE ONLY 7 ITEMS PER PASSENGER:       */}
                    {/*    - Pickup Address                                            */}
                    {/*    - Destination                                               */}
                    {/*    - Name                                                      */}
                    {/*    - Seats                                                     */}
                    {/*    - Call Button                                               */}
                    {/*    - WhatsApp Button                                           */}
                    {/*    - Status Button                                             */}
                    {/* ============================================================== */}
                    {isExpanded && (
                      <div className="border-t-2 border-neutral-100 bg-neutral-50/70 p-4 sm:p-5 space-y-4">
                        {/* Optional collective Slot Progress Action if multiple passengers */}
                        {paxCount > 1 && (
                          <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                              <Navigation className="h-4 w-4 text-[#F37021]" />
                              {t('driverManifest.activeManifest', 'Active Manifest')} ({paxCount} {t('driverManifest.riders', 'Riders')})
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdvanceEntireSlot(slotGroup)}
                              className="text-[11px] font-bold text-neutral-900 bg-white hover:bg-orange-50 border border-orange-300 px-3 py-1 rounded-xl shadow-xs transition-all active:scale-95"
                            >
                              {t('driverManifest.advanceAll', 'Advance All in Slot')}
                            </button>
                          </div>
                        )}

                        {/* PASSENGER CARDS (1 per customer in this time slot, max 6) */}
                        <div className="space-y-4">
                          {slotGroup.bookings.map((booking) => {
                            const statusAction = getPassengerStatusAction(booking.status);
                            const StatusIcon = statusAction.icon;
                            const isWheelchair = booking.assigned_space.toLowerCase().includes('wheelchair');
                            const cleanPhone = booking.phone.replace(/[^0-9]/g, '');

                            return (
                              <div
                                key={booking.id}
                                className="rounded-2xl border-2 border-neutral-200 bg-white p-4 space-y-3.5 shadow-xs"
                              >
                                {/* 1. NAME & 2. SEATS */}
                                <div className="flex items-start justify-between gap-2 border-b border-neutral-100 pb-2.5">
                                  <div>
                                    <h3 className="text-base font-black text-neutral-900 leading-tight">
                                      {booking.passenger_name}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-orange-50 text-orange-950 border border-orange-200">
                                        {isWheelchair ? (
                                          <Accessibility className="h-3.5 w-3.5 text-[#F37021]" />
                                        ) : (
                                          <Armchair className="h-3.5 w-3.5 text-[#F37021]" />
                                        )}
                                        {booking.assigned_space}
                                      </span>

                                      {booking.donation && (
                                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                          booking.donation.method === 'cash'
                                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                        }`}>
                                          {booking.donation.method === 'cash' ? (
                                            <>
                                              <Banknote className="h-3.5 w-3.5 text-amber-700" />
                                              <span>{t('driver.collectCashDonation', 'Collect Cash: RM {amount}').replace('{amount}', booking.donation.amount.toFixed(2))}</span>
                                            </>
                                          ) : (
                                            <>
                                              <HeartHandshake className="h-3.5 w-3.5 text-emerald-700" />
                                              <span>{t('driver.qrDonated', 'QR Donated: RM {amount}').replace('{amount}', booking.donation.amount.toFixed(2))}</span>
                                            </>
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <span className={`text-[10px] font-mono font-extrabold uppercase px-2.5 py-1 rounded-md whitespace-nowrap ${
                                    booking.status === 'dropped_off'
                                      ? 'bg-neutral-100 text-neutral-600'
                                      : booking.status === 'en_route_pickup' || booking.status === 'picked_up' || booking.status === 'en_route_hospital'
                                      ? 'bg-[#F37021] text-white'
                                      : 'bg-orange-100 text-orange-900'
                                  }`}>
                                    {booking.status.replace(/_/g, ' ')}
                                  </span>
                                </div>

                                {/* 3. PICKUP ADDRESS & 4. DESTINATION */}
                                <div className="space-y-2.5 text-xs">
                                  {/* Pickup */}
                                  <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                      <span className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider block">
                                        {t('driver.pickupAddress', 'Pickup Address')}
                                      </span>
                                      <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.pickup_address)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-bold text-neutral-900 hover:text-[#F37021] hover:underline leading-snug block mt-0.5"
                                      >
                                        {booking.pickup_address}
                                      </a>
                                    </div>
                                  </div>

                                  {/* Destination */}
                                  <div className="flex items-start gap-2 pt-1.5 border-t border-neutral-100">
                                    <Building2 className="h-4 w-4 text-[#F37021] shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                      <span className="text-[10px] font-extrabold uppercase text-[#F37021] tracking-wider block">
                                        {t('driver.destination', 'Destination')}
                                      </span>
                                      <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.hospital_name)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-bold text-neutral-900 hover:text-[#F37021] hover:underline leading-snug block mt-0.5"
                                      >
                                        {booking.hospital_name}
                                      </a>
                                    </div>
                                  </div>
                                </div>

                                {/* 5. CALL BUTTON, 6. WHATSAPP BUTTON, and 7. STATUS BUTTON */}
                                <div className="pt-1 space-y-2">
                                  <div className="grid grid-cols-2 gap-2">
                                    {/* Call Button */}
                                    <a
                                      href={`tel:${booking.phone}`}
                                      className="h-11 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-900 font-extrabold text-xs flex items-center justify-center gap-1.5 tap-target shadow-xs transition-all active:scale-[0.98]"
                                    >
                                      <Phone className="h-4 w-4 text-emerald-600" />
                                      <span>{t('driver.call', 'Call')}</span>
                                    </a>

                                    {/* WhatsApp Button */}
                                    <a
                                      href={`https://wa.me/${cleanPhone}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="h-11 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-900 font-extrabold text-xs flex items-center justify-center gap-1.5 tap-target shadow-xs transition-all active:scale-[0.98]"
                                    >
                                      <MessageSquare className="h-4 w-4 text-emerald-600" />
                                      <span>{t('driver.whatsapp', 'WhatsApp')}</span>
                                    </a>
                                  </div>

                                  {/* Status Button */}
                                  {statusAction.nextStatus ? (
                                    <button
                                      type="button"
                                      onClick={() => handleAdvancePassenger(booking.id, statusAction.nextStatus)}
                                      className={`w-full h-12 rounded-xl flex items-center justify-center gap-2 font-black text-sm tracking-tight shadow-md transition-all active:scale-[0.98] tap-target ${statusAction.bgClass}`}
                                    >
                                      <StatusIcon className="h-4 w-4 stroke-[2.5]" />
                                      <span>{statusAction.label}</span>
                                    </button>
                                  ) : (
                                    <div className="w-full h-11 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-center gap-2 font-black text-xs">
                                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                      <span>{t('driverManifest.dropOffCompleted', 'Drop Off Completed')}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
