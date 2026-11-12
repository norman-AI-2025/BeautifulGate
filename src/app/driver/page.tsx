'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  X,
  Sparkles
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

  const cleaned = clean.replace(/,/g, ' ');
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return clean;
};

// Unified Driver Job Interface
export interface DriverJobGroup {
  id: string; // `${ymd}_${slotTime}`
  date: string;
  ymd: string;
  displayTime: string;
  timestamp: number;
  bookings: TransitBooking[];
  isCompleted: boolean;
  isActive: boolean;
  isUpcoming: boolean;
  paxCount: number;
}

export interface WeekDayItem {
  ymd: string;
  key: string;
  dayNameEn: string;
  dayNameZh: string;
  dayNameMs: string;
  dateNum: string;
  isToday: boolean;
}

export const generateCurrentWeekDays = (): WeekDayItem[] => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);

  const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayNamesZh = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const dayNamesMs = ['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'];
  const fullDaysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const todayYmd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const days: WeekDayItem[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);

    const year = d.getFullYear();
    const month = d.getMonth();
    const dateNum = d.getDate();
    const dayIdx = d.getDay();
    const ymd = `${year}-${String(month + 1).padStart(2, '0')}-${String(dateNum).padStart(2, '0')}`;

    days.push({
      ymd,
      key: `${fullDaysEn[dayIdx]}, ${dateNum} ${shortMonths[month]} ${year}`,
      dayNameEn: dayNamesEn[dayIdx],
      dayNameZh: dayNamesZh[dayIdx],
      dayNameMs: dayNamesMs[dayIdx],
      dateNum: `${dateNum} ${shortMonths[month]}`,
      isToday: ymd === todayYmd,
    });
  }
  return days;
};

const getDayLabel = (d: WeekDayItem, lang: string): string => {
  if (lang === 'zh') return d.dayNameZh;
  if (lang === 'ms') return d.dayNameMs;
  return d.dayNameEn;
};

