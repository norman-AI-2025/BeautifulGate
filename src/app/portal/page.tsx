'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { WeeklyTimetable } from '@/components/WeeklyTimetable';
import { VanFloorPlanModal } from '@/components/VanFloorPlanModal';
import { LinearStageIndicator } from '@/components/LinearStageIndicator';
import { ServiceRatingCard } from '@/components/ServiceRatingCard';
import { TransitDonationModal } from '@/components/TransitDonationModal';
import { ProfileModal } from '@/components/ProfileModal';
import { UserAvatar } from '@/components/UserAvatar';
import { 
  Car, 
  Sparkles, 
  Calendar, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  HeartHandshake, 
  Plus, 
  ChevronRight, 
  Star,
  Check,
  ChevronDown,
  ChevronUp,
  Camera,
  Phone,
  MessageSquare
} from 'lucide-react';
import { TransitBooking } from '@/types';

export default function MobileArtisanPortalPage() {
  const router = useRouter();
  const { 
    isLoaded,
    currentUser, 
    bookings, 
    products, 
    getArtisanStats, 
    workLogs,
    profiles 
  } = useApp();
  const { t } = useLanguage();

  // Route Authentication Guard: Only authenticated users can access
  useEffect(() => {
    if (!isLoaded) return;
    if (!currentUser) {
      router.replace('/login');
    }
  }, [isLoaded, currentUser, router]);

  const driverProfile = profiles.find(p => p.role === 'driver');

  // Beneficiary Access Control:
  // - 'resident' and 'daycare': access both van bookings and workshop income tracking
  // - 'non_resident': ONLY access booking van function
  const beneficiaryType = currentUser?.beneficiary_type || 'resident';
  const canAccessIncome = beneficiaryType === 'resident' || beneficiaryType === 'daycare';

  // Main Tabs: "transit" | "earnings"
  const [mainTab, setMainTab] = useState<'transit' | 'earnings'>('transit');

  // Enforce access control: non-residents can only access transit
  useEffect(() => {
    if (!canAccessIncome && mainTab === 'earnings') {
      setMainTab('transit');
    }
  }, [canAccessIncome, mainTab]);

  // Van Transit Sub-Tabs: "book" | "status"
  const [transitTab, setTransitTab] = useState<'book' | 'status'>('book');

  // Timetable booking modal state
  const [modalSlot, setModalSlot] = useState<{ day: string; slot: string } | null>(null);
  const [justBookedId, setJustBookedId] = useState<string | null>(null);
  const [selectedDonationBooking, setSelectedDonationBooking] = useState<TransitBooking | null>(null);
  // USER SPEC: minimize completed and rated services, click to expand, default minimized
  const [isCompletedExpanded, setIsCompletedExpanded] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // User's specific bookings
  const userBookings = bookings.filter(b => 
    currentUser ? (b.passenger_id === currentUser.id || b.passenger_name === currentUser.full_name) : true
  );

  // Filter pending, approved/active, and completed
  const pendingBookings = userBookings.filter(b => b.status === 'pending');
  const activeBookings = userBookings.filter(b => 
    ['approved', 'en_route_pickup', 'picked_up', 'en_route_hospital'].includes(b.status)
  );
  const completedBookings = userBookings.filter(b => 
    ['dropped_off', 'en_route_next'].includes(b.status)
  );
  const declinedBookings = userBookings.filter(b => b.status === 'declined');

  // Total active or pending trips
  const activeAlertCount = pendingBookings.length + activeBookings.length;

  const handleSlotSelect = (dayName: string, timeSlot: string) => {
    setModalSlot({ day: dayName, slot: timeSlot });
  };

  const handleBookingSuccess = (id: string) => {
    setJustBookedId(id);
    setTransitTab('status'); // Auto switch to status tab as requested!
  };

  const artisanStats = currentUser ? getArtisanStats(currentUser.id) : null;
  const userRecentLogs = (currentUser 
    ? workLogs.filter(l => l.worker_id === currentUser.id)
    : workLogs
  ).slice(0, 5);

  // Block rendering dashboard if not authenticated
  if (!isLoaded || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-[#F37021] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-neutral-600">Loading portal session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-neutral-900 pb-28">
      {/* Top Mobile Bar */}
      <div className="bg-gradient-to-r from-neutral-950 via-stone-900 to-orange-950 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div 
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-3 cursor-pointer group"
              title={t('profile.editMyProfile', 'Click to edit your profile and photo')}
            >
              <div className="relative group shrink-0">
                <UserAvatar
                  src={currentUser?.avatar_url}
                  name={currentUser?.full_name || 'Beneficiary'}
                  size={44}
                  className="rounded-2xl border-2 border-orange-400/80 shadow-xs group-hover:border-white transition-colors"
                />
                <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="h-4 w-4 text-white" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#F37021]">
                    {t('nav.portal', 'Beneficiary Portal')}
                  </span>
                </div>
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight group-hover:text-orange-200 transition-colors">
                  {currentUser?.full_name || t('common.user', 'Beneficiary')}
                </h1>
                <p className="text-xs text-orange-200 flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#F37021]" />
                  <span>
                    {beneficiaryType === 'daycare'
                      ? t('profile.beneficiaryDaycareBadge', 'Daycare')
                      : beneficiaryType === 'non_resident'
                      ? t('profile.beneficiaryNonResidentBadge', 'Non-Resident')
                      : t('profile.beneficiaryResidentBadge', 'Resident')}
                  </span>
                  <span>·</span>
                  <span>{currentUser?.mobility_type || 'Wheelchair Transit'}</span>
                </p>
              </div>
            </div>

            {/* Main Navigation: Switcher for Residents/Daycare */}
            <div className="flex items-center gap-2">
              {canAccessIncome && (
                <div className="flex rounded-full bg-white/10 p-1 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setMainTab('transit')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all tap-target ${
                      mainTab === 'transit'
                        ? 'bg-[#F37021] text-white shadow-sm font-black'
                        : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    <Car className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline">{t('portal.vanTransit', 'Transit')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMainTab('earnings')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all tap-target ${
                      mainTab === 'earnings'
                        ? 'bg-[#F37021] text-white shadow-sm font-black'
                        : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline">{t('portal.myEarnings', 'Earnings')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pt-4 sm:pt-6 space-y-5">
        {/* ============================================================== */}
        {/* ======================= VAN TRANSIT TAB ======================= */}
        {/* ============================================================== */}
        {mainTab === 'transit' && (
          <div className="space-y-4">
            {/* Sub-Tabs: "Book a Service" vs "Booking Status" */}
            <div className="grid grid-cols-2 p-1.5 bg-neutral-200/80 rounded-2xl border border-neutral-300">
              <button
                type="button"
                onClick={() => setTransitTab('book')}
                className={`py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 tap-target ${
                  transitTab === 'book'
                    ? 'bg-[#F37021] text-white shadow-md'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                <Calendar className="h-4 w-4" />
                {t('portal.bookService', 'Book a Service')}
              </button>

              <button
                type="button"
                onClick={() => setTransitTab('status')}
                className={`relative py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 tap-target ${
                  transitTab === 'status'
                    ? 'bg-[#F37021] text-white shadow-md'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                <Clock className="h-4 w-4" />
                {t('portal.bookingStatus', 'Booking Status')}
                {activeAlertCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#F37021] font-black text-[10px] shadow-xs">
                    {activeAlertCount}
                  </span>
                )}
              </button>
            </div>

            {/* Just Booked Notification Banner */}
            {justBookedId && (
              <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-4 flex items-start justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">
                      {t('portalStatus.bookingSubmittedSuccess', 'Booking Submitted Successfully!')}
                    </h4>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      {t('portalStatus.pendingApprovalDesc', 'Your transit request is now Pending Administrator Approval. You can monitor its progression below.')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setJustBookedId(null)}
                  className="text-emerald-700 text-xs font-bold hover:underline"
                >
                  {t('portalStatus.dismiss', 'Dismiss')}
                </button>
              </div>
            )}

            {/* ----------------- SUB-VIEW 1: BOOK A SERVICE ----------------- */}
            {transitTab === 'book' && (
              <div className="space-y-4">
                {/* Timetable matching user image */}
                <WeeklyTimetable
                  bookings={bookings}
                  onSelectSlot={handleSlotSelect}
                />
              </div>
            )}

            {/* ----------------- SUB-VIEW 2: BOOKING STATUS ----------------- */}
            {transitTab === 'status' && (
              <div className="space-y-5">
                {/* 1. Active / Approved Transit Trips (with Live Status Bar) */}
                {activeBookings.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                        {t('portalStatus.approvedMission', 'Approved Transit Mission')} ({activeBookings.length})
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                        {t('portalStatus.vehicleAssigned', 'Vehicle Assigned')}
                      </span>
                    </div>

                    {activeBookings.map((b) => (
                      <div
                        key={b.id}
                        className="rounded-3xl border-2 border-orange-500 bg-white p-5 sm:p-6 shadow-md space-y-4"
                      >
                        {/* Header Details: Prioritize Time, Date & Destination */}
                        <div className="space-y-1.5 border-b border-neutral-100 pb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-black bg-[#F37021] text-white px-2.5 py-1 rounded-lg shadow-2xs">
                              {b.appointment_time}
                            </span>
                            <span className="text-xs font-bold text-neutral-600 bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded-lg">
                              {b.date || t('common.today', 'Today')}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-neutral-900 tracking-tight">
                              {b.hospital_name}
                            </h3>
                            <p className="text-xs font-semibold text-neutral-600 mt-0.5">
                              {b.clinic_department}
                            </p>
                          </div>
                        </div>

                        {/* Status Bar */}
                        <div className="rounded-2xl bg-neutral-50 p-3 border border-neutral-200">
                          <LinearStageIndicator
                            status={b.status}
                            timestamps={b.timestamps}
                          />
                        </div>

                        {/* Driver & Van Info with Call and WhatsApp Buttons */}
                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-3.5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                {t('portalStatus.operator', 'Operator')}
                              </span>
                              <p className="font-extrabold text-neutral-900 text-sm mt-0.5">
                                {b.assigned_driver}
                              </p>
                              <p className="text-[11px] text-[#F37021] font-bold mt-0.5">
                                Toyota HiAce Commuter ({b.assigned_vehicle.plate})
                              </p>
                            </div>

                            {/* Direct Call & WhatsApp Buttons */}
                            <div className="flex items-center gap-2">
                              <a
                                href={`tel:${driverProfile?.phone || b.phone || '+60169759883'}`}
                                className="h-9 px-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-900 font-extrabold text-xs flex items-center gap-1.5 tap-target shadow-2xs hover:shadow-xs transition-all active:scale-95"
                                title={t('vanInfo.call', 'Call')}
                              >
                                <Phone className="h-3.5 w-3.5 text-emerald-600" />
                                <span>{t('vanInfo.call', 'Call')}</span>
                              </a>

                              <a
                                href={`https://wa.me/${(driverProfile?.phone || '+60169759883').replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-9 px-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-900 font-extrabold text-xs flex items-center gap-1.5 tap-target shadow-2xs hover:shadow-xs transition-all active:scale-95"
                                title={t('vanInfo.whatsapp', 'WhatsApp')}
                              >
                                <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                                <span>{t('vanInfo.whatsapp', 'WhatsApp')}</span>
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Voluntary Transit Donation Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedDonationBooking(b)}
                          className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 tap-target transition-all shadow-xs ${
                            b.donation?.status === 'paid'
                              ? 'border border-emerald-400 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                              : b.donation
                              ? 'border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                              : 'border-2 border-[#F37021] bg-gradient-to-r from-orange-500 to-[#D9530F] text-white hover:opacity-95 shadow-md shadow-orange-500/20'
                          }`}
                        >
                          {b.donation?.status === 'paid' ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              <span>
                                {t('donation.donated', 'Donation Completed')}: <span className="font-mono font-extrabold text-emerald-950">RM {b.donation.amount.toFixed(2)}</span> ({b.donation.method === 'cash' ? t('donation.cashToDriver', 'Cash to Driver') : t('donation.qrDuitNow', 'DuitNow QR')})
                              </span>
                            </>
                          ) : b.donation ? (
                            <>
                              <Clock className="h-4 w-4 text-amber-600" />
                              <span>
                                {t('donation.pendingVerification', 'Pending Driver Receipt')}: <span className="font-mono font-extrabold text-amber-950">RM {b.donation.amount.toFixed(2)}</span> ({t('donation.cashToDriver', 'Cash')})
                              </span>
                            </>
                          ) : (
                            <>
                              <HeartHandshake className="h-4 w-4 text-white" />
                              <span>{t('donation.button', 'Make a Transit Donation (Cash / QR)')}</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Pending Bookings (Awaiting Administrator Approval) */}
                {pendingBookings.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                      {t('portalStatus.pendingApproval', 'Pending Administrator Approval')} ({pendingBookings.length})
                    </span>

                    {pendingBookings.map((b) => (
                      <div
                        key={b.id}
                        className="rounded-2xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50 p-4 shadow-xs space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-yellow-400 text-yellow-950 flex items-center justify-center font-bold text-xs">
                              !
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-neutral-900">
                                {b.hospital_name}
                              </h4>
                              <p className="text-[11px] text-neutral-600">
                                {b.clinic_department} · {t('admin.timeSlot', 'Slot')}: {b.appointment_time}
                              </p>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold uppercase tracking-wider bg-yellow-400 text-yellow-950 px-2.5 py-1 rounded-full shadow-xs">
                            {t('adminTable.pending', 'Pending')}
                          </span>
                        </div>

                        <div className="rounded-xl bg-white/80 p-3 text-xs border border-yellow-200">
                          <p className="text-neutral-700 font-medium">
                            {t('portalStatus.allocatedSeat', 'Allocated Seat:')} <span className="font-bold text-neutral-900">{b.assigned_space}</span>
                          </p>
                          <p className="text-[11px] text-neutral-500 mt-0.5">
                            {t('portalStatus.pendingVerification', 'Supervisor will verify capacity and assign dispatch.')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. Completed Bookings (Minimized by default, click to expand) */}
                {completedBookings.length > 0 && (
                  <div className="rounded-3xl border border-neutral-200 bg-white overflow-hidden shadow-xs transition-all">
                    {/* Collapsible Header Accordion Toggle */}
                    <button
                      type="button"
                      onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
                      className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-neutral-50/80 transition-colors tap-target gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-xs shrink-0">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-extrabold text-neutral-900">
                              {t('portalStatus.completedAndRated', 'Completed & Rated Services')}
                            </h4>
                            <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
                              {completedBookings.length}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                            {t('portalStatus.completedSummary', '{count} past service(s) safely completed').replace('{count}', String(completedBookings.length))}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold text-neutral-500 hidden sm:inline-block">
                          {isCompletedExpanded ? t('portalStatus.clickToCollapse', 'Click to collapse') : t('portalStatus.clickToExpand', 'Click to expand')}
                        </span>
                        <div className="h-7 w-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 transition-transform">
                          {isCompletedExpanded ? (
                            <ChevronUp className="h-4 w-4 stroke-[2.5]" />
                          ) : (
                            <ChevronDown className="h-4 w-4 stroke-[2.5]" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expandable Content Body */}
                    {isCompletedExpanded && (
                      <div className="p-4 sm:p-5 pt-0 space-y-4 border-t border-neutral-100 bg-neutral-50/40">
                        {completedBookings.map((b) => (
                          <div
                            key={b.id}
                            className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-xs space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-[10px] font-mono text-neutral-400">
                                  {t('portalStatus.completedRide', 'Completed Ride')} · {b.date || t('common.today', 'Today')} · {b.appointment_time}
                                </span>
                                <h4 className="text-base font-bold text-neutral-900">
                                  {b.hospital_name}
                                </h4>
                                <p className="text-[11px] text-neutral-600">
                                  {b.clinic_department}
                                </p>
                              </div>
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
                                {t('portalStatus.arrivedSafe', 'Arrived & Safe')}
                              </span>
                            </div>

                            {/* Rating Component */}
                            <ServiceRatingCard booking={b} />

                            {/* Voluntary Transit Donation Button */}
                            <button
                              type="button"
                              onClick={() => setSelectedDonationBooking(b)}
                              className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 tap-target transition-all ${
                                b.donation
                                  ? 'border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                  : 'border border-neutral-200 bg-neutral-50 hover:bg-orange-50 hover:border-orange-200 text-neutral-700 hover:text-[#F37021]'
                              }`}
                            >
                              <HeartHandshake className="h-4 w-4 text-[#F37021]" />
                              {b.donation ? (
                                <span>
                                  {t('donation.donated', 'Donation Completed')}: <span className="font-mono font-extrabold text-emerald-950">RM {b.donation.amount.toFixed(2)}</span> ({b.donation.method === 'cash' ? t('donation.cashToDriver', 'Cash to Driver') : t('donation.qrDuitNow', 'DuitNow QR')})
                                </span>
                              ) : (
                                <span>{t('donation.button', 'Make a Transit Donation (Cash / QR)')}</span>
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Declined Bookings */}
                {declinedBookings.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                      {t('portalStatus.declinedRequests', 'Declined Requests')} ({declinedBookings.length})
                    </span>
                    {declinedBookings.map((b) => (
                      <div key={b.id} className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs">
                        <div className="flex items-center gap-2 text-red-800 font-bold mb-1">
                          <XCircle className="h-4 w-4" />
                          <span>{t('portalStatus.requestDeclinedFor', 'Request Declined for')} {b.appointment_time}</span>
                        </div>
                        <p className="text-red-700">
                          {t('portalStatus.declinedReason', 'Destination: {hospital}. Slot exceeded maximum accessible van capacity. Please choose another timetable window.').replace('{hospital}', b.hospital_name)}
                        </p>
                        <button
                          type="button"
                          onClick={() => setTransitTab('book')}
                          className="mt-2 text-xs font-bold text-red-900 underline"
                        >
                          {t('portalStatus.bookAnotherSlot', 'Book another slot')} &rarr;
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {userBookings.length === 0 && (
                  <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center space-y-3">
                    <Calendar className="mx-auto h-10 w-10 text-neutral-400" />
                    <h4 className="text-base font-bold text-neutral-900">
                      {t('portalStatus.noBookingsYet', 'No Transit Bookings Yet')}
                    </h4>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                      {t('portal.noBookingsDesc', "You haven't scheduled any hospital van trips. Switch to the 'Book a Service' tab to reserve your seat.")}
                    </p>
                    <button
                      type="button"
                      onClick={() => setTransitTab('book')}
                      className="px-5 py-2.5 rounded-xl bg-[#F37021] hover:bg-[#D9530F] text-white text-xs font-bold tap-target"
                    >
                      {t('portal.browseTimetable', 'Browse Timetable')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* ===================== MY EARNINGS TAB ======================== */}
        {/* ============================================================== */}
        {mainTab === 'earnings' && (
          <div className="space-y-5">
            {/* 4 Clean Stat Blocks with Vibrant Accents */}
            <div className="grid grid-cols-2 gap-3">
              {/* Today */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  {t('portal.todayIncome', "Today's Income")}
                </span>
                <p className="text-2xl font-black text-emerald-950 font-mono mt-1">
                  RM {artisanStats?.todayEarned.toFixed(2) || '0.00'}
                </p>
                <p className="text-[11px] font-semibold text-emerald-800 mt-0.5">
                  {artisanStats?.todayUnits || 0} {t('portal.cardsMade', 'cards made')}
                </p>
              </div>

              {/* This Week (Mon - Sun strictly) */}
              <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700">
                  {t('portal.thisWeekMonSun', 'A Week (Mon – Sun)')}
                </span>
                <p className="text-2xl font-black text-orange-950 font-mono mt-1">
                  RM {artisanStats?.weekEarned.toFixed(2) || '0.00'}
                </p>
                <p className="text-[11px] font-semibold text-orange-800 mt-0.5">
                  {artisanStats?.weekUnits || 0} {t('portal.cardsMade', 'cards made')}
                </p>
              </div>

              {/* This Month (Highlighted in bold brand orange / charcoal) */}
              <div className="rounded-2xl border-2 border-[#F37021] bg-[#18181B] text-white p-4 shadow-md">
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
                  {t('portal.thisMonth', 'Month-to-Date (MTD)')}
                </span>
                <p className="text-2xl font-black text-white font-mono mt-1">
                  RM {artisanStats?.monthEarned.toFixed(2) || '0.00'}
                </p>
                <p className="text-[11px] font-medium text-orange-200 mt-0.5">
                  {artisanStats?.monthUnits || 0} {t('portal.cardsProduced', 'cards produced')}
                </p>
              </div>

              {/* This Year */}
              <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                  {t('portal.thisYear', 'Year-to-Date (YTD)')}
                </span>
                <p className="text-2xl font-black text-purple-950 font-mono mt-1">
                  RM {artisanStats?.yearEarned.toFixed(2) || '0.00'}
                </p>
                <p className="text-[11px] font-semibold text-purple-800 mt-0.5">
                  {artisanStats?.yearUnits || 0} {t('portal.cardsProduced', 'cards produced')}
                </p>
              </div>
            </div>

            {/* Recent Activity List */}
            <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-bold text-neutral-900 pb-3 border-b border-neutral-100">
                {t('portal.recentHistory', 'Recent Production History')}
              </h3>
              <div className="divide-y divide-neutral-100 mt-2">
                {userRecentLogs.map((log) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-neutral-900">{log.card_name}</p>
                      <p className="text-[11px] text-neutral-500">
                        {log.logged_date} · {log.units_completed} {t('drawer.units', 'units')}
                      </p>
                    </div>
                    <span className="font-mono font-extrabold text-sm text-[#F37021]">
                      RM {log.total_earned.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Van Floor Plan Modal */}
      {modalSlot && (
        <VanFloorPlanModal
          isOpen={Boolean(modalSlot)}
          selectedTimeSlot={modalSlot.slot}
          selectedDay={modalSlot.day}
          existingBookingsForSlot={bookings.filter(b => b.appointment_time.toLowerCase().includes(modalSlot.slot.toLowerCase()))}
          onClose={() => setModalSlot(null)}
          onBookingSuccess={handleBookingSuccess}
        />
      )}

      {/* Voluntary Transit Donation Modal (Replaces Boarding Pass) */}
      {selectedDonationBooking && (
        <TransitDonationModal
          booking={selectedDonationBooking}
          onClose={() => setSelectedDonationBooking(null)}
        />
      )}

      {/* User Profile Modal */}
      {isProfileModalOpen && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          mode="edit_self"
        />
      )}
    </div>
  );
}
