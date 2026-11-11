'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { ArtisanDrawer } from '@/components/ArtisanDrawer';
import { AnalyticsCharts } from '@/components/AnalyticsCharts';
import { LinearStageIndicator } from '@/components/LinearStageIndicator';
import { 
  Car, 
  Sparkles, 
  BarChart3, 
  Search, 
  Download, 
  Check, 
  X, 
  Clock, 
  User, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Filter,
  Navigation,
  Star,
  MessageSquare,
  ShieldCheck,
  MapPin,
  Building2,
  Phone,
  AlertCircle,
  UserCheck,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Play,
  HeartHandshake,
  Banknote,
  QrCode,
  Receipt
} from 'lucide-react';
import { TransitBooking, ArtisanSummary, TransitStatus } from '@/types';

export default function AdminPage() {
  const { 
    bookings, 
    profiles, 
    products, 
    workLogs, 
    approveBooking, 
    declineBooking, 
    updateBookingStatus,
    getArtisanStats, 
    exportPayrollCSV,
    verifyDonation,
    exportDonationsCSV
  } = useApp();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'dispatch' | 'artisans' | 'analytics' | 'donations'>('dispatch');
  const [donationTimeRange, setDonationTimeRange] = useState<'1_week' | '1_month' | '1_year'>('1_month');
  const [donationMethodFilter, setDonationMethodFilter] = useState<'all' | 'qr' | 'cash'>('all');

  // Dispatch table filter tab
  const [dispatchFilter, setDispatchFilter] = useState<'all' | 'pending' | 'active' | 'completed'>('all');

  // Artisan search query and selected artisan drawer
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArtisanForDrawer, setSelectedArtisanForDrawer] = useState<ArtisanSummary | null>(null);

  // USER SPEC: Each record can be clicked to expand to see more details
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  // Active Dispatch interactive states & animation controls
  const [selectedActiveDispatchId, setSelectedActiveDispatchId] = useState<string | null>(null);
  const [animatingStatusKey, setAnimatingStatusKey] = useState<string | null>(null);
  const [statusFeedbackMsg, setStatusFeedbackMsg] = useState<string | null>(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState<boolean>(false);

  // Compute metrics for Dispatch
  const totalBookingsCount = bookings.length;
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const inTransitCount = bookings.filter(b => 
    ['approved', 'en_route_pickup', 'picked_up', 'en_route_hospital'].includes(b.status)
  ).length;
  const completedCount = bookings.filter(b => 
    ['dropped_off', 'en_route_next'].includes(b.status)
  ).length;

  // Voluntary Transit Donations metrics for Supervisor Audit
  const donatedBookings = useMemo(() => bookings.filter(b => Boolean(b.donation)), [bookings]);
  const totalDonationsAmount = useMemo(() => donatedBookings.reduce((sum, b) => sum + (b.donation?.amount || 0), 0), [donatedBookings]);
  const donationsCount = donatedBookings.length;

  // Simulated base date (11 Nov 2026) for deterministic hydration and prerendering
  const SIMULATED_BASELINE_MS = new Date('2026-11-11T12:00:00+08:00').getTime();

  // Helper to test if a donation falls within the time range: 1 week (7d), 1 month (30d), 1 year (365d)
  const isWithinTimeRange = (dateStr?: string, range: '1_week' | '1_month' | '1_year' = '1_month') => {
    if (!dateStr) return true;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;
    const diffDays = (SIMULATED_BASELINE_MS - d.getTime()) / (1000 * 60 * 60 * 24);

    if (range === '1_week') return diffDays <= 7;
    if (range === '1_month') return diffDays <= 30;
    if (range === '1_year') return diffDays <= 365;
    return true;
  };

  // 1. PRIORITIZE: Donation in a Month
  const monthDonations = useMemo(() => {
    return donatedBookings.filter(b => isWithinTimeRange(b.donation?.timestamp, '1_month'));
  }, [donatedBookings]);
  const monthTotal = useMemo(() => monthDonations.reduce((sum, b) => sum + (b.donation?.amount || 0), 0), [monthDonations]);
  const monthCount = monthDonations.length;

  // 2. PRIORITIZE: Donation via QR (within selected time filter)
  const qrDonations = useMemo(() => {
    return donatedBookings.filter(b => b.donation?.method === 'qr' && isWithinTimeRange(b.donation?.timestamp, donationTimeRange));
  }, [donatedBookings, donationTimeRange]);
  const qrTotal = useMemo(() => qrDonations.reduce((sum, b) => sum + (b.donation?.amount || 0), 0), [qrDonations]);

  // 3. PRIORITIZE: Donation via Driver (Cash) (within selected time filter)
  const cashDonations = useMemo(() => {
    return donatedBookings.filter(b => b.donation?.method === 'cash' && isWithinTimeRange(b.donation?.timestamp, donationTimeRange));
  }, [donatedBookings, donationTimeRange]);
  const cashTotal = useMemo(() => cashDonations.reduce((sum, b) => sum + (b.donation?.amount || 0), 0), [cashDonations]);

  // Filtered donations for Donation Audit Ledger (Pending remittance & Reconciled removed)
  const filteredDonations = useMemo(() => {
    return donatedBookings.filter(b => {
      // 1. Time range filter (1 Week, 1 Month, 1 Year)
      if (!isWithinTimeRange(b.donation?.timestamp, donationTimeRange)) return false;
      // 2. Method filter (All, QR, Cash)
      if (donationMethodFilter === 'qr') return b.donation?.method === 'qr';
      if (donationMethodFilter === 'cash') return b.donation?.method === 'cash';
      return true;
    });
  }, [donatedBookings, donationTimeRange, donationMethodFilter]);

  // Active trips available for dispatch focus
  const activeDispatchesList = useMemo(() => {
    return bookings.filter(b => b.status !== 'declined');
  }, [bookings]);

  // PRIORITY CURRENT DISPATCH:
  // Find selected active dispatch or currently on road or highest priority approved ride
  const currentActiveDispatch = useMemo(() => {
    if (selectedActiveDispatchId) {
      const found = bookings.find(b => b.id === selectedActiveDispatchId);
      if (found) return found;
    }
    return bookings.find(b => 
      ['en_route_pickup', 'picked_up', 'en_route_hospital'].includes(b.status)
    ) || bookings.find(b => b.status === 'approved') || bookings[0];
  }, [bookings, selectedActiveDispatchId]);

  // Handler to switch status with soundless tactile visual animation
  const handleUpdateActiveDispatchStatus = (bookingId: string, newStatus: TransitStatus) => {
    updateBookingStatus(bookingId, newStatus);
    setAnimatingStatusKey(newStatus);
    setShowStatusDropdown(false);
    setStatusFeedbackMsg(`Status switched to: ${newStatus.replace(/_/g, ' ')}`);
    
    // Clear animation key after completion
    setTimeout(() => {
      setAnimatingStatusKey(null);
    }, 700);
    setTimeout(() => {
      setStatusFeedbackMsg(null);
    }, 3500);
  };

  // Helper for sequential status progression
  const getNextStatusAction = (status: TransitStatus): { nextStatus: TransitStatus | null; label: string } => {
    switch (status) {
      case 'pending':
        return { nextStatus: 'approved', label: 'Approve & Schedule' };
      case 'approved':
        return { nextStatus: 'en_route_pickup', label: 'Depart for Pickup' };
      case 'en_route_pickup':
        return { nextStatus: 'picked_up', label: 'Confirm Picked Up' };
      case 'picked_up':
        return { nextStatus: 'en_route_hospital', label: 'Depart for Hospital' };
      case 'en_route_hospital':
        return { nextStatus: 'dropped_off', label: 'Confirm Dropped Off' };
      case 'dropped_off':
      case 'en_route_next':
      default:
        return { nextStatus: null, label: 'Trip Completed' };
    }
  };

  const getStagePercentage = (status: TransitStatus): number => {
    switch (status) {
      case 'pending':
      case 'approved':
        return 0;
      case 'en_route_pickup':
        return 25;
      case 'picked_up':
        return 50;
      case 'en_route_hospital':
        return 75;
      case 'dropped_off':
      case 'en_route_next':
        return 100;
      default:
        return 0;
    }
  };

  // Filtered dispatch bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (dispatchFilter === 'pending') return b.status === 'pending';
      if (dispatchFilter === 'active') return ['approved', 'en_route_pickup', 'picked_up', 'en_route_hospital'].includes(b.status);
      if (dispatchFilter === 'completed') return ['dropped_off', 'en_route_next'].includes(b.status);
      return true;
    });
  }, [bookings, dispatchFilter]);

  // Registered artisans (customers)
  const registeredArtisans = useMemo(() => {
    const customerProfiles = profiles.filter(p => p.role === 'customer');
    return customerProfiles.map(p => getArtisanStats(p.id));
  }, [profiles, getArtisanStats]);

  // Filtered artisans based on search
  const filteredArtisans = useMemo(() => {
    if (!searchQuery.trim()) return registeredArtisans;
    const q = searchQuery.toLowerCase();
    return registeredArtisans.filter(a => 
      a.profile.full_name.toLowerCase().includes(q) ||
      a.profile.ic_or_oku_number.toLowerCase().includes(q) ||
      a.profile.phone.includes(q)
    );
  }, [registeredArtisans, searchQuery]);

  // KPI Summary for Analytics
  const totalCardsMonth = workLogs
    .filter(l => l.logged_date.startsWith('2026-11'))
    .reduce((sum, l) => sum + l.units_completed, 0);

  const totalCardsYear = workLogs
    .reduce((sum, l) => sum + l.units_completed, 0);

  const totalWagesDisbursed = workLogs
    .reduce((sum, l) => sum + l.total_earned, 0);

  const activeArtisansCount = registeredArtisans.filter(a => a.monthUnits > 0).length;

  // Format timestamp to hh:mm am/pm or dash
  const formatTimestampTime = (isoString?: string): string => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '—';
    }
  };

  // Format booking date to clean display (e.g. 10 Nov 2026)
  const formatBookingDate = (dateStr?: string): string => {
    if (!dateStr) return '10 Nov 2026';
    const parts = dateStr.split(',');
    if (parts.length >= 2) {
      return parts.slice(1).join(' ').trim();
    }
    return dateStr;
  };

  // Helper to format last action time
  const formatLastAction = (b: TransitBooking): string => {
    const ts = b.timestamps;
    if (b.status === 'en_route_next' && ts.en_route_next) {
      return `Next Pax · ${new Date(ts.en_route_next).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (b.status === 'dropped_off' && ts.dropped_off) {
      return `Arrived · ${new Date(ts.dropped_off).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (b.status === 'en_route_hospital' && ts.en_route_hospital) {
      return `Heading Dest · ${new Date(ts.en_route_hospital).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (b.status === 'picked_up' && ts.picked_up) {
      return `Picked Up · ${new Date(ts.picked_up).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (b.status === 'en_route_pickup' && ts.en_route_pickup) {
      return `En Route Pickup · ${new Date(ts.en_route_pickup).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (b.status === 'approved' && ts.approved) {
      return `Approved · ${new Date(ts.approved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (ts.requested) {
      return `Requested · ${new Date(ts.requested).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return 'Pending';
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-neutral-900 pb-24">
      {/* Top Banner Navigation */}
      <div className="bg-gradient-to-r from-neutral-950 via-stone-900 to-orange-950 text-white shadow-md">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#F37021]">
                  {t('admin.title', 'Supervisor Control Tower')}
                </span>
                <span className="inline-flex items-center rounded-full bg-[#F37021] text-white font-black px-2.5 py-0.5 text-xs shadow-xs">
                  {t('common.verified', 'Admin Dispatch Active')}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
                Beautiful Gate Operations
              </h1>
            </div>

            {/* Top-Level Navigation Bar */}
            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
              <div className="flex rounded-full bg-white/10 p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab('dispatch')}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all tap-target ${
                    activeTab === 'dispatch'
                      ? 'bg-[#F37021] text-white font-black shadow-sm'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  <Car className="h-4 w-4" />
                  {t('admin.tabDispatch', 'Transit Dispatch')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('artisans')}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all tap-target ${
                    activeTab === 'artisans'
                      ? 'bg-[#F37021] text-white font-black shadow-sm'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  {t('admin.tabArtisans', 'Artisans & Workshop')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('analytics')}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all tap-target ${
                    activeTab === 'analytics'
                      ? 'bg-[#F37021] text-white font-black shadow-sm'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  {t('admin.tabAnalytics', 'Analytics')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('donations')}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all tap-target ${
                    activeTab === 'donations'
                      ? 'bg-[#F37021] text-white font-black shadow-sm'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  <HeartHandshake className="h-4 w-4" />
                  {t('admin.tabDonations', 'Donation Tracker')}
                  {donationsCount > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                      activeTab === 'donations' ? 'bg-white text-[#F37021]' : 'bg-white/20 text-white'
                    }`}>
                      {donationsCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 space-y-6">
        {/* ============================================================== */}
        {/* ================== SECTION A: TRANSIT DISPATCH ================ */}
        {/* ============================================================== */}
        {activeTab === 'dispatch' && (
          <div className="space-y-6">
            {/* ============================================================== */}
            {/* MINIMALIST CURRENT ACTIVE DISPATCH HERO CARD                   */}
            {/* PRIORITIZES: NAME, PHONE, TIME, PICKUP, DESTINATION, STATUS   */}
            {/* ============================================================== */}
            {currentActiveDispatch && (
              <div 
                key={currentActiveDispatch.id}
                className="rounded-3xl border border-neutral-800 bg-[#18181B] text-white p-6 sm:p-7 shadow-xl space-y-6"
              >
                {/* 1. Minimal Header: Active Indicator, Time & Interactive Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F37021] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F37021]" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                      {t('admin.activeDispatchTitle', 'Active Dispatch')}
                    </span>
                    <span className="font-mono text-xs font-extrabold bg-white/10 text-orange-200 border border-white/10 px-2.5 py-0.5 rounded-lg">
                      {currentActiveDispatch.appointment_time}
                    </span>

                    {/* Multi-Ride Switcher (Clean & Minimalist) */}
                    {activeDispatchesList.length > 1 && (
                      <div className="hidden md:flex items-center gap-1 pl-2 border-l border-white/10">
                        {activeDispatchesList.slice(0, 3).map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => setSelectedActiveDispatchId(b.id)}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all tap-target ${
                              currentActiveDispatch.id === b.id
                                ? 'bg-white/20 text-white font-extrabold'
                                : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            {b.passenger_name.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Interactive Status Button with Animation */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        const action = getNextStatusAction(currentActiveDispatch.status);
                        if (action.nextStatus) {
                          handleUpdateActiveDispatchStatus(currentActiveDispatch.id, action.nextStatus);
                        } else {
                          handleUpdateActiveDispatchStatus(currentActiveDispatch.id, 'approved');
                        }
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 tap-target active:scale-95 shadow-sm ${
                        animatingStatusKey ? 'animate-status-switch scale-105' : ''
                      } ${
                        currentActiveDispatch.status === 'dropped_off' || currentActiveDispatch.status === 'en_route_next'
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                          : 'bg-[#F37021] text-white hover:bg-[#D9530F]'
                      }`}
                      title="Click to advance status"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      <span key={currentActiveDispatch.status} className="animate-in fade-in duration-200">
                        {currentActiveDispatch.status.replace(/_/g, ' ')}
                      </span>
                      <ArrowRight className="h-3 w-3 opacity-80" />
                    </button>
                  </div>
                </div>

                {/* 2. Core Passenger & Route Info (Clear, High Contrast, Large SF Pro Typography) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* Passenger Name & Contact */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                      {t('admin.passengerName', 'Passenger')}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                      {currentActiveDispatch.passenger_name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <a
                          href={`tel:${currentActiveDispatch.phone}`}
                          className="font-mono font-bold text-white hover:text-[#F37021] transition-colors"
                        >
                          {currentActiveDispatch.phone}
                        </a>
                      </div>

                      {currentActiveDispatch.donation && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                          <HeartHandshake className="h-3.5 w-3.5 text-emerald-400" />
                          <span>
                            RM {currentActiveDispatch.donation.amount.toFixed(2)} ({currentActiveDispatch.donation.method === 'cash' ? t('donation.cashToDriver', 'Cash to Driver') : t('donation.qrDuitNow', 'DuitNow QR')})
                          </span>
                          {currentActiveDispatch.donation.method === 'cash' && currentActiveDispatch.donation.status === 'pledged' && (
                            <span className="text-[10px] text-amber-300 font-semibold bg-amber-500/30 px-1.5 py-0.2 rounded ml-0.5">
                              {t('admin.awaitingCashHandover', 'Pending Remittance')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Route: Pickup & Destination (Minimalist 2-Point Line) */}
                  <div className="space-y-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 mt-1 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                          {t('adminTable.pickupAddress', 'Pickup Address')}
                        </span>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentActiveDispatch.pickup_address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-white hover:text-[#F37021] leading-snug block"
                        >
                          {currentActiveDispatch.pickup_address}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="h-2 w-2 rounded-full bg-[#F37021] mt-1 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                          {t('adminTable.destination', 'Destination')}
                        </span>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentActiveDispatch.hospital_name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-white hover:text-[#F37021] leading-snug block"
                        >
                          {currentActiveDispatch.hospital_name}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Minimalist Interactive Status Stepper (5 Interactive Dots) */}
                <div className="pt-2">
                  <div className="relative flex items-center justify-between">
                    {/* Background Track Line */}
                    <div className="absolute left-3 right-3 top-2.5 h-0.5 bg-white/15" aria-hidden="true">
                      {/* Animated Active Progress Line */}
                      <div
                        className="h-full bg-[#F37021] transition-all duration-500 ease-out"
                        style={{ width: `${getStagePercentage(currentActiveDispatch.status)}%` }}
                      />
                    </div>

                    {/* 5 Minimalist Stage Checkpoints */}
                    {[
                      { status: 'approved' as TransitStatus, label: t('admin.approved', 'Approved'), stepIdx: 0 },
                      { status: 'en_route_pickup' as TransitStatus, label: t('portal.stage1', 'To Pickup'), stepIdx: 1 },
                      { status: 'picked_up' as TransitStatus, label: t('portal.stage2', 'Picked Up'), stepIdx: 2 },
                      { status: 'en_route_hospital' as TransitStatus, label: t('portal.stage3', 'To Hospital'), stepIdx: 3 },
                      { status: 'dropped_off' as TransitStatus, label: t('portal.stage4', 'Arrived'), stepIdx: 4 },
                    ].map((step) => {
                      const stepPct = step.stepIdx * 25;
                      const currentPct = getStagePercentage(currentActiveDispatch.status);
                      const isCurrent = currentActiveDispatch.status === step.status || (step.status === 'approved' && currentActiveDispatch.status === 'pending');
                      const isPassed = currentPct > stepPct;

                      return (
                        <div key={step.status} className="flex flex-col items-center text-center z-10">
                          {/* Minimalist Interactive Dot Button */}
                          <button
                            type="button"
                            onClick={() => handleUpdateActiveDispatchStatus(currentActiveDispatch.id, step.status)}
                            className={`flex h-5 w-5 items-center justify-center rounded-full transition-all duration-300 tap-target ${
                              isCurrent
                                ? 'bg-[#F37021] ring-4 ring-[#F37021]/40 scale-125 shadow-md animate-status-switch'
                                : isPassed
                                ? 'bg-emerald-500 text-white'
                                : 'bg-neutral-800 border-2 border-neutral-600 hover:border-white'
                            }`}
                            title={`Set status to ${step.label}`}
                          >
                            {isPassed && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                            {isCurrent && <span className="h-2 w-2 rounded-full bg-white animate-pulse" />}
                          </button>

                          {/* Minimal Label */}
                          <span className={`text-[10px] font-bold mt-2 transition-colors ${
                            isCurrent
                              ? 'text-[#F37021] font-black'
                              : isPassed
                              ? 'text-emerald-400'
                              : 'text-neutral-500'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Metric Counters */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                  {t('admin.todayTransits', 'Total Bookings')}
                </span>
                <p className="text-2xl font-black text-neutral-900 mt-1 font-mono">
                  {totalBookingsCount}
                </p>
              </div>

              <div className="rounded-2xl border-2 border-yellow-300 bg-yellow-50/70 p-4 shadow-xs">
                <span className="text-[10px] font-bold text-yellow-800 uppercase tracking-wider">
                  {t('adminTable.pendingAction', 'Pending Action')}
                </span>
                <p className="text-2xl font-black text-yellow-950 mt-1 font-mono">
                  {pendingCount}
                </p>
              </div>

              <div className="rounded-2xl border-2 border-orange-400 bg-orange-50/80 p-4 shadow-xs">
                <span className="text-[10px] font-bold text-orange-950 uppercase tracking-wider">
                  {t('adminTable.inTransit', 'In Transit')}
                </span>
                <p className="text-2xl font-black text-orange-950 mt-1 font-mono">
                  {inTransitCount}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-xs">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  {t('adminTable.completedAndArrived', 'Completed & Arrived')}
                </span>
                <p className="text-2xl font-black text-emerald-950 mt-1 font-mono">
                  {completedCount}
                </p>
              </div>

              <div 
                onClick={() => setActiveTab('donations')}
                className="rounded-2xl border-2 border-[#F37021] bg-gradient-to-br from-orange-50 to-amber-50 p-4 shadow-xs cursor-pointer hover:shadow-md transition-all group col-span-2 lg:col-span-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-orange-950 uppercase tracking-wider flex items-center gap-1">
                    <HeartHandshake className="h-3.5 w-3.5 text-[#F37021]" />
                    {t('admin.tabDonations', 'Donation Tracker')}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-2xl font-black text-[#D9530F] mt-1 font-mono">
                  RM {totalDonationsAmount.toFixed(2)}
                </p>
                <p className="text-[10px] font-semibold text-neutral-600 mt-0.5 truncate">
                  {donationsCount} {t('admin.contributions', 'contributions')} ({cashDonations.length} {t('donation.cashToDriver', 'Cash')}, {qrDonations.length} QR)
                </p>
              </div>
            </div>

            {/* 2. Dispatch Table with Filter Tabs and Beneficiary Ratings */}
            <div className="rounded-3xl border border-neutral-200 bg-white shadow-xs overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-neutral-200 gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-neutral-900 tracking-tight">
                    {t('admin.tabDispatch', 'Transit Dispatch Board')}
                  </h3>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center rounded-xl bg-neutral-100 p-1 border border-neutral-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setDispatchFilter('all')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all tap-target ${
                      dispatchFilter === 'all'
                        ? 'bg-[#F37021] text-white shadow-xs font-black'
                        : 'text-neutral-600 hover:text-black'
                    }`}
                  >
                    {t('adminTable.all', 'All')} ({totalBookingsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDispatchFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all tap-target ${
                      dispatchFilter === 'pending'
                        ? 'bg-yellow-400 text-yellow-950 font-black shadow-xs'
                        : 'text-neutral-600 hover:text-black'
                    }`}
                  >
                    {t('adminTable.pending', 'Pending')} ({pendingCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDispatchFilter('active')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all tap-target ${
                      dispatchFilter === 'active'
                        ? 'bg-[#F37021] text-white shadow-xs font-black'
                        : 'text-neutral-600 hover:text-black'
                    }`}
                  >
                    {t('adminTable.active', 'Active')} ({inTransitCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDispatchFilter('completed')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all tap-target ${
                      dispatchFilter === 'completed'
                        ? 'bg-emerald-600 text-white shadow-xs font-black'
                        : 'text-neutral-600 hover:text-black'
                    }`}
                  >
                    {t('adminTable.completed', 'Completed')} ({completedCount})
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-600 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3.5 px-4">{t('admin.timeSlot', 'Time Slot')}</th>
                      <th className="py-3.5 px-4">{t('admin.date', 'Date')}</th>
                      <th className="py-3.5 px-4">{t('admin.name', 'Name')}</th>
                      <th className="py-3.5 px-4">{t('admin.timePickup', 'Time Pickup')}</th>
                      <th className="py-3.5 px-4">{t('admin.timeDropOff', 'Time Drop Off')}</th>
                      <th className="py-3.5 px-4 text-right">{t('admin.action', 'Approval Action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white">
                    {filteredBookings.map((b) => {
                      const isPending = b.status === 'pending';
                      const isExpanded = expandedBookingId === b.id;
                      const timePickup = formatTimestampTime(b.timestamps.picked_up);
                      const timeDropOff = formatTimestampTime(b.timestamps.dropped_off);
                      const formattedDate = formatBookingDate(b.date);

                      return (
                        <React.Fragment key={b.id}>
                          <tr
                            onClick={() => setExpandedBookingId(isExpanded ? null : b.id)}
                            className={`cursor-pointer transition-colors tap-target ${
                              isExpanded
                                ? 'bg-orange-50/70'
                                : 'hover:bg-neutral-50/80'
                            }`}
                          >
                            {/* 1. Time Slot */}
                            <td className="py-4 px-4 font-mono font-bold text-neutral-950 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-[#F37021] shrink-0 stroke-[2.5]" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-neutral-400 shrink-0 stroke-[2.5]" />
                                )}
                                <span>{b.appointment_time}</span>
                              </div>
                            </td>

                            {/* 2. Date */}
                            <td className="py-4 px-4 font-semibold text-neutral-700 whitespace-nowrap">
                              {formattedDate}
                            </td>

                            {/* 3. Name */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-neutral-900">{b.passenger_name}</span>
                                {b.donation && (
                                  <span
                                    title={`Donation: RM ${b.donation.amount.toFixed(2)} via ${b.donation.method === 'cash' ? t('donation.cashToDriver', 'Cash to Driver') : t('donation.qrDuitNow', 'DuitNow QR')}`}
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                      b.donation.status === 'paid'
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                                    }`}
                                  >
                                    <HeartHandshake className="h-3 w-3 text-[#F37021]" />
                                    RM {b.donation.amount.toFixed(0)}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* 4. Time Pickup */}
                            <td className="py-4 px-4 font-mono font-semibold text-neutral-700 whitespace-nowrap">
                              {timePickup}
                            </td>

                            {/* 5. Time Drop Off */}
                            <td className="py-4 px-4 font-mono font-semibold text-neutral-700 whitespace-nowrap">
                              {timeDropOff}
                            </td>

                            {/* 6. Approval Action */}
                            <td className="py-4 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              {isPending ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => approveBooking(b.id)}
                                    className="px-3.5 py-1.5 rounded-xl bg-[#F37021] hover:bg-[#D9530F] text-white font-black text-xs flex items-center gap-1 shadow-sm tap-target transition-all active:scale-95"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                    {t('admin.approve', 'Approve')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => declineBooking(b.id)}
                                    className="px-2.5 py-1.5 rounded-xl border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-100 font-bold text-xs tap-target transition-all active:scale-95"
                                    title={t('admin.decline', 'Decline')}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  b.status === 'approved'
                                    ? 'bg-orange-100 text-orange-950 border border-orange-300'
                                    : b.status === 'en_route_pickup' || b.status === 'picked_up' || b.status === 'en_route_hospital'
                                    ? 'bg-[#F37021] text-white'
                                    : b.status === 'dropped_off' || b.status === 'en_route_next'
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                    : 'bg-red-100 text-red-900'
                                }`}>
                                  {b.status.replace(/_/g, ' ')}
                                </span>
                              )}
                            </td>
                          </tr>

                          {/* EXPANDED RECORD DETAILS */}
                          {isExpanded && (
                            <tr className="bg-neutral-50/80">
                              <td colSpan={6} className="p-4 sm:p-5 border-t border-neutral-200">
                                <div className="rounded-2xl border border-neutral-200 bg-white p-4 space-y-3.5 shadow-xs">
                                  <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100">
                                    <span className="text-xs font-black uppercase tracking-wider text-neutral-900">
                                      {t('adminTable.bookingManifestDetails', 'Booking Manifest Details')} · {b.id}
                                    </span>
                                    <span className="font-mono text-xs font-bold text-neutral-500">
                                      OKU: {b.oku_id}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                                    {/* Pickup & Destination */}
                                    <div className="space-y-2.5">
                                      <div>
                                        <span className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider flex items-center gap-1">
                                          <MapPin className="h-3.5 w-3.5" />
                                          {t('adminTable.pickupAddress', 'Pickup Address')}
                                        </span>
                                        <p className="font-bold text-neutral-900 mt-0.5 leading-snug">
                                          {b.pickup_address}
                                        </p>
                                      </div>

                                      <div className="pt-2 border-t border-neutral-100">
                                        <span className="text-[10px] font-extrabold uppercase text-orange-950 tracking-wider flex items-center gap-1">
                                          <Building2 className="h-3.5 w-3.5 text-[#F37021]" />
                                          {t('adminTable.destination', 'Destination')}
                                        </span>
                                        <p className="font-bold text-neutral-900 mt-0.5 leading-snug">
                                          {b.hospital_name}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Contact & Seats */}
                                    <div className="space-y-2.5">
                                      <div>
                                        <span className="text-[10px] font-extrabold uppercase text-neutral-500 tracking-wider">
                                          {t('adminTable.contactPhone', 'Contact Phone')}
                                        </span>
                                        <p className="font-mono font-bold text-neutral-900 mt-0.5">
                                          {b.phone}
                                        </p>
                                      </div>

                                      <div className="pt-2 border-t border-neutral-100">
                                        <span className="text-[10px] font-extrabold uppercase text-neutral-500 tracking-wider">
                                          {t('adminTable.allocatedSpace', 'Allocated Seat(s)')}
                                        </span>
                                        <p className="font-mono font-bold text-orange-950 mt-0.5 bg-orange-50 px-2 py-0.5 rounded border border-orange-200 inline-block">
                                          {b.assigned_space}
                                        </p>
                                      </div>

                                      <div className="pt-2 border-t border-neutral-100">
                                        <span className="text-[10px] font-extrabold uppercase text-neutral-500 tracking-wider">
                                          {t('adminTable.mobilityProfile', 'Mobility Profile')}
                                        </span>
                                        <p className="font-bold text-neutral-800 mt-0.5">
                                          {b.mobility_type}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Timestamps, Operator & Rating */}
                                    <div className="space-y-2.5">
                                      <div>
                                        <span className="text-[10px] font-extrabold uppercase text-neutral-500 tracking-wider">
                                          {t('pass.assignedVehicle', 'Assigned Operator & Van')}
                                        </span>
                                        <p className="font-bold text-neutral-900 mt-0.5">
                                          {b.assigned_driver} · <span className="font-mono font-bold">{b.assigned_vehicle.plate}</span>
                                        </p>
                                      </div>

                                      {/* Passenger Rating if available */}
                                      {b.rating && (
                                        <div className="pt-2 border-t border-neutral-100 space-y-1">
                                          <span className="text-[10px] font-extrabold uppercase text-amber-700 tracking-wider block">
                                            {t('adminTable.beneficiaryRating', 'Beneficiary Service Rating')}
                                          </span>
                                          <div className="flex items-center gap-1 text-amber-500">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                              <Star
                                                key={s}
                                                className={`h-3 w-3 ${
                                                  s <= b.rating! ? 'fill-amber-400 text-amber-500' : 'text-neutral-300'
                                                }`}
                                              />
                                            ))}
                                            <span className="text-xs font-black text-neutral-900 ml-1">
                                              {b.rating}/5
                                            </span>
                                          </div>
                                          {b.feedback && (
                                            <p className="text-[11px] text-neutral-600 italic leading-snug">
                                              &quot;{b.feedback}&quot;
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    {/* Voluntary Transit Donation Tracking & Cash Reconciliation */}
                                    <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-3 space-y-2.5">
                                      <div className="flex items-center justify-between pb-1.5 border-b border-neutral-200">
                                        <span className="text-[10px] font-extrabold uppercase text-neutral-600 tracking-wider flex items-center gap-1">
                                          <HeartHandshake className="h-3.5 w-3.5 text-[#F37021]" />
                                          {t('admin.transitDonation', 'Transit Donation')}
                                        </span>
                                        {b.donation ? (
                                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            b.donation.status === 'paid'
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : 'bg-amber-100 text-amber-800'
                                          }`}>
                                            {b.donation.status === 'paid'
                                              ? (b.donation.method === 'cash' ? t('admin.cashReconciled', 'Cash Reconciled') : t('donation.donated', 'Paid'))
                                              : t('admin.awaitingCashHandover', 'Pending Remittance')}
                                          </span>
                                        ) : (
                                          <span className="text-[10px] text-neutral-400">
                                            {t('admin.noDonation', 'No Donation')}
                                          </span>
                                        )}
                                      </div>

                                      {b.donation ? (
                                        <div className="space-y-2">
                                          <div className="flex items-baseline justify-between">
                                            <span className="font-mono text-base font-black text-neutral-900">
                                              RM {b.donation.amount.toFixed(2)}
                                            </span>
                                            <span className="text-[11px] font-bold text-neutral-600">
                                              {b.donation.method === 'cash' ? t('donation.cashOption', 'Pay Cash to Driver') : t('donation.qrOption', 'DuitNow QR')}
                                            </span>
                                          </div>
                                          <p className="text-[10px] text-neutral-500">
                                            Ref: <span className="font-mono font-bold">BG-TR-{b.id.toUpperCase()}</span>
                                          </p>

                                          {/* Supervisor Action to Reconcile Driver Cash Remittance */}
                                          {b.donation.method === 'cash' && b.donation.status === 'pledged' ? (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                verifyDonation(b.id);
                                              }}
                                              className="w-full mt-1.5 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-xs tap-target transition-all active:scale-95"
                                            >
                                              <CheckCircle2 className="h-3.5 w-3.5" />
                                              {t('admin.verifyCashHandover', 'Verify Cash Reconciled')}
                                            </button>
                                          ) : (
                                            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold pt-1">
                                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                                              <span>{b.donation.method === 'cash' ? t('admin.cashReconciled', 'Cash Reconciled') : t('donation.donated', 'Paid via DuitNow QR')}</span>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <p className="text-[11px] text-neutral-500 italic">
                                          {t('admin.noDonationPledged', 'Passenger did not submit a voluntary donation for this trip.')}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ================ SECTION B: ARTISANS & WORKSHOP ============= */}
        {/* ============================================================== */}
        {activeTab === 'artisans' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black tracking-tight text-neutral-900">
                  {t('adminTable.registeredArtisans', 'Registered OKU Artisans')}
                </h2>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('adminTable.searchArtisans', 'Search by name, OKU ID...')}
                  className="apple-input w-full pl-10 text-xs"
                />
              </div>
            </div>

            {/* Artisans Table */}
            <div className="rounded-3xl border border-neutral-200 bg-white shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-600 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3.5 px-5">{t('adminTable.artisanBeneficiary', 'Artisan Beneficiary')}</th>
                      <th className="py-3.5 px-5">{t('adminTable.okuNumber', 'OKU Number')}</th>
                      <th className="py-3.5 px-5">{t('adminTable.mobilityProfile', 'Mobility Profile')}</th>
                      <th className="py-3.5 px-5">{t('adminTable.cardsMtd', 'Cards (MTD)')}</th>
                      <th className="py-3.5 px-5">{t('adminTable.mtdEarnings', 'Month-to-Date Earnings')}</th>
                      <th className="py-3.5 px-5">{t('adminTable.ytdEarnings', 'Year-to-Date Earnings')}</th>
                      <th className="py-3.5 px-5 text-right">{t('adminTable.actionCol', 'Action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white">
                    {filteredArtisans.map((artisan) => (
                      <tr
                        key={artisan.profile.id}
                        onClick={() => setSelectedArtisanForDrawer(artisan)}
                        className="hover:bg-orange-50/50 cursor-pointer transition-colors"
                      >
                        <td className="py-4 px-5">
                          <p className="font-extrabold text-neutral-900 text-sm">
                            {artisan.profile.full_name}
                          </p>
                          <p className="text-[11px] text-neutral-500 font-mono">
                            {artisan.profile.phone}
                          </p>
                        </td>

                        <td className="py-4 px-5 font-mono text-neutral-700 font-bold">
                          {artisan.profile.ic_or_oku_number}
                        </td>

                        <td className="py-4 px-5">
                          <span className="rounded-md bg-neutral-100 border border-neutral-200 px-2.5 py-1 text-[11px] font-bold text-neutral-800">
                            {artisan.profile.mobility_type}
                          </span>
                        </td>

                        <td className="py-4 px-5 font-bold text-neutral-900 text-sm">
                          {artisan.monthUnits} {t('drawer.cards', 'cards')}
                        </td>

                        <td className="py-4 px-5 font-mono font-black text-sm text-emerald-800">
                          RM {artisan.monthEarned.toFixed(2)}
                        </td>

                        <td className="py-4 px-5 font-mono text-neutral-600">
                          RM {artisan.yearEarned.toFixed(2)}
                        </td>

                        <td className="py-4 px-5 text-right">
                          <button
                            type="button"
                            className="inline-flex items-center text-xs font-bold text-[#F37021] hover:text-[#D9530F] gap-1 tap-target"
                          >
                            <span>{t('adminTable.ledgerAndBank', 'Ledger & Bank')}</span>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ================== SECTION C: ANALYTICS HUB ================== */}
        {/* ============================================================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-neutral-200 gap-4">
              <div>
                <h2 className="text-xl font-black tracking-tight text-neutral-900">
                  {t('adminTable.productionAnalytics', 'Production & Disbursement Analytics')}
                </h2>
              </div>

              {/* Export Control */}
              <button
                type="button"
                onClick={exportPayrollCSV}
                className="px-5 py-2.5 rounded-2xl bg-[#F37021] hover:bg-[#D9530F] text-white font-extrabold text-xs flex items-center gap-2 shadow-md tap-target"
              >
                <Download className="h-4 w-4" />
                {t('admin.exportPayroll', 'Export Payroll CSV')}
              </button>
            </div>

            {/* KPI Summary 4 Blocks */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  {t('adminTable.cardsProducedMonth', 'Cards Produced (Month)')}
                </p>
                <p className="text-3xl font-black text-neutral-900 mt-2 font-mono">
                  {totalCardsMonth}
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  {t('adminTable.cardsProducedYear', 'Cards Produced (YTD)')}
                </p>
                <p className="text-3xl font-black text-neutral-900 mt-2 font-mono">
                  {totalCardsYear}
                </p>
              </div>

              <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-5 shadow-sm">
                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  {t('adminTable.totalWagesDisbursed', 'Total Wages Disbursed')}
                </p>
                <p className="text-3xl font-black text-emerald-950 mt-2 font-mono">
                  RM {totalWagesDisbursed.toFixed(2)}
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  {t('adminTable.activeArtisans', 'Active Artisans')}
                </p>
                <p className="text-3xl font-black text-neutral-900 mt-2 font-mono">
                  {activeArtisansCount}
                </p>
              </div>
            </div>

            {/* Charts & Distribution Section */}
            <AnalyticsCharts
              workLogs={workLogs}
              products={products}
              profiles={profiles}
            />
          </div>
        )}

        {/* ============================================================== */}
        {/* ================ SECTION D: DONATION TRACKER ================ */}
        {/* ============================================================== */}
        {activeTab === 'donations' && (
          <div className="space-y-6">
            {/* Header & Export CSV */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-orange-500 to-[#D9530F] text-white flex items-center justify-center shadow-sm">
                  <HeartHandshake className="h-4 w-4" />
                </div>
                <h2 className="text-xl font-black tracking-tight text-neutral-900">
                  {t('admin.donationTrackerTitle', 'Voluntary Transit Donations & Fuel Subsidy Tracker')}
                </h2>
              </div>

              <button
                type="button"
                onClick={exportDonationsCSV}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F37021] hover:bg-[#D9530F] text-white text-xs font-bold shadow-sm tap-target transition-all active:scale-95"
              >
                <Download className="h-4 w-4" />
                <span>{t('admin.exportDonationReport', 'Export Donation Ledger (CSV)')}</span>
              </button>
            </div>

            {/* 3 Prioritized Metric Cards: Donation in a Month, Donation via QR, Donation via Driver */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Card 1: Donation in a Month */}
              <div className="rounded-3xl border-2 border-[#F37021] bg-gradient-to-br from-orange-50 to-amber-50 p-5 shadow-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-950 flex items-center gap-1.5">
                  <HeartHandshake className="h-4 w-4 text-[#F37021]" />
                  {t('admin.donationInMonth', 'Donation in a Month')}
                </span>
                <p className="text-3xl font-black text-[#D9530F] mt-2 font-mono">
                  RM {monthTotal.toFixed(2)}
                </p>
                <p className="text-[11px] text-neutral-600 mt-1">
                  {monthCount} {t('admin.contributions', 'contributions')}
                </p>
              </div>

              {/* Card 2: Donation via QR */}
              <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                  <QrCode className="h-4 w-4 text-emerald-600" />
                  {t('admin.donationViaQR', 'Donation via QR')}
                </span>
                <p className="text-3xl font-black text-neutral-900 mt-2 font-mono">
                  RM {qrTotal.toFixed(2)}
                </p>
                <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                  {qrDonations.length} {t('admin.contributions', 'contributions')} · DuitNow National QR
                </p>
              </div>

              {/* Card 3: Donation via Driver */}
              <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                  <Banknote className="h-4 w-4 text-amber-600" />
                  {t('admin.donationViaDriver', 'Donation via Driver')}
                </span>
                <p className="text-3xl font-black text-neutral-900 mt-2 font-mono">
                  RM {cashTotal.toFixed(2)}
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  {cashDonations.length} {t('admin.contributions', 'contributions')} · Handed over in cash
                </p>
              </div>
            </div>

            {/* Filter Tabs & Donation Ledger Table */}
            <div className="rounded-3xl border border-neutral-200 bg-white shadow-xs overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-neutral-200 gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-neutral-900 tracking-tight flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-[#F37021]" />
                    <span>Donation Audit Ledger</span>
                  </h3>
                </div>

                {/* Filter Bars: Time Range (1 Week, 1 Month, 1 Year) & Methods */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Time Range Filter Bar */}
                  <div className="flex items-center rounded-xl bg-neutral-100 p-1 border border-neutral-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setDonationTimeRange('1_week')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all tap-target ${
                        donationTimeRange === '1_week'
                          ? 'bg-[#F37021] text-white shadow-xs font-black'
                          : 'text-neutral-600 hover:text-black'
                      }`}
                    >
                      {t('admin.filter1Week', '1 Week')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDonationTimeRange('1_month')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all tap-target ${
                        donationTimeRange === '1_month'
                          ? 'bg-[#F37021] text-white shadow-xs font-black'
                          : 'text-neutral-600 hover:text-black'
                      }`}
                    >
                      {t('admin.filter1Month', '1 Month')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDonationTimeRange('1_year')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all tap-target ${
                        donationTimeRange === '1_year'
                          ? 'bg-[#F37021] text-white shadow-xs font-black'
                          : 'text-neutral-600 hover:text-black'
                      }`}
                    >
                      {t('admin.filter1Year', '1 Year')}
                    </button>
                  </div>

                  {/* Method Filter (Pending remittance & Reconciled removed) */}
                  <div className="flex items-center rounded-xl bg-neutral-100 p-1 border border-neutral-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setDonationMethodFilter('all')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all tap-target ${
                        donationMethodFilter === 'all'
                          ? 'bg-neutral-900 text-white shadow-xs font-black'
                          : 'text-neutral-600 hover:text-black'
                      }`}
                    >
                      {t('admin.filterAllDonations', 'All')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDonationMethodFilter('qr')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all tap-target ${
                        donationMethodFilter === 'qr'
                          ? 'bg-emerald-600 text-white shadow-xs font-black'
                          : 'text-neutral-600 hover:text-black'
                      }`}
                    >
                      {t('admin.donationViaQR', 'Donation via QR')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDonationMethodFilter('cash')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all tap-target ${
                        donationMethodFilter === 'cash'
                          ? 'bg-amber-600 text-white shadow-xs font-black'
                          : 'text-neutral-600 hover:text-black'
                      }`}
                    >
                      {t('admin.donationViaDriver', 'Donation via Driver')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Table (Prioritized: Time Slot, Date, Name, Assigned Driver, Payment Method, Amount, Status) */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-600 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3.5 px-4">{t('admin.timeSlot', 'Time Slot')}</th>
                      <th className="py-3.5 px-4">{t('admin.date', 'Date')}</th>
                      <th className="py-3.5 px-4">{t('admin.name', 'Name')}</th>
                      <th className="py-3.5 px-4">{t('admin.driverCol', 'Assigned Driver')}</th>
                      <th className="py-3.5 px-4">{t('admin.methodCol', 'Payment Method')}</th>
                      <th className="py-3.5 px-4">{t('admin.amountCol', 'Amount (MYR)')}</th>
                      <th className="py-3.5 px-4">{t('admin.statusCol', 'Status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white">
                    {filteredDonations.map((b) => {
                      const d = b.donation!;

                      return (
                        <tr key={b.id} className="hover:bg-neutral-50/80 transition-colors">
                          {/* 1. Time Slot */}
                          <td className="py-4 px-4 whitespace-nowrap font-mono font-bold text-neutral-950">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-neutral-400" />
                              <span>{b.appointment_time}</span>
                            </div>
                          </td>

                          {/* 2. Date */}
                          <td className="py-4 px-4 whitespace-nowrap font-semibold text-neutral-700">
                            {formatBookingDate(b.date)}
                          </td>

                          {/* 3. Name */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="font-extrabold text-neutral-900 block leading-tight">
                              {b.passenger_name}
                            </span>
                            <span className="font-mono text-[10px] text-neutral-500 block mt-0.5">
                              OKU: {b.oku_id}
                            </span>
                          </td>

                          {/* 4. Assigned Driver */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="font-bold text-neutral-900 block leading-tight">
                              {b.assigned_driver}
                            </span>
                            <span className="font-mono text-[10px] text-neutral-500 block mt-0.5">
                              {b.assigned_vehicle.plate}
                            </span>
                          </td>

                          {/* 5. Payment Method */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                              d.method === 'cash'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            }`}>
                              {d.method === 'cash' ? (
                                <>
                                  <Banknote className="h-3.5 w-3.5 text-amber-700" />
                                  <span>{t('donation.cashOption', 'Pay Cash to Driver')}</span>
                                </>
                              ) : (
                                <>
                                  <QrCode className="h-3.5 w-3.5 text-emerald-700" />
                                  <span>{t('donation.qrOption', 'DuitNow QR')}</span>
                                </>
                              )}
                            </span>
                          </td>

                          {/* 6. Amount */}
                          <td className="py-4 px-4 whitespace-nowrap font-mono font-black text-sm text-[#F37021]">
                            RM {d.amount.toFixed(2)}
                          </td>

                          {/* 7. Status */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              d.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}>
                              {d.status === 'paid' ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-600" />
                                  <span>{d.method === 'cash' ? t('admin.cashReconciled', 'Cash Reconciled') : t('donation.donated', 'Paid')}</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="h-3 w-3 text-amber-600" />
                                  <span>{t('admin.awaitingCashHandover', 'Pending Remittance')}</span>
                                </>
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredDonations.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-neutral-400">
                          <HeartHandshake className="mx-auto h-8 w-8 text-neutral-300 mb-2" />
                          <p className="text-sm font-bold text-neutral-700">
                            {t('admin.noDonationsFound', 'No donation records match the selected filter.')}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tax & Financial Compliance Info Card */}
            <div className="rounded-2xl border border-neutral-200 bg-neutral-100/70 p-4 text-xs flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-[#F37021] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-neutral-900 block">
                  Beautiful Gate Foundation for the Disabled · Official Transit Donation & Tax Compliance
                </span>
                <p className="text-neutral-600 leading-relaxed">
                  {t('donation.taxExempt', 'Beautiful Gate Foundation donations are eligible for tax exemption under Section 44(6) ITA 1967.')} All voluntary transit donations directly fund vehicle diesel, hydraulic lift maintenance, driver allowance, and accessible transport subsidies.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Expandable Artisan Drawer */}
      {selectedArtisanForDrawer && (
        <ArtisanDrawer
          artisan={selectedArtisanForDrawer}
          onClose={() => setSelectedArtisanForDrawer(null)}
        />
      )}
    </div>
  );
}
