'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { ProfileModal } from '@/components/ProfileModal';
import { UserAvatar } from '@/components/UserAvatar';
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
  Check,
  Camera,
  X
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

// Robust date normalizer supporting ISO YYYY-MM-DD, with/without comma, e.g. "Tuesday, 10 Nov, 2026", "10 Nov 2026"
export const normalizeDateToYMD = (dateStr?: string): string => {
  if (!dateStr) return '2026-11-10';
  const clean = dateStr.trim();
  const ymdMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) return `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`;

  const dayMonthMatch = clean.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*,?\s*(\d{4})?/i);
  if (dayMonthMatch) {
    const day = dayMonthMatch[1].padStart(2, '0');
    const monthNames: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };
    const month = monthNames[dayMonthMatch[2].toLowerCase().slice(0, 3)] || '11';
    const year = dayMonthMatch[3] || '2026';
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return clean;
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
  ymd: string;
  key: string;
  dayNameEn: string;
  dayNameZh: string;
  dayNameMs: string;
  dateNum: string;
  isToday: boolean;
}

const WEEK_DAYS: WeekDayItem[] = [
  { ymd: '2026-11-09', key: 'Monday, 9 Nov 2026', dayNameEn: 'Mon', dayNameZh: '周一', dayNameMs: 'Isn', dateNum: '9 Nov', isToday: false },
  { ymd: '2026-11-10', key: 'Tuesday, 10 Nov 2026', dayNameEn: 'Tue', dayNameZh: '周二', dayNameMs: 'Sel', dateNum: '10 Nov', isToday: true },
  { ymd: '2026-11-11', key: 'Wednesday, 11 Nov 2026', dayNameEn: 'Wed', dayNameZh: '周三', dayNameMs: 'Rab', dateNum: '11 Nov', isToday: false },
  { ymd: '2026-11-12', key: 'Thursday, 12 Nov 2026', dayNameEn: 'Thu', dayNameZh: '周四', dayNameMs: 'Kha', dateNum: '12 Nov', isToday: false },
  { ymd: '2026-11-13', key: 'Friday, 13 Nov 2026', dayNameEn: 'Fri', dayNameZh: '周五', dayNameMs: 'Jum', dateNum: '13 Nov', isToday: false },
  { ymd: '2026-11-14', key: 'Saturday, 14 Nov 2026', dayNameEn: 'Sat', dayNameZh: '周六', dayNameMs: 'Sab', dateNum: '14 Nov', isToday: false },
  { ymd: '2026-11-15', key: 'Sunday, 15 Nov 2026', dayNameEn: 'Sun', dayNameZh: '周日', dayNameMs: 'Ahd', dateNum: '15 Nov', isToday: false },
];

const getDayLabel = (d: WeekDayItem, lang: string): string => {
  if (lang === 'zh') return d.dayNameZh;
  if (lang === 'ms') return d.dayNameMs;
  return d.dayNameEn;
};

const formatDisplayDate = (dateOrYmd: string, lang: string): string => {
  const ymd = normalizeDateToYMD(dateOrYmd);
  if (lang === 'zh') {
    if (ymd === '2026-11-09') return '11月9日 (周一)';
    if (ymd === '2026-11-10') return '11月10日 (周二 · 今日)';
    if (ymd === '2026-11-11') return '11月11日 (周三)';
    if (ymd === '2026-11-12') return '11月12日 (周四)';
    if (ymd === '2026-11-13') return '11月13日 (周五)';
    if (ymd === '2026-11-14') return '11月14日 (周六)';
    if (ymd === '2026-11-15') return '11月15日 (周日)';
  }
  if (lang === 'ms') {
    if (ymd === '2026-11-09') return 'Isn, 9 Nov 2026';
    if (ymd === '2026-11-10') return 'Sel, 10 Nov 2026 (Hari Ini)';
    if (ymd === '2026-11-11') return 'Rab, 11 Nov 2026';
    if (ymd === '2026-11-12') return 'Kha, 12 Nov 2026';
    if (ymd === '2026-11-13') return 'Jum, 13 Nov 2026';
    if (ymd === '2026-11-14') return 'Sab, 14 Nov 2026';
    if (ymd === '2026-11-15') return 'Ahd, 15 Nov 2026';
  }
  if (ymd === '2026-11-10') return 'Tuesday, 10 Nov 2026 (Today)';
  const day = WEEK_DAYS.find(d => d.ymd === ymd);
  return day ? day.key : dateOrYmd;
};