const formatDisplayDate = (dateOrYmd: string, lang: string): string => {
  const ymd = normalizeDateToYMD(dateOrYmd);
  const [y, m, d] = ymd.split('-').map(Number);
  const dateObj = new Date(y, (m || 1) - 1, d || 1);

  if (isNaN(dateObj.getTime())) return dateOrYmd;

  const locale = lang === 'zh' ? 'zh-CN' : lang === 'ms' ? 'ms-MY' : 'en-GB';
  return dateObj.toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export default function DriverPage() {
  const router = useRouter();
  const { 
    isLoaded,
    bookings, 
    updateBookingStatus, 
    currentUser, 
    profiles, 
    vehicles,
    driverLeaves, 
    requestDriverLeave, 
    isDateBlockedByLeave,
    verifyDonation 
  } = useApp();
  const { t, language } = useLanguage();

  // Route Authentication Guard: Only authenticated Drivers (or Admins) can access
  useEffect(() => {
    if (!isLoaded) return;
    if (!currentUser) {
      router.replace('/login');
    } else if (currentUser.role !== 'driver' && currentUser.role !== 'admin') {
      router.replace('/portal');
    }
  }, [isLoaded, currentUser, router]);

  const [weekDaysList, setWeekDaysList] = useState<WeekDayItem[]>([]);
  const [selectedYmd, setSelectedYmd] = useState<string>('');
  const [leaveDate, setLeaveDate] = useState<string>('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState<boolean>(false);
  const [cashDonationModalBooking, setCashDonationModalBooking] = useState<TransitBooking | null>(null);

  // Sync with client-side date dynamically
  useEffect(() => {
    const liveWeek = generateCurrentWeekDays();
    setWeekDaysList(liveWeek);
    const todayItem = liveWeek.find(d => d.isToday) || liveWeek[0];
    if (todayItem) {
      setSelectedYmd(todayItem.ymd);
      setLeaveDate(todayItem.ymd);
    }
  }, []);

  // Driver profile being viewed/edited
  const driverProfile = useMemo(() => {
    if (currentUser?.role === 'driver') return currentUser;
    return profiles.find(p => p.role === 'driver') || currentUser;
  }, [currentUser, profiles]);

  // AUTO-POPUP FOR DRIVER: Cash collection notice
  const pendingCashDonationBooking = useMemo(() => {
    return bookings.find(b => 
      b.donation && 
      b.donation.method === 'cash' && 
      b.donation.status !== 'paid' &&
      (!b.assigned_driver || !driverProfile?.full_name || b.assigned_driver === driverProfile.full_name)
    );
  }, [bookings, driverProfile]);

  useEffect(() => {
    if (pendingCashDonationBooking && !cashDonationModalBooking) {
      setCashDonationModalBooking(pendingCashDonationBooking);
    }
  }, [pendingCashDonationBooking, cashDonationModalBooking]);
  const [leaveReason, setLeaveReason] = useState<string>('');
  const [leaveSubmitted, setLeaveSubmitted] = useState<boolean>(false);
  const [leaveError, setLeaveError] = useState<string>('');

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
    weekDaysList.forEach((d) => {
      const count = allJohanApprovedBookings.filter(b => normalizeDateToYMD(b.date) === d.ymd).length;
      map.set(d.ymd, count);
    });
    return map;
  }, [allJohanApprovedBookings, weekDaysList]);

  // =========================================================================
  // UNIFIED STREAM OF DRIVER JOBS (COMPLETED, CURRENT, AND UPCOMING)
  // Grouped by [date + time slot] and sorted chronologically
  // =========================================================================
  const allDriverJobs: DriverJobGroup[] = useMemo(() => {
    const jobMap = new Map<string, {
      date: string;
      ymd: string;
      displayTime: string;
      timestamp: number;
      bookings: TransitBooking[];
    }>();

    allJohanApprovedBookings.forEach((b) => {
      const ymd = normalizeDateToYMD(b.date);
      const slotTime = normalizeSlotTime(b.appointment_time);
      const key = `${ymd}_${slotTime}`;

      if (!jobMap.has(key)) {
        const [y, m, d] = ymd.split('-').map(Number);
        const mins = parseTimeToMinutes(slotTime);
        const dateObj = new Date(y, (m || 1) - 1, d || 1, Math.floor(mins / 60), mins % 60);
        const timestamp = isNaN(dateObj.getTime()) ? 0 : dateObj.getTime();

        jobMap.set(key, {
          date: b.date || ymd,
          ymd,
          displayTime: slotTime,
          timestamp,
          bookings: [],
        });
      }

      jobMap.get(key)!.bookings.push(b);
    });

    const jobsList: DriverJobGroup[] = [];

    jobMap.forEach((val, id) => {
      const sortedPax = [...val.bookings].sort((a, b) => a.assigned_space.localeCompare(b.assigned_space));

      const isCompleted = sortedPax.length > 0 && sortedPax.every(b => 
        b.status === 'dropped_off' || b.status === 'en_route_next'
      );

      const isActive = sortedPax.some(b => 
        ['en_route_pickup', 'picked_up', 'en_route_hospital'].includes(b.status)
      );

      jobsList.push({
        id,
        date: val.date,
        ymd: val.ymd,
        displayTime: val.displayTime,
        timestamp: val.timestamp,
        bookings: sortedPax,
        isCompleted,
        isActive,
        isUpcoming: !isCompleted && !isActive,
        paxCount: sortedPax.length,
      });
    });

    // Chronological order: past completed first -> current in-progress -> upcoming jobs
    jobsList.sort((a, b) => a.timestamp - b.timestamp);

    return jobsList;
  }, [allJohanApprovedBookings]);

  // Determine current active job or first upcoming non-completed job
  const initialCurrentJob = useMemo(() => {
    if (allDriverJobs.length === 0) return null;
    const active = allDriverJobs.find(j => j.isActive);
    if (active) return active;
    const upcoming = allDriverJobs.find(j => !j.isCompleted);
    if (upcoming) return upcoming;
    return allDriverJobs[allDriverJobs.length - 1];
  }, [allDriverJobs]);

  // Centered job in viewport (outline turns green!)
  const [centeredJobId, setCenteredJobId] = useState<string | null>(null);
  const jobRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const hasInitialScrolled = useRef<boolean>(false);

  // Auto-scroll current job to center of screen on initial load
  useEffect(() => {
    if (!hasInitialScrolled.current && initialCurrentJob && isLoaded && allDriverJobs.length > 0) {
      setCenteredJobId(initialCurrentJob.id);
      const timer = setTimeout(() => {
        const el = jobRefs.current.get(initialCurrentJob.id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          hasInitialScrolled.current = true;
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [initialCurrentJob, isLoaded, allDriverJobs]);

  // Detect which job container is in the center of the screen as driver scrolls
  useEffect(() => {
    let ticking = false;

    const checkCenteredJob = () => {
      const viewportCenter = window.innerHeight / 2;
      let closestId: string | null = null;
      let minDistance = Infinity;

      jobRefs.current.forEach((el, id) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const elCenter = rect.top + rect.height / 2;
        const dist = Math.abs(viewportCenter - elCenter);
        if (dist < minDistance) {
          minDistance = dist;
          closestId = id;
        }
      });

      if (closestId && closestId !== centeredJobId) {
        setCenteredJobId(closestId);
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(checkCenteredJob);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    checkCenteredJob();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [allDriverJobs, centeredJobId]);

  // USER SPEC: "after completed it will scroll to next job"
  const autoScrollToNextJob = (completedJobId: string) => {
    const currentIndex = allDriverJobs.findIndex(j => j.id === completedJobId);
    if (currentIndex === -1) return;

    // Find the next upcoming non-completed job, or the next adjacent job
    const nextJob = allDriverJobs.slice(currentIndex + 1).find(j => !j.isCompleted) || allDriverJobs[currentIndex + 1];

    if (nextJob) {
      setTimeout(() => {
        const el = jobRefs.current.get(nextJob.id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setCenteredJobId(nextJob.id);
        }
      }, 450);
    }
  };

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

  const handleAdvancePassenger = (jobId: string, bookingId: string, nextStatus: TransitStatus | null) => {
    if (!nextStatus) return;
    updateBookingStatus(bookingId, nextStatus);

    // If marking dropped_off, check if all other passengers in this job are completed
    if (nextStatus === 'dropped_off') {
      const job = allDriverJobs.find(j => j.id === jobId);
      if (job) {
        const otherBookings = job.bookings.filter(b => b.id !== bookingId);
        const willCompleteJob = otherBookings.every(b => b.status === 'dropped_off' || b.status === 'en_route_next');
        if (willCompleteJob) {
          autoScrollToNextJob(jobId);
        }
      }
    }
  };

  // Advance all passengers in the current time slot to the next collective stage
  const handleAdvanceEntireSlot = (job: DriverJobGroup) => {
    // Stage 1: If any unpicked, start pickup route
    const hasUnpicked = job.bookings.some(b => b.status === 'approved' || b.status === 'pending');
    if (hasUnpicked) {
      job.bookings.forEach(b => {
        if (b.status === 'approved' || b.status === 'pending') {
          updateBookingStatus(b.id, 'en_route_pickup');
        }
      });
      return;
    }

    // Stage 2: If any are en_route_pickup, mark picked up
    const hasEnRoutePickup = job.bookings.some(b => b.status === 'en_route_pickup');
    if (hasEnRoutePickup) {
      job.bookings.forEach(b => {
        if (b.status === 'en_route_pickup') {
          updateBookingStatus(b.id, 'picked_up');
        }
      });
      return;
    }

    // Stage 3: If any are picked up, depart to hospital
    const hasPickedUp = job.bookings.some(b => b.status === 'picked_up');
    if (hasPickedUp) {
      job.bookings.forEach(b => {
        if (b.status === 'picked_up') {
          updateBookingStatus(b.id, 'en_route_hospital');
        }
      });
      return;
    }

    // Stage 4: If any are en_route_hospital, mark dropped off
    const hasEnRouteHospital = job.bookings.some(b => b.status === 'en_route_hospital');
    if (hasEnRouteHospital) {
      job.bookings.forEach(b => {
        if (b.status === 'en_route_hospital') {
          updateBookingStatus(b.id, 'dropped_off');
        }
      });
      // All passengers dropped off -> auto-scroll smoothly to next upcoming job!
      autoScrollToNextJob(job.id);
    }
  };

  // Block rendering dashboard if not authenticated or not driver/admin
  if (!isLoaded || !currentUser || (currentUser.role !== 'driver' && currentUser.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-neutral-400">Verifying driver credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-neutral-900 pb-36">
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
                    {vehicles?.[0]?.plate || driverProfile?.assigned_vehicle_plate || 'NDC 9751'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Leave Button */}
              <button
                type="button"
                onClick={() => {
                  setLeaveSubmitted(false);
                  setLeaveError('');
                  setIsLeaveModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-[#F37021] text-orange-200 hover:text-white border border-orange-400/40 text-xs font-black transition-all tap-target shadow-xs cursor-pointer"
              >
                <span>{language === 'zh' ? '请假' : language === 'ms' ? 'Cuti' : 'Leave'}</span>
              </button>

              {/* Driver Profile Button */}
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2 p-1 sm:px-2 rounded-2xl bg-white/10 hover:bg-white/20 transition-all tap-target text-left group cursor-pointer"
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

      <main className="max-w-xl mx-auto px-4 pt-5 sm:px-6 space-y-6">
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
        {/* UPCOMING DAYS THIS WEEK CALENDAR BAR                           */}
        {/* ============================================================== */}
        <div className="rounded-3xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-orange-100 text-[#F37021] shadow-xs">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-neutral-900">
                  {t('driver.upcomingWeekCalendar', 'Transit Schedule & Week Days')}
                </h3>
                <p className="text-[11px] text-neutral-500 font-medium">
                  {t('driver.tapDayToScroll', 'Tap any day to jump directly to its dispatch runs.')}
                </p>
              </div>
            </div>

            <span className="font-mono text-[10px] font-black px-2.5 py-1 rounded-xl bg-neutral-900 text-white shadow-xs shrink-0">
              {allDriverJobs.length} {t('driver.totalRuns', 'Runs')}
            </span>
          </div>

          {/* 7-Day Calendar Strip */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {weekDaysList.map((d) => {
              const runCount = dayRunsCountMap.get(d.ymd) || 0;
              const dayLabel = getDayLabel(d, language);
              const isDayOnLeave = isDateBlockedByLeave(d.ymd);
              const isSelected = selectedYmd === d.ymd;

              return (
                <button
                  key={d.ymd}
                  type="button"
                  onClick={() => {
                    setSelectedYmd(d.ymd);
                    // Smoothly scroll to the first job matching this date
                    const targetJob = allDriverJobs.find(j => j.ymd === d.ymd);
                    if (targetJob) {
                      const el = jobRefs.current.get(targetJob.id);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setCenteredJobId(targetJob.id);
                      }
                    }
                  }}
                  className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition-all tap-target relative cursor-pointer ${
                    isSelected
                      ? 'bg-[#F37021] text-white shadow-md font-black'
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
        {/* UP-TO-DOWN SCROLL OF JOB CONTAINERS                            */}
        {/* Center job has green outline; completed are faded/blurred;     */}
        {/* upcoming are clear; scrolling to completed makes it clear!     */}
        {/* ============================================================== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-neutral-900 tracking-tight">
                {t('driver.upcomingJobsTitle', 'Dispatch Missions Timeline')}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                {t('driver.scrollUpToDown', 'Up-Down Scroll')}
              </span>
            </div>
            <span className="text-xs font-bold text-neutral-500">
              {allDriverJobs.filter(j => !j.isCompleted).length} {t('driver.upcomingCount', 'Upcoming')}
            </span>
          </div>

          {allDriverJobs.length === 0 ? (
            <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center space-y-3 shadow-xs">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400 mx-auto">
                <Car className="h-7 w-7 text-neutral-400" />
              </div>
              <h3 className="text-base font-extrabold text-neutral-900">
                {t('driver.noJobsFound', 'No Scheduled Missions Found')}
              </h3>
              <p className="text-xs text-neutral-500 font-medium max-w-sm mx-auto">
                {t('driver.noJobsDesc', 'There are no active or upcoming transit missions assigned. Check back later or notify the Beautiful Gate transport supervisor.')}
              </p>
            </div>
          ) : (
            <div className="space-y-6 pt-2">
              {allDriverJobs.map((job) => {
                const isCentered = centeredJobId === job.id;
                const isCompleted = job.isCompleted;

                // Container Styling:
                // - Centered: green outline, bright clear, elevated shadow
                // - Completed & not centered: faded & blurred
                // - Upcoming: clean, crisp, neutral border
                let containerStyle = '';
                if (isCentered) {
                  containerStyle = 'border-2 border-emerald-500 ring-4 ring-emerald-500/20 shadow-2xl shadow-emerald-500/10 scale-[1.01] bg-white opacity-100 blur-0 z-20';
                } else if (isCompleted) {
                  containerStyle = 'border border-neutral-200 bg-neutral-100/75 opacity-40 blur-[1.5px] scale-[0.98] cursor-pointer hover:opacity-75 z-10';
                } else {
                  containerStyle = 'border-2 border-neutral-200/90 bg-white shadow-sm opacity-100 blur-0 hover:border-neutral-300 z-10';
                }

                return (
                  <div
                    key={job.id}
                    id={`job-${job.id}`}
                    ref={(el) => {
                      if (el) jobRefs.current.set(job.id, el);
                      else jobRefs.current.delete(job.id);
                    }}
                    onClick={() => {
                      // Tap any container (e.g. faded completed one) to scroll it to center and make it clear
                      if (!isCentered) {
                        const el = jobRefs.current.get(job.id);
                        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setCenteredJobId(job.id);
                      }
                    }}
                    className={`relative rounded-3xl p-5 sm:p-6 transition-all duration-300 ease-out space-y-4 ${containerStyle}`}
                  >
                    {/* Job Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-3.5">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Date Badge */}
                          <span className="text-xs font-black text-neutral-800 bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 rounded-lg">
                            {formatDisplayDate(job.date, language)}
                          </span>

                          {/* Time Slot - Large and bold */}
                          <span className="font-mono text-sm sm:text-base font-black px-3 py-0.5 rounded-xl bg-orange-100 text-orange-950 border border-orange-300 shadow-xs">
                            {job.displayTime}
                          </span>
                        </div>

                        {/* Customer count & Seat capacity */}
                        <p className="text-[11px] font-extrabold text-neutral-500 flex items-center gap-1.5 pt-0.5">
                          <span>{job.paxCount} {job.paxCount === 1 ? t('driverManifest.customer', 'Customer') : t('driverManifest.customers', 'Customers')}</span>
                          <span>·</span>
                          <span>{job.paxCount} / 6 {t('driverManifest.seatsReserved', 'Seats Reserved')}</span>
                        </p>
                      </div>

                      {/* Status Badges & Advance All */}
                      <div className="flex items-center gap-2">
                        {isCentered ? (
                          <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-600 text-white flex items-center gap-1.5 shadow-sm animate-pulse">
                            <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                            {job.isCompleted 
                              ? t('driver.jobInFocus', 'Job In Focus · Completed') 
                              : t('driver.currentJob', 'Current Job')}
                          </span>
                        ) : isCompleted ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-neutral-200 text-neutral-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            {t('driver.completedSlot', 'Completed')}
                          </span>
                        ) : job.isActive ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-[#F37021] text-white flex items-center gap-1 shadow-xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                            {t('driverManifest.inProgress', 'In Progress')}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-900 border border-emerald-300">
                            {t('driverManifest.upcoming', 'Upcoming Job')}
                          </span>
                        )}

                        {/* Collective Advance All Button if multiple pax */}
                        {job.paxCount > 1 && !isCompleted && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdvanceEntireSlot(job);
                            }}
                            className="text-[11px] font-bold text-neutral-900 bg-white hover:bg-orange-50 border border-orange-300 px-3 py-1 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                          >
                            {t('driverManifest.advanceAll', 'Advance All')}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Passenger Manifest Cards inside this Job */}
                    <div className="space-y-3.5">
                      {job.bookings.map((booking) => {
                        const statusAction = getPassengerStatusAction(booking.status);
                        const StatusIcon = statusAction.icon;
                        const isWheelchair = booking.assigned_space.toLowerCase().includes('wheelchair');
                        const cleanPhone = booking.phone.replace(/[^0-9]/g, '');

                        return (
                          <div
                            key={booking.id}
                            className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4 space-y-3 shadow-2xs hover:bg-white transition-colors"
                          >
                            {/* Passenger Name & Assigned Seat */}
                            <div className="flex items-start justify-between gap-2 border-b border-neutral-200/60 pb-2.5">
                              <div>
                                <h4 className="text-base font-black text-neutral-900 leading-tight">
                                  {booking.passenger_name}
                                </h4>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                  <span className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-orange-50 text-orange-950 border border-orange-200">
                                    {isWheelchair ? (
                                      <Accessibility className="h-3.5 w-3.5 text-[#F37021]" />
                                    ) : (
                                      <Armchair className="h-3.5 w-3.5 text-[#F37021]" />
                                    )}
                                    {booking.assigned_space}
                                  </span>

                                  {/* Cash or QR donation tag */}
                                  {booking.donation && (
                                    booking.donation.method === 'cash' ? (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setCashDonationModalBooking(booking);
                                        }}
                                        className={`inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-1 rounded-lg border transition-all tap-target cursor-pointer ${
                                          booking.donation.status === 'paid'
                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                            : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300 shadow-2xs active:scale-95'
                                        }`}
                                      >
                                        <Banknote className="h-3.5 w-3.5 text-amber-700" />
                                        <span>
                                          RM {booking.donation.amount.toFixed(2)} ({booking.donation.status === 'paid' ? t('donation.received', 'Received') : t('driver.collectCash', 'Collect Cash')})
                                        </span>
                                      </button>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300">
                                        <HeartHandshake className="h-3.5 w-3.5 text-emerald-700" />
                                        <span>{t('driver.qrDonated', 'QR Donated: RM {amount}').replace('{amount}', booking.donation.amount.toFixed(2))}</span>
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>

                              <span className={`text-[10px] font-mono font-extrabold uppercase px-2.5 py-1 rounded-md whitespace-nowrap ${
                                booking.status === 'dropped_off'
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                  : booking.status === 'en_route_pickup' || booking.status === 'picked_up' || booking.status === 'en_route_hospital'
                                  ? 'bg-[#F37021] text-white'
                                  : 'bg-orange-100 text-orange-900'
                              }`}>
                                {booking.status.replace(/_/g, ' ')}
                              </span>
                            </div>

                            {/* Addresses with Navigation links */}
                            <div className="space-y-2 text-xs">
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
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-xs font-bold text-neutral-900 hover:text-[#F37021] hover:underline leading-snug block mt-0.5"
                                  >
                                    {booking.pickup_address}
                                  </a>
                                </div>
                              </div>

                              {/* Destination */}
                              <div className="flex items-start gap-2 pt-1 border-t border-neutral-200/50">
                                <Building2 className="h-4 w-4 text-[#F37021] shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <span className="text-[10px] font-extrabold uppercase text-[#F37021] tracking-wider block">
                                    {t('driver.destination', 'Destination')}
                                  </span>
                                  <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.hospital_name)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-xs font-bold text-neutral-900 hover:text-[#F37021] hover:underline leading-snug block mt-0.5"
                                  >
                                    {booking.hospital_name}
                                  </a>
                                </div>
                              </div>
                            </div>

                            {/* Call, WhatsApp, and 4-Stage Status Advance Button */}
                            <div className="pt-1 space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <a
                                  href={`tel:${booking.phone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-10 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-900 font-extrabold text-xs flex items-center justify-center gap-1.5 tap-target shadow-2xs transition-all active:scale-[0.98]"
                                >
                                  <Phone className="h-4 w-4 text-emerald-600" />
                                  <span>{t('driver.call', 'Call')}</span>
                                </a>

                                <a
                                  href={`https://wa.me/${cleanPhone}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-10 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-900 font-extrabold text-xs flex items-center justify-center gap-1.5 tap-target shadow-2xs transition-all active:scale-[0.98]"
                                >
                                  <MessageSquare className="h-4 w-4 text-emerald-600" />
                                  <span>{t('driver.whatsapp', 'WhatsApp')}</span>
                                </a>
                              </div>

                              {/* Status Action Button */}
                              {statusAction.nextStatus ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAdvancePassenger(job.id, booking.id, statusAction.nextStatus);
                                  }}
                                  className={`w-full h-11 rounded-xl flex items-center justify-center gap-2 font-black text-xs sm:text-sm tracking-tight shadow-md transition-all active:scale-[0.98] tap-target cursor-pointer ${statusAction.bgClass}`}
                                >
                                  <StatusIcon className="h-4 w-4 stroke-[2.5]" />
                                  <span>{statusAction.label}</span>
                                </button>
                              ) : (
                                <div className="w-full h-10 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-center gap-2 font-black text-xs">
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
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Floating Jump to Current Job Button */}
      {initialCurrentJob && centeredJobId !== initialCurrentJob.id && (
        <button
          type="button"
          onClick={() => {
            const el = jobRefs.current.get(initialCurrentJob.id);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setCenteredJobId(initialCurrentJob.id);
            }
          }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-2xl flex items-center gap-2 border border-emerald-400/50 backdrop-blur-md cursor-pointer tap-target transition-all hover:scale-105 active:scale-95 animate-bounce"
        >
          <Navigation className="h-3.5 w-3.5 text-white" />
          <span>{t('driver.jumpToCurrentJob', 'Jump to Current Job')}</span>
        </button>
      )}

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
                className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all tap-target cursor-pointer"
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
                  className="px-4 py-2.5 rounded-2xl border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 text-xs font-bold transition-all tap-target cursor-pointer"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={leaveSubmitted}
                  className="px-5 py-2.5 rounded-2xl bg-[#F37021] hover:bg-[#D9530F] text-white text-xs font-black shadow-md transition-all tap-target disabled:opacity-50 cursor-pointer"
                >
                  {leaveSubmitted ? t('driver.submitted', 'Submitted') : t('driver.submitLeaveRequest', 'Submit Leave Request')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Clean Modal for Cash Donation Collection */}
      {cashDonationModalBooking && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50 duration-200"
          onClick={() => setCashDonationModalBooking(null)}
        >
          <div 
            className="w-full max-w-sm rounded-3xl bg-white border border-neutral-200 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                  <Banknote className="h-4 w-4 text-amber-700" />
                </div>
                <h3 className="font-extrabold text-sm text-neutral-900">
                  {t('donation.cashHandoverTitle', 'Cash Collection')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCashDonationModalBooking(null)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Clean Data Fields */}
            <div className="space-y-3 bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-500">{t('admin.date', 'Date')}</span>
                <span className="font-bold text-neutral-900">
                  {cashDonationModalBooking.date || t('common.today', 'Today')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-500">{t('admin.timeSlot', 'Time Slot')}</span>
                <span className="font-mono font-extrabold text-neutral-900">
                  {cashDonationModalBooking.appointment_time}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-500">{t('admin.name', 'Username')}</span>
                <span className="font-extrabold text-neutral-900">
                  {cashDonationModalBooking.passenger_name}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60">
                <span className="font-semibold text-neutral-500">{t('admin.amountCol', 'Amount')}</span>
                <span className="font-mono text-base font-black text-[#F37021]">
                  RM {cashDonationModalBooking.donation?.amount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action Button: Received */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  verifyDonation(cashDonationModalBooking.id);
                  setCashDonationModalBooking(null);
                }}
                className={`w-full py-3 rounded-2xl text-xs font-black shadow-md transition-all tap-target flex items-center justify-center gap-2 cursor-pointer ${
                  cashDonationModalBooking.donation?.status === 'paid'
                    ? 'bg-emerald-600 text-white cursor-default'
                    : 'bg-[#F37021] hover:bg-[#D9530F] text-white active:scale-95'
                }`}
              >
                <Check className="h-4 w-4 stroke-[3]" />
                <span>
                  {cashDonationModalBooking.donation?.status === 'paid'
                    ? t('donation.received', 'Received')
                    : t('donation.btnReceived', 'Received')}
                </span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
