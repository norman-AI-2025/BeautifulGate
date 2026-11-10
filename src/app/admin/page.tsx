'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';
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
  Play
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
    exportPayrollCSV 
  } = useApp();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'dispatch' | 'artisans' | 'analytics'>('dispatch');

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
        return 5;
      case 'approved':
        return 12;
      case 'en_route_pickup':
        return 37;
      case 'picked_up':
        return 62;
      case 'en_route_hospital':
        return 85;
      case 'dropped_off':
      case 'en_route_next':
        return 100;
      default:
        return 10;
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

            {/* Top-Level Navigation Bar & Language Selector */}
            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
              <LanguageSelector compact />
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
            {/* 1. USER SPEC: PRIORITIZE THE CURRENT DISPATCH (HERO CARD)     */}
            {/* PRIORITIZE: PICK UP ADDRESS, DESTINATION, STATUS, CONTACT     */}
            {/* NUMBER, NAME AND TIME SLOT ONLY + INTERACTIVE STATUS ANIMATION  */}
            {/* ============================================================== */}
            {currentActiveDispatch && (
              <div 
                key={currentActiveDispatch.id}
                className={`rounded-3xl border-2 border-[#F37021] bg-gradient-to-br from-neutral-950 via-stone-900 to-orange-950 text-white p-5 sm:p-7 shadow-xl space-y-5 transition-all duration-300 ${
                  animatingStatusKey ? 'ring-4 ring-[#F37021]/60 shadow-orange-500/20 shadow-2xl' : ''
                }`}
              >
                {/* Header: Title, Active Ride Switcher & Animated Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-white/10 gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F37021] opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#F37021]" />
                    </span>
                    <h2 className="text-sm font-black uppercase tracking-wider text-orange-400">
                      {t('admin.activeDispatchTitle', 'Current Active Dispatch')}
                    </h2>
                  </div>

                  {/* Multi-Dispatch Switcher (if more than 1 ride today) */}
                  {activeDispatchesList.length > 1 && (
                    <div className="flex items-center gap-1 overflow-x-auto py-1 max-w-full">
                      {activeDispatchesList.slice(0, 4).map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedActiveDispatchId(b.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold whitespace-nowrap transition-all tap-target ${
                            currentActiveDispatch.id === b.id
                              ? 'bg-[#F37021] text-white shadow-xs'
                              : 'bg-white/10 text-neutral-300 hover:bg-white/20 hover:text-white'
                          }`}
                        >
                          {b.passenger_name.split(' ')[0]} ({b.appointment_time.split('-')[0].trim()})
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2.5 self-end sm:self-auto">
                    {/* Time Slot */}
                    <span className="font-mono text-xs font-black bg-white/10 text-orange-200 border border-orange-500/30 px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[#F37021]" />
                      <span>{currentActiveDispatch.appointment_time}</span>
                    </span>

                    {/* Interactive Animated Status Pill with Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                        className={`text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-xl shadow-md transition-all flex items-center gap-2 tap-target active:scale-95 ${
                          animatingStatusKey ? 'animate-status-switch scale-105' : ''
                        } ${
                          currentActiveDispatch.status === 'en_route_pickup' || currentActiveDispatch.status === 'picked_up' || currentActiveDispatch.status === 'en_route_hospital'
                            ? 'bg-[#F37021] text-white ring-2 ring-orange-400/40 shadow-orange-500/30'
                            : currentActiveDispatch.status === 'dropped_off' || currentActiveDispatch.status === 'en_route_next'
                            ? 'bg-emerald-500 text-white ring-2 ring-emerald-400/40 shadow-emerald-500/30'
                            : 'bg-neutral-800 text-white'
                        }`}
                        title="Click to change status"
                      >
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                        </span>
                        <span key={currentActiveDispatch.status} className="animate-in fade-in zoom-in-95 duration-200">
                          {currentActiveDispatch.status.replace(/_/g, ' ')}
                        </span>
                        <ChevronDown className="h-3.5 w-3.5 opacity-80" />
                      </button>

                      {/* Apple-style Interactive Status Popover */}
                      {showStatusDropdown && (
                        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/20 bg-neutral-900/95 backdrop-blur-xl p-1.5 shadow-2xl z-50 text-white animate-in fade-in zoom-in-95 duration-150">
                          <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 border-b border-white/10 mb-1">
                            Switch Transit Status
                          </div>
                          {[
                            { val: 'approved' as TransitStatus, label: 'Approved & Scheduled' },
                            { val: 'en_route_pickup' as TransitStatus, label: 'En Route to Pickup' },
                            { val: 'picked_up' as TransitStatus, label: 'Passenger Picked Up' },
                            { val: 'en_route_hospital' as TransitStatus, label: 'En Route to Hospital' },
                            { val: 'dropped_off' as TransitStatus, label: 'Arrived / Dropped Off' },
                          ].map((st) => (
                            <button
                              key={st.val}
                              type="button"
                              onClick={() => handleUpdateActiveDispatchStatus(currentActiveDispatch.id, st.val)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-left transition-all ${
                                currentActiveDispatch.status === st.val
                                  ? 'bg-[#F37021] text-white'
                                  : 'text-neutral-300 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              <span>{st.label}</span>
                              {currentActiveDispatch.status === st.val && (
                                <Check className="h-3.5 w-3.5 stroke-[3]" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Animated Status Feedback Toast if triggered */}
                {statusFeedbackMsg && (
                  <div className="rounded-xl bg-orange-500/20 border border-orange-500/40 p-2.5 text-xs font-bold text-orange-200 flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#F37021]" />
                      {statusFeedbackMsg}
                    </span>
                    <button 
                      onClick={() => setStatusFeedbackMsg(null)}
                      className="text-orange-300 hover:text-white text-xs font-mono"
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* ============================================================== */}
                {/* INTERACTIVE & HIGH-VISIBILITY TRANSIT STAGE PROGRESSION STEPPER */}
                {/* ============================================================== */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                      <Navigation className="h-3.5 w-3.5 text-[#F37021]" />
                      Interactive Transit State Progression
                    </span>
                    <span className="text-[10px] text-neutral-400 font-medium hidden sm:inline">
                      Click any stage icon to transition status
                    </span>
                  </div>

                  {/* Horizontal Progress Stepper with Animated Fill Line */}
                  <div className="relative pt-2 pb-1">
                    {/* Background Track */}
                    <div className="absolute top-6 left-6 right-6 h-1.5 -translate-y-1/2 bg-white/15 rounded-full overflow-hidden" aria-hidden="true">
                      {/* Animated Progress Line */}
                      <div
                        className="h-full bg-gradient-to-r from-[#F37021] via-amber-400 to-emerald-400 rounded-full transition-all duration-700 ease-out animate-progress-glow"
                        style={{ width: `${getStagePercentage(currentActiveDispatch.status)}%` }}
                      />
                    </div>

                    {/* 5 Stage Clickable Buttons */}
                    <div className="relative flex justify-between items-start">
                      {[
                        { status: 'approved' as TransitStatus, label: 'Approved', sub: 'Standby', icon: Clock },
                        { status: 'en_route_pickup' as TransitStatus, label: 'To Pickup', sub: 'Departed', icon: Navigation },
                        { status: 'picked_up' as TransitStatus, label: 'Onboard', sub: 'Secured', icon: UserCheck },
                        { status: 'en_route_hospital' as TransitStatus, label: 'To Hospital', sub: 'En Route', icon: Building2 },
                        { status: 'dropped_off' as TransitStatus, label: 'Arrived', sub: 'Finished', icon: CheckCircle2 },
                      ].map((step, idx) => {
                        const stepPct = getStagePercentage(step.status);
                        const currentPct = getStagePercentage(currentActiveDispatch.status);
                        const isCurrent = currentActiveDispatch.status === step.status || (step.status === 'approved' && currentActiveDispatch.status === 'pending');
                        const isPassed = currentPct > stepPct;

                        return (
                          <div key={step.status} className="flex flex-col items-center text-center max-w-[70px] sm:max-w-[80px]">
                            {/* Interactive Step Button */}
                            <button
                              type="button"
                              onClick={() => handleUpdateActiveDispatchStatus(currentActiveDispatch.id, step.status)}
                              className={`relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl font-bold transition-all duration-300 tap-target ${
                                isCurrent
                                  ? 'bg-[#F37021] text-white shadow-lg ring-4 ring-[#F37021]/50 scale-110 z-10 animate-status-switch'
                                  : isPassed
                                  ? 'bg-emerald-500 text-white shadow-sm hover:scale-105'
                                  : 'bg-neutral-800 text-neutral-400 border border-white/20 hover:bg-neutral-700 hover:text-white'
                              }`}
                              title={`Set status to ${step.label}`}
                            >
                              <step.icon className="h-5 w-5 stroke-[2.2]" />
                              
                              {/* Pulsing beacon dot on current active stage */}
                              {isCurrent && (
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
                                </span>
                              )}
                            </button>

                            {/* Label */}
                            <span className={`text-[10px] sm:text-xs font-black tracking-tight mt-2 block transition-colors ${
                              isCurrent
                                ? 'text-orange-400 font-extrabold'
                                : isPassed
                                ? 'text-emerald-300'
                                : 'text-neutral-400'
                            }`}>
                              {step.label}
                            </span>
                            <span className="text-[9px] text-neutral-400 hidden sm:block">
                              {step.sub}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stage Advancement Quick Action Button */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between border-t border-white/10 gap-3">
                    {(() => {
                      const action = getNextStatusAction(currentActiveDispatch.status);
                      if (action.nextStatus) {
                        return (
                          <button
                            type="button"
                            onClick={() => handleUpdateActiveDispatchStatus(currentActiveDispatch.id, action.nextStatus!)}
                            className="px-5 py-2.5 rounded-xl bg-[#F37021] hover:bg-[#D9530F] text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] tap-target"
                          >
                            <Play className="h-3.5 w-3.5 fill-current" />
                            <span>Advance Stage: {action.label}</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        );
                      }
                      return (
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs py-1">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Trip Completed · Patient safely delivered to HTJ</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateActiveDispatchStatus(currentActiveDispatch.id, 'approved')}
                            className="ml-3 text-neutral-400 hover:text-white underline text-[11px] flex items-center gap-1"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Reset to Standby</span>
                          </button>
                        </div>
                      );
                    })()}

                    {/* Driver assigned info */}
                    <div className="text-right text-[11px] text-neutral-300">
                      <span className="text-neutral-400">Assigned Driver: </span>
                      <span className="font-bold text-white">{currentActiveDispatch.assigned_driver || 'Johan bin Ariffin'}</span>
                    </div>
                  </div>
                </div>

                {/* 6 Prioritized Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Name & Contact Number */}
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-400 block">
                        Passenger Name
                      </span>
                      <h3 className="text-xl font-black text-white mt-0.5">
                        {currentActiveDispatch.passenger_name}
                      </h3>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Allocated Space: <span className="font-bold text-white">{currentActiveDispatch.assigned_space}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                      <Phone className="h-4 w-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-400 block">
                          Contact Number
                        </span>
                        <a
                          href={`tel:${currentActiveDispatch.phone}`}
                          className="font-mono text-sm font-bold text-white hover:text-orange-300 transition-colors"
                        >
                          {currentActiveDispatch.phone}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Pickup Address & Destination */}
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        Pickup Address
                      </span>
                      <p className="text-xs font-bold text-white mt-0.5 leading-snug">
                        {currentActiveDispatch.pickup_address}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/10">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-400 flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        Destination
                      </span>
                      <p className="text-xs font-bold text-white mt-0.5 leading-snug">
                        {currentActiveDispatch.hospital_name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Metric Counters */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                  Total Bookings
                </span>
                <p className="text-2xl font-black text-neutral-900 mt-1 font-mono">
                  {totalBookingsCount}
                </p>
              </div>

              <div className="rounded-2xl border-2 border-yellow-300 bg-yellow-50/70 p-4 shadow-xs">
                <span className="text-[10px] font-bold text-yellow-800 uppercase tracking-wider">
                  Pending Action
                </span>
                <p className="text-2xl font-black text-yellow-950 mt-1 font-mono">
                  {pendingCount}
                </p>
              </div>

              <div className="rounded-2xl border-2 border-orange-400 bg-orange-50/80 p-4 shadow-xs">
                <span className="text-[10px] font-bold text-orange-950 uppercase tracking-wider">
                  In Transit
                </span>
                <p className="text-2xl font-black text-orange-950 mt-1 font-mono">
                  {inTransitCount}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-xs">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  Completed & Arrived
                </span>
                <p className="text-2xl font-black text-emerald-950 mt-1 font-mono">
                  {completedCount}
                </p>
              </div>
            </div>

            {/* 2. Dispatch Table with Filter Tabs and Beneficiary Ratings */}
            <div className="rounded-3xl border border-neutral-200 bg-white shadow-xs overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-neutral-200 gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-neutral-900 tracking-tight">
                    Transit Dispatch Board
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
                    All ({totalBookingsCount})
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
                    Pending ({pendingCount})
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
                    Active ({inTransitCount})
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
                    Completed ({completedCount})
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-600 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3.5 px-4">Time Slot</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Name</th>
                      <th className="py-3.5 px-4">Time Pickup</th>
                      <th className="py-3.5 px-4">Time Drop Off</th>
                      <th className="py-3.5 px-4 text-right">Approval Action</th>
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
                              <span className="font-extrabold text-neutral-900">{b.passenger_name}</span>
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
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => declineBooking(b.id)}
                                    className="px-2.5 py-1.5 rounded-xl border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-100 font-bold text-xs tap-target transition-all active:scale-95"
                                    title="Decline"
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
                                      Booking Manifest Details · {b.id}
                                    </span>
                                    <span className="font-mono text-xs font-bold text-neutral-500">
                                      OKU ID: {b.oku_id}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                    {/* Pickup & Destination */}
                                    <div className="space-y-2.5">
                                      <div>
                                        <span className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider flex items-center gap-1">
                                          <MapPin className="h-3.5 w-3.5" />
                                          Pickup Address
                                        </span>
                                        <p className="font-bold text-neutral-900 mt-0.5 leading-snug">
                                          {b.pickup_address}
                                        </p>
                                      </div>

                                      <div className="pt-2 border-t border-neutral-100">
                                        <span className="text-[10px] font-extrabold uppercase text-orange-950 tracking-wider flex items-center gap-1">
                                          <Building2 className="h-3.5 w-3.5 text-[#F37021]" />
                                          Destination
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
                                          Contact Phone
                                        </span>
                                        <p className="font-mono font-bold text-neutral-900 mt-0.5">
                                          {b.phone}
                                        </p>
                                      </div>

                                      <div className="pt-2 border-t border-neutral-100">
                                        <span className="text-[10px] font-extrabold uppercase text-neutral-500 tracking-wider">
                                          Allocated Seat(s)
                                        </span>
                                        <p className="font-mono font-bold text-orange-950 mt-0.5 bg-orange-50 px-2 py-0.5 rounded border border-orange-200 inline-block">
                                          {b.assigned_space}
                                        </p>
                                      </div>

                                      <div className="pt-2 border-t border-neutral-100">
                                        <span className="text-[10px] font-extrabold uppercase text-neutral-500 tracking-wider">
                                          Mobility Profile
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
                                          Assigned Operator & Van
                                        </span>
                                        <p className="font-bold text-neutral-900 mt-0.5">
                                          {b.assigned_driver} · <span className="font-mono font-bold">{b.assigned_vehicle.plate}</span>
                                        </p>
                                      </div>

                                      {/* Passenger Rating if available */}
                                      {b.rating && (
                                        <div className="pt-2 border-t border-neutral-100 space-y-1">
                                          <span className="text-[10px] font-extrabold uppercase text-amber-700 tracking-wider block">
                                            Beneficiary Review
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
                  Registered OKU Artisans
                </h2>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, OKU ID..."
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
                      <th className="py-3.5 px-5">Artisan Beneficiary</th>
                      <th className="py-3.5 px-5">OKU Number</th>
                      <th className="py-3.5 px-5">Mobility Profile</th>
                      <th className="py-3.5 px-5">Cards (MTD)</th>
                      <th className="py-3.5 px-5">Month-to-Date Earnings</th>
                      <th className="py-3.5 px-5">Year-to-Date Earnings</th>
                      <th className="py-3.5 px-5 text-right">Action</th>
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
                          {artisan.monthUnits} cards
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
                            <span>Ledger & Bank</span>
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
                  Production & Disbursement Analytics
                </h2>
              </div>

              {/* Export Control */}
              <button
                type="button"
                onClick={exportPayrollCSV}
                className="px-5 py-2.5 rounded-2xl bg-[#F37021] hover:bg-[#D9530F] text-white font-extrabold text-xs flex items-center gap-2 shadow-md tap-target"
              >
                <Download className="h-4 w-4" />
                Export Payroll CSV
              </button>
            </div>

            {/* KPI Summary 4 Blocks */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Cards Produced (Month)
                </p>
                <p className="text-3xl font-black text-neutral-900 mt-2 font-mono">
                  {totalCardsMonth}
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Cards Produced (YTD)
                </p>
                <p className="text-3xl font-black text-neutral-900 mt-2 font-mono">
                  {totalCardsYear}
                </p>
              </div>

              <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-5 shadow-sm">
                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  Total Wages Disbursed
                </p>
                <p className="text-3xl font-black text-emerald-950 mt-2 font-mono">
                  RM {totalWagesDisbursed.toFixed(2)}
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Active Artisans
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