export default function DriverPage() {
  const { 
    bookings, 
    updateBookingStatus, 
    currentUser, 
    profiles, 
    driverLeaves, 
    requestDriverLeave, 
    isDateBlockedByLeave 
  } = useApp();
  const { t, language } = useLanguage();

  // Selected date in weekly calendar view (defaults to today '2026-11-10')
  const [selectedYmd, setSelectedYmd] = useState<string>('2026-11-10');
  const [showCompletedRuns, setShowCompletedRuns] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState<boolean>(false);

  // Leave Form states
  const [leaveDate, setLeaveDate] = useState<string>('2026-11-12');
  const [leaveReason, setLeaveReason] = useState<string>('');
  const [leaveSubmitted, setLeaveSubmitted] = useState<boolean>(false);
  const [leaveError, setLeaveError] = useState<string>('');

  // Driver profile being viewed/edited
  const driverProfile = useMemo(() => {
    if (currentUser?.role === 'driver') return currentUser;
    return profiles.find(p => p.role === 'driver') || currentUser;
  }, [currentUser, profiles]);

  // Approved bookings assigned to driver or all unassigned/driver runs
  const allJohanApprovedBookings = useMemo(() => {
    return bookings.filter(b => 
      b.status !== 'pending' && 
      b.status !== 'declined' && 
      (!b.assigned_driver || !driverProfile?.full_name || b.assigned_driver === driverProfile.full_name || currentUser?.role === 'admin')
    );
  }, [bookings, driverProfile, currentUser]);

  // Counts of approved bookings per day in the upcoming week
  const dayRunsCountMap = useMemo(() => {
    const map = new Map<string, number>();
    WEEK_DAYS.forEach((d) => {
      const count = allJohanApprovedBookings.filter(b => normalizeDateToYMD(b.date) === d.ymd).length;
      map.set(d.ymd, count);
    });
    return map;
  }, [allJohanApprovedBookings]);

  // Filter approved bookings for the selected day in the calendar
  const johanBookings = useMemo(() => {
    return allJohanApprovedBookings.filter(b => normalizeDateToYMD(b.date) === selectedYmd);
  }, [allJohanApprovedBookings, selectedYmd]);

  // Bookings still pending supervisor approval on selected day
  const pendingCountOnSelectedDay = useMemo(() => {
    return bookings.filter(b => 
      b.status === 'pending' && 
      normalizeDateToYMD(b.date) === selectedYmd
    ).length;
  }, [bookings, selectedYmd]);

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

  const completedTimeSlots = useMemo(() => {
    return allTimeSlotGroups.filter(g => g.isCompleted);
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
              {/* Request Leave Button */}
              <button
                type="button"
                onClick={() => {
                  setLeaveSubmitted(false);
                  setLeaveError('');
                  setIsLeaveModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-[#F37021] text-orange-200 hover:text-white border border-orange-400/40 text-xs font-bold transition-all tap-target shadow-xs"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">{t('driver.requestLeave', 'Request Leave')}</span>
              </button>

              {/* Driver Profile Button */}
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2 p-1 sm:px-2 rounded-2xl bg-white/10 hover:bg-white/20 transition-all tap-target text-left group"
                title={t('profile.editDriverProfile', 'Edit Driver Profile & Photo')}
              >
                <div className="relative group shrink-0">
                  <UserAvatar
                    src={driverProfile?.avatar_url}
                    name={driverProfile?.full_name || 'Driver'}
                    size={36}
                    className="rounded-xl border border-orange-400 shadow-xs"
                  />
                  <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>

                <div className="text-left hidden xs:block pr-1">
                  <p className="text-xs font-black text-white leading-tight group-hover:text-orange-200 transition-colors">
                    {driverProfile?.full_name || t('nav.driverRole', 'Driver')}
                  </p>
                  <p className="text-[10px] text-orange-200 font-bold">
                    {t('profile.edit', 'Edit Profile')}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-xl mx-auto px-4 pt-5 sm:px-6 space-y-5">
        {/* PENDING APPROVAL WARNING NOTICE */}
        {driverProfile && driverProfile.is_approved === false && (
          <div className="rounded-3xl border-2 border-amber-300 bg-amber-50 p-5 shadow-sm space-y-2">
            <div className="flex items-center gap-2.5 text-amber-900 font-extrabold text-sm">
              <Clock className="h-5 w-5 text-amber-600 shrink-0 animate-pulse" />
              <span>{t('driver.accountPendingTitle', 'Staff Account Awaiting Administrator Approval')}</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              {t('driver.accountPendingDesc', 'Your staff / driver credentials have been submitted and are pending verification and approval by a Beautiful Gate administrator before active dispatch missions are scheduled.')}
            </p>
          </div>
        )}

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
              {formatDisplayDate(selectedYmd, language)}
            </span>
          </div>

          {/* 7-Day Calendar Strip */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {WEEK_DAYS.map((d) => {
              const isSelected = selectedYmd === d.ymd;
              const runCount = dayRunsCountMap.get(d.ymd) || 0;
              const dayLabel = getDayLabel(d, language);
              const isDayOnLeave = isDateBlockedByLeave(d.ymd);

              return (
                <button
                  key={d.ymd}
                  type="button"
                  onClick={() => setSelectedYmd(d.ymd)}
                  className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition-all tap-target relative ${
                    isSelected
                      ? 'bg-[#F37021] text-white shadow-md scale-102 font-black'
                      : isDayOnLeave
                      ? 'bg-amber-100/70 border border-amber-300 text-amber-900 font-bold'
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

                  {/* On leave indicator or Run count pill */}
                  {isDayOnLeave ? (
                    <span className={`mt-1 text-[8px] px-1 py-0.2 rounded font-black uppercase tracking-wider ${
                      isSelected ? 'bg-white text-amber-900' : 'bg-amber-200 text-amber-900'
                    }`}>
                      {t('driver.onLeaveTag', 'Leave')}
                    </span>
                  ) : runCount > 0 ? (
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

        {/* ON LEAVE NOTICE BANNER */}
        {isDateBlockedByLeave(selectedYmd) && (
          <div className="rounded-3xl border-2 border-amber-400 bg-amber-50 p-5 shadow-sm space-y-2 animate-in fade-in-50">
            <div className="flex items-center gap-2.5 text-amber-950 font-black text-sm sm:text-base">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <span>{t('driver.onLeaveBannerTitle', 'ON LEAVE · Transport Services Suspended')}</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              {t('driver.onLeaveBannerDesc', 'You are officially registered as ON LEAVE on {date} with administrator approval. Public beneficiary bookings for this day are closed and no transport missions are assigned.').replace('{date}', formatDisplayDate(selectedYmd, language))}
            </p>
          </div>
        )}

        {/* ============================================================== */}
        {/* 1. FOCUS ON TIME: QUEUE LIST GROUPED BY TIMESLOT               */}
        {/* ============================================================== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-extrabold text-neutral-900 tracking-tight">
              {selectedYmd === '2026-11-10' 
                ? t('driver.todayQueue', "Today's Transit Queue") 
                : formatDisplayDate(selectedYmd, language)}
            </h2>
            <span className="text-xs font-bold text-orange-950 bg-orange-100 border border-orange-300 px-3 py-1 rounded-full">
              {queueTimeSlots.length} {queueTimeSlots.length === 1 ? 'Time Slot' : 'Time Slots'}
            </span>
          </div>

          {queueTimeSlots.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center space-y-2 shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400 mx-auto mb-1">
                <Car className="h-6 w-6 text-neutral-400" />
              </div>
              <h3 className="text-base font-extrabold text-neutral-900 tracking-tight">
                {t('driver.noCurrentJob', 'No Current Job')}
              </h3>
              <p className="text-xs text-neutral-500 font-medium max-w-xs mx-auto">
                {allTimeSlotGroups.length > 0 
                  ? t('driver.allTasksDone', 'All transit runs completed for today.')
                  : t('driver.noCurrentJobDesc', 'No active runs scheduled for this day.')}
              </p>
              {pendingCountOnSelectedDay > 0 && (
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                    {pendingCountOnSelectedDay} {t('driver.pendingApprovalNotice', 'booking awaiting supervisor approval')}
                  </span>
                </div>
              )}
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

          {/* Collapsible Completed Runs Section */}
          {completedTimeSlots.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowCompletedRuns(!showCompletedRuns)}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-all text-xs font-bold shadow-xs tap-target"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{t('driver.completedRuns', 'Completed Runs')} ({completedTimeSlots.length})</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${showCompletedRuns ? 'rotate-180' : ''}`} />
              </button>

              {showCompletedRuns && (
                <div className="mt-2.5 space-y-3 opacity-90">
                  {completedTimeSlots.map((slotGroup) => (
                    <div
                      key={slotGroup.slotKey}
                      className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-black text-neutral-800 bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 rounded-lg">
                          {slotGroup.displayTime}
                        </span>
                        <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          {t('driver.completedSlot', 'Completed')}
                        </span>
                      </div>
                      <div className="divide-y divide-neutral-100 text-xs">
                        {slotGroup.bookings.map((b) => (
                          <div key={b.id} className="py-2 flex items-center justify-between">
                            <div>
                              <p className="font-extrabold text-neutral-800">{b.passenger_name}</p>
                              <p className="text-[11px] text-neutral-500 font-medium">{b.clinic_department}</p>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-neutral-500 bg-neutral-50 px-2 py-1 rounded">
                              {b.assigned_space.split(':')[1]?.trim() || b.assigned_space}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Driver Profile Modal */}
      {isProfileModalOpen && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          targetProfile={driverProfile}
          mode="edit_self"
        />
      )}

      {/* Driver Leave Request Modal */}
      {isLeaveModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-neutral-200 shadow-2xl overflow-hidden">
            <div className="bg-neutral-900 text-white p-5 sm:p-6 relative">
              <button
                type="button"
                onClick={() => setIsLeaveModalOpen(false)}
                className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all tap-target"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white">
                  {t('driver.staffDispatch', 'Staff Dispatch')}
                </span>
                <span className="font-mono text-xs text-amber-300 font-bold">
                  {driverProfile?.full_name || t('nav.driverRole', 'Driver')}
                </span>
              </div>
              <h2 className="text-xl font-black text-white mt-1.5">
                {t('driver.leaveModalTitle', 'Request Driver Leave')}
              </h2>
              <p className="text-xs text-neutral-300 mt-0.5">
                {t('driver.leaveModalDesc', 'Submitted leaves require administrator approval before transit bookings are suspended')}
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!leaveDate) {
                  setLeaveError(t('driver.selectDateError', 'Please select a valid date.'));
                  return;
                }
                try {
                  await requestDriverLeave({
                    date: leaveDate,
                    reason: leaveReason.trim() || t('driver.defaultLeaveReason', 'Driver Personal Leave'),
                  });
                  setLeaveSubmitted(true);
                  setTimeout(() => {
                    setIsLeaveModalOpen(false);
                    setLeaveSubmitted(false);
                    setLeaveReason('');
                  }, 900);
                } catch {
                  setLeaveError(t('driver.submitLeaveError', 'Failed to submit leave request.'));
                }
              }}
              className="p-5 sm:p-6 space-y-4"
            >
              {leaveError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                  {leaveError}
                </div>
              )}

              {leaveSubmitted && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black">
                  {t('driver.leaveSubmittedSuccess', 'Leave request submitted successfully. Awaiting Administrator approval.')}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  {t('driver.leaveDate', 'Leave Date')}
                </label>
                <input
                  type="date"
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-300 bg-neutral-50 focus:bg-white text-neutral-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#F37021] transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  {t('driver.leaveReason', 'Reason for Leave (Optional)')}
                </label>
                <input
                  type="text"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder={t('driver.leaveReasonPlaceholder', 'e.g. Medical appointment, family matter, routine checkup')}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-300 bg-neutral-50 focus:bg-white text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#F37021] transition-all"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 text-xs font-bold transition-all tap-target"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={leaveSubmitted}
                  className="px-5 py-2.5 rounded-2xl bg-[#F37021] hover:bg-[#D9530F] text-white text-xs font-black shadow-md transition-all tap-target disabled:opacity-50"
                >
                  {leaveSubmitted ? t('driver.submitted', 'Submitted') : t('driver.submitLeaveRequest', 'Submit Leave Request')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
