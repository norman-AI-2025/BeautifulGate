'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Car, 
  Building2, 
  Phone, 
  Clock, 
  Navigation, 
  Check, 
  AlertCircle, 
  HeartHandshake, 
  ChevronUp, 
  ChevronDown,
  LayoutGrid,
  Star
} from 'lucide-react';
import { TransitBooking, TransitStatus, TransitService } from '@/types';
import { groupBookingsIntoServices } from '@/lib/transitService';
import { formatPhoneNumber } from '@/lib/formatters';
import { VanFloorPlanModal } from '@/components/VanFloorPlanModal';

export default function AdminDispatchPage() {
  const { 
    bookings, 
    approveBooking, 
    declineBooking, 
    updateBookingStatus, 
    verifyDonation,
    getDriverRating 
  } = useApp();
  const { t } = useLanguage();

  const [dispatchFilter, setDispatchFilter] = useState<'all' | 'pending' | 'active' | 'completed'>('all');
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [selectedActiveDispatchId, setSelectedActiveDispatchId] = useState<string | null>(null);
  const [selectedVanPlanSlot, setSelectedVanPlanSlot] = useState<{ slot: string; day: string } | null>(null);

  // Group all bookings into bidirectional services
  const allServices = useMemo(() => {
    return groupBookingsIntoServices(bookings);
  }, [bookings]);

  // Filter active dispatches
  const activeDispatchesList = useMemo(() => {
    return bookings.filter(b => 
      b.status === 'en_route_pickup' || 
      b.status === 'picked_up' || 
      b.status === 'en_route_hospital' || 
      b.status === 'dropped_off' ||
      b.status === 'en_route_next'
    );
  }, [bookings]);

  const currentActiveDispatch = useMemo(() => {
    if (selectedActiveDispatchId) {
      const found = activeDispatchesList.find(b => b.id === selectedActiveDispatchId);
      if (found) return found;
    }
    return activeDispatchesList[0] || null;
  }, [activeDispatchesList, selectedActiveDispatchId]);

  // Counts
  const totalServicesCount = allServices.length;
  const pendingCount = allServices.filter(s => s.isPending).length;
  const inTransitCount = allServices.filter(s => !s.isCompleted && !s.isPending && !s.isDeclined).length;
  const completedCount = allServices.filter(s => s.isCompleted).length;

  const filteredServices = useMemo(() => {
    if (dispatchFilter === 'all') return allServices;
    if (dispatchFilter === 'pending') return allServices.filter(s => s.isPending);
    if (dispatchFilter === 'active') return allServices.filter(s => !s.isCompleted && !s.isPending && !s.isDeclined);
    if (dispatchFilter === 'completed') return allServices.filter(s => s.isCompleted);
    return allServices;
  }, [allServices, dispatchFilter]);

  const getStagePercentage = (status: TransitStatus): number => {
    switch (status) {
      case 'pending': return 10;
      case 'approved': return 25;
      case 'en_route_pickup': return 40;
      case 'picked_up': return 60;
      case 'en_route_hospital': return 80;
      case 'dropped_off':
      case 'en_route_next': return 100;
      default: return 0;
    }
  };

  const handleUpdateActiveDispatchStatus = (bookingId: string, newStatus: TransitStatus) => {
    updateBookingStatus(bookingId, newStatus);
  };

  const handleApproveService = (service: TransitService) => {
    approveBooking(service.outbound.id);
    if (service.returnLeg) {
      approveBooking(service.returnLeg.id);
    }
  };

  const handleDeclineService = (service: TransitService) => {
    declineBooking(service.outbound.id);
    if (service.returnLeg) {
      declineBooking(service.returnLeg.id);
    }
  };

  const formatTimestampTime = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900">
            {t('admin.tabDispatch', 'Transit Dispatch Board')}
          </h2>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">
            {t('admin.dispatchDesc', 'Monitor active hospital transit runs, manage passenger rosters, and approve ride requests.')}
          </p>
        </div>

        {/* Quick View Seat Plan Trigger */}
        {bookings.length > 0 && (
          <button
            type="button"
            onClick={() => setSelectedVanPlanSlot({ slot: bookings[0].appointment_time || '08:00 AM', day: bookings[0].date || 'Today' })}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-bold shadow-xs tap-target transition-all self-start sm:self-auto cursor-pointer"
          >
            <LayoutGrid className="h-4 w-4 text-[#F37021]" />
            <span>{t('admin.viewVanSeatLayout', 'View Van Seating Layout')}</span>
          </button>
        )}
      </div>

      {/* ================================================================ */}
      {/* ACTIVE DISPATCH LIVE HERO CARD                                   */}
      {/* ================================================================ */}
      {currentActiveDispatch && (
        <div 
          key={currentActiveDispatch.id}
          className="rounded-2xl border border-neutral-800 bg-[#18181B] text-white p-6 sm:p-7 shadow-xs space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="flex h-2 w-2 relative">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F37021]" />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                {t('admin.activeDispatchTitle', 'Active Dispatch')}
              </span>
              <span className="font-mono text-xs font-bold bg-white/10 text-orange-200 border border-white/10 px-2.5 py-0.5 rounded-lg tabular-nums">
                {currentActiveDispatch.appointment_time}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                currentActiveDispatch.journey_type === 'return' || (currentActiveDispatch.clinic_department || '').toLowerCase().includes('return')
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
              }`}>
                {currentActiveDispatch.journey_type === 'return' || (currentActiveDispatch.clinic_department || '').toLowerCase().includes('return')
                  ? t('admin.returnTrip', 'Return: Hospital → Home')
                  : t('admin.goTrip', 'Go: Home → Hospital')}
              </span>

              {/* Multi-Ride Switcher */}
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

            {/* Active Status Badge */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs ${
                  currentActiveDispatch.status === 'dropped_off' || currentActiveDispatch.status === 'en_route_next'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-[#F37021]/20 text-orange-300 border border-[#F37021]/30'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                <span>
                  {currentActiveDispatch.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Passenger & Route Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
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
                    href={`tel:${currentActiveDispatch.phone.replace(/[^0-9+]/g, '')}`}
                    className="font-mono font-bold text-white hover:text-[#F37021] transition-colors"
                  >
                    {formatPhoneNumber(currentActiveDispatch.phone)}
                  </a>
                </div>

                {currentActiveDispatch.donation && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                    <HeartHandshake className="h-3.5 w-3.5 text-emerald-400" />
                    <span>
                      RM {currentActiveDispatch.donation.amount.toFixed(2)} ({currentActiveDispatch.donation.method === 'cash' ? t('donation.cashToDriver', 'Cash to Driver') : 'QR'})
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 bg-white/5 rounded-xl p-4 border border-white/10 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  {t('adminTable.pickupAddress', 'Pickup Address')}
                </span>
                <p className="font-semibold text-white mt-0.5 leading-snug">
                  {currentActiveDispatch.pickup_address}
                </p>
              </div>
              <div className="pt-2 border-t border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  {t('adminTable.destination', 'Hospital Destination')}
                </span>
                <p className="font-bold text-orange-200 mt-0.5 leading-snug">
                  {currentActiveDispatch.hospital_name}
                </p>
                <p className="text-[11px] text-neutral-300">
                  {currentActiveDispatch.clinic_department}
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Stepper */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-400">
              <span>{t('admin.transitProgress', 'Mission Route Progress')}</span>
              <span className="font-mono text-orange-300 tabular-nums">
                {getStagePercentage(currentActiveDispatch.status)}%
              </span>
            </div>

            <div className="relative flex items-center justify-between">
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-neutral-800 rounded-full" />
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#F37021] rounded-full transition-all duration-300"
                style={{ width: `${getStagePercentage(currentActiveDispatch.status)}%` }}
              />

              {[
                { status: 'approved' as TransitStatus, label: t('portal.stage1', 'Approved'), stepIdx: 1 },
                { status: 'en_route_pickup' as TransitStatus, label: t('portal.stage2', 'To Pickup'), stepIdx: 2 },
                { status: 'en_route_hospital' as TransitStatus, label: t('portal.stage3', 'To Hospital'), stepIdx: 3 },
                { status: 'dropped_off' as TransitStatus, label: t('portal.stage4', 'Arrived'), stepIdx: 4 },
              ].map((step) => {
                const stepPct = step.stepIdx * 25;
                const currentPct = getStagePercentage(currentActiveDispatch.status);
                const isCurrent = currentActiveDispatch.status === step.status || (step.status === 'approved' && currentActiveDispatch.status === 'pending');
                const isPassed = currentPct > stepPct;

                return (
                  <div key={step.status} className="flex flex-col items-center text-center z-10">
                    <button
                      type="button"
                      onClick={() => handleUpdateActiveDispatchStatus(currentActiveDispatch.id, step.status)}
                      className={`flex h-5 w-5 items-center justify-center rounded-full transition-all duration-200 tap-target cursor-pointer ${
                        isCurrent
                          ? 'bg-[#F37021] ring-2 ring-[#F37021]/30 scale-110 shadow-xs'
                          : isPassed
                          ? 'bg-emerald-500 text-white'
                          : 'bg-neutral-800 border border-neutral-600 hover:border-neutral-400'
                      }`}
                      title={`Set status to ${step.label}`}
                    >
                      {isPassed && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </button>
                    <span className={`text-[10px] font-bold mt-2 transition-colors ${
                      isCurrent
                        ? 'text-[#F37021]'
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

      {/* ================================================================ */}
      {/* DISPATCH TABLE WITH FILTER TABS                                  */}
      {/* ================================================================ */}
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-neutral-200 gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-neutral-900 tracking-tight">
              {t('admin.allDispatches', 'Service Runs & Rosters')}
            </h3>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-neutral-100 text-neutral-600 border border-neutral-200 tabular-nums">
              {totalServicesCount}
            </span>
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
              {t('adminTable.all', 'All')} ({totalServicesCount})
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

        {/* Clean Table */}
        {filteredServices.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 text-xs">
            <p className="font-bold">{t('admin.noBookingsFound', 'No transit bookings match this filter.')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-5">{t('admin.name', 'Name')}</th>
                  <th className="py-3.5 px-5">{t('admin.currentState', 'Status (Current State)')}</th>
                  <th className="py-3.5 px-5">{t('admin.journeyPhase', 'Status (Journey Leg)')}</th>
                  <th className="py-3.5 px-5 text-right">{t('admin.action', 'Approval Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {filteredServices.map((service) => {
                  const isExpanded = expandedBookingId === service.id;
                  const outbound = service.outbound;
                  const returnLeg = service.returnLeg;
                  const isRoundtrip = service.isRoundtrip;

                  return (
                    <React.Fragment key={service.id}>
                      <tr
                        onClick={() => setExpandedBookingId(isExpanded ? null : service.id)}
                        className={`cursor-pointer transition-colors tap-target ${
                          isExpanded
                            ? 'bg-orange-50/70'
                            : 'hover:bg-neutral-50/80'
                        }`}
                      >
                        {/* 1. Name, Contact & Schedule */}
                        <td className="py-4 px-5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-neutral-900 text-sm">
                                {service.passenger_name}
                              </span>
                              {isRoundtrip ? (
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-950 border border-amber-300">
                                  {t('admin.roundtripService', 'Roundtrip Service')}
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200">
                                  {t('admin.oneWayService', 'One-Way')}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-500 font-mono">
                              <span className="font-bold text-neutral-700">{formatPhoneNumber(service.phone)}</span>
                              <span>·</span>
                              <span>OKU: {service.oku_id || '—'}</span>
                              <span>·</span>
                              <span className="font-sans font-semibold text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded">
                                {service.date}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px]">
                              <span className="font-mono font-bold text-orange-950 bg-orange-100/80 px-2 py-0.5 rounded border border-orange-200 tabular-nums">
                                Go: {outbound.appointment_time}
                              </span>
                              {isRoundtrip && returnLeg && (
                                <span className="font-mono font-bold text-amber-950 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-200 tabular-nums">
                                  Return: {returnLeg.appointment_time}
                                </span>
                              )}
                              <span className="font-mono text-neutral-500 text-[10px]">
                                ({outbound.assigned_space})
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. Status */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          {(() => {
                            if (service.isPending) {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-yellow-400 text-yellow-950 shadow-2xs">
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  {t('adminTable.pending', 'Pending Approval')}
                                </span>
                              );
                            }
                            if (service.currentState === 'approved') {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-100 text-orange-950 border border-orange-300">
                                  <Clock className="h-3.5 w-3.5 text-[#F37021]" />
                                  {t('admin.approved', 'Approved / Scheduled')}
                                </span>
                              );
                            }
                            if (service.currentState === 'en_route_pickup') {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#F37021] text-white shadow-2xs">
                                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                  {t('admin.onTheWayToPickup', 'On the way to pickup')}
                                </span>
                              );
                            }
                            if (service.currentState === 'picked_up') {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 text-white shadow-2xs">
                                  <Check className="h-3.5 w-3.5 text-white" />
                                  {t('admin.pickedUp', 'Picked up')}
                                </span>
                              );
                            }
                            if (service.currentState === 'en_route_hospital') {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-600 text-white shadow-2xs">
                                  <Navigation className="h-3.5 w-3.5 text-white" />
                                  {t('admin.otwToDestination', 'OTW to destination')}
                                </span>
                              );
                            }
                            if (service.isCompleted) {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-950 border border-emerald-300">
                                  <Check className="h-3.5 w-3.5 text-emerald-700" />
                                  {t('admin.arrivedDestination', 'Arrived')}
                                </span>
                              );
                            }
                            return (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-100 text-blue-950 border border-blue-200">
                                <Check className="h-3.5 w-3.5 text-blue-700" />
                                {t('admin.arrivedDestination', 'Arrived (Go)')}
                              </span>
                            );
                          })()}
                        </td>

                        {/* 3. Journey Phase */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          {(() => {
                            if (service.isCompleted) {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-950 border border-emerald-200">
                                  {isRoundtrip
                                    ? `${t('admin.homeToHospital', 'Home → Hospital')} ⇄ ${t('admin.hospitalToHome', 'Hospital → Home')}`
                                    : t('admin.homeToHospital', 'Home → Hospital')}
                                </span>
                              );
                            }
                            if (service.currentPhase === 'return') {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300">
                                  {t('admin.hospitalToHome', 'Hospital → Home')}
                                </span>
                              );
                            }
                            return (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-100 text-blue-950 border border-blue-300">
                                {t('admin.homeToHospital', 'Home → Hospital')}
                              </span>
                            );
                          })()}
                        </td>

                        {/* 4. Actions */}
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {service.isPending ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApproveService(service)}
                                  className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs tap-target flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>{t('admin.approve', 'Approve')}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeclineService(service)}
                                  className="h-8 px-2.5 rounded-lg border border-neutral-200 bg-white hover:bg-rose-50 hover:text-rose-600 text-neutral-600 font-bold text-xs tap-target transition-all active:scale-95 cursor-pointer"
                                >
                                  {t('admin.decline', 'Decline')}
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setExpandedBookingId(isExpanded ? null : service.id)}
                                className="h-8 px-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 font-bold text-xs flex items-center gap-1 transition-colors tap-target cursor-pointer"
                              >
                                <span>{isExpanded ? t('common.hide', 'Hide') : t('common.details', 'Details')}</span>
                                {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* EXPANDED DETAILS */}
                      {isExpanded && (
                        <tr className="bg-neutral-50/80">
                          <td colSpan={4} className="p-4 sm:p-5 border-t border-neutral-200">
                            <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4 shadow-xs">
                              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                                    {t('adminTable.bookingManifestDetails', 'Service Manifest Details')} · Ref: {service.id}
                                  </span>
                                  <span className="text-[10px] font-bold uppercase bg-neutral-100 text-neutral-800 border border-neutral-200 px-2 py-0.5 rounded-md">
                                    {isRoundtrip ? t('admin.roundtripService', 'Roundtrip Service') : t('admin.oneWayService', 'One-Way')}
                                  </span>
                                </div>
                                <span className="font-mono text-xs font-bold text-neutral-500">
                                  OKU: {service.oku_id || '—'}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Leg 1 */}
                                <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3.5 space-y-2 text-xs">
                                  <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                                    <span className="font-bold text-blue-950 uppercase text-[11px] flex items-center gap-1.5">
                                      <Building2 className="h-3.5 w-3.5 text-blue-700" />
                                      {t('admin.leg1Outbound', 'Leg 1: Home → Hospital')}
                                    </span>
                                    <span className="font-mono font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded text-[11px] tabular-nums">
                                      {outbound.appointment_time}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold uppercase text-emerald-800 block">{t('adminTable.pickupAddress', 'Pickup Address')}</span>
                                    <p className="font-semibold text-neutral-900 mt-0.5 leading-snug">{outbound.pickup_address}</p>
                                  </div>
                                  <div className="pt-1.5 border-t border-blue-200/40">
                                    <span className="text-[10px] font-bold uppercase text-[#F37021] block">{t('adminTable.destination', 'Hospital Destination')}</span>
                                    <p className="font-semibold text-neutral-900 mt-0.5 leading-snug">{outbound.hospital_name}</p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-blue-200/40 font-mono text-[11px]">
                                    <div>
                                      <span className="text-[9px] uppercase font-bold text-neutral-400 block">{t('admin.timePickup', 'Pickup Time')}</span>
                                      <span className="font-bold text-neutral-800">{formatTimestampTime(outbound.timestamps?.picked_up)}</span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] uppercase font-bold text-neutral-400 block">{t('admin.timeDropOff', 'Drop Off Time')}</span>
                                      <span className="font-bold text-neutral-800">{formatTimestampTime(outbound.timestamps?.dropped_off)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Leg 2 */}
                                {isRoundtrip && returnLeg ? (
                                  <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3.5 space-y-2 text-xs">
                                    <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                                      <span className="font-bold text-amber-950 uppercase text-[11px] flex items-center gap-1.5">
                                        <Building2 className="h-3.5 w-3.5 text-amber-700" />
                                        {t('admin.leg2Return', 'Leg 2: Hospital → Home')}
                                      </span>
                                      <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded text-[11px] tabular-nums">
                                        {returnLeg.appointment_time}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] font-bold uppercase text-emerald-800 block">{t('adminTable.pickupAddress', 'Pickup from Hospital')}</span>
                                      <p className="font-semibold text-neutral-900 mt-0.5 leading-snug">{returnLeg.pickup_address}</p>
                                    </div>
                                    <div className="pt-1.5 border-t border-amber-200/40">
                                      <span className="text-[10px] font-bold uppercase text-[#F37021] block">{t('adminTable.destination', 'Drop Off at Home')}</span>
                                      <p className="font-semibold text-neutral-900 mt-0.5 leading-snug">{returnLeg.hospital_name}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-amber-200/40 font-mono text-[11px]">
                                      <div>
                                        <span className="text-[9px] uppercase font-bold text-neutral-400 block">{t('admin.timePickup', 'Pickup Time')}</span>
                                        <span className="font-bold text-neutral-800">{formatTimestampTime(returnLeg.timestamps?.picked_up)}</span>
                                      </div>
                                      <div>
                                        <span className="text-[9px] uppercase font-bold text-neutral-400 block">{t('admin.timeDropOff', 'Drop Off Time')}</span>
                                        <span className="font-bold text-neutral-800">{formatTimestampTime(returnLeg.timestamps?.dropped_off)}</span>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="rounded-xl border border-dashed border-neutral-200 p-4 flex flex-col items-center justify-center text-center text-neutral-400 text-xs">
                                    <p className="font-bold text-neutral-500">{t('admin.oneWayService', 'One-Way Transit Only')}</p>
                                    <p className="text-[11px] text-neutral-400 mt-1">Passenger did not schedule a return journey for this date.</p>
                                  </div>
                                )}
                              </div>

                              {/* Voluntary Transit Donation Reconciliation if present */}
                              {(outbound.donation || returnLeg?.donation) && (
                                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between text-xs">
                                  {(() => {
                                    const don = returnLeg?.donation || outbound.donation!;
                                    return (
                                      <>
                                        <div>
                                          <span className="font-bold text-neutral-900 flex items-center gap-1.5">
                                            <HeartHandshake className="h-4 w-4 text-[#F37021]" />
                                            {t('admin.transitDonation', 'Transit Donation')}: <span className="font-mono font-black text-[#D9530F] tabular-nums">RM {don.amount.toFixed(2)}</span> ({don.method === 'cash' ? t('donation.cashToDriver', 'Cash to Driver') : 'DuitNow QR'})
                                          </span>
                                          <span className="text-[10px] text-neutral-500 font-mono block mt-0.5">
                                            Status: {don.status === 'paid' ? t('admin.cashReconciled', 'Reconciled / Paid') : t('admin.awaitingCashHandover', 'Pending Driver Handover')}
                                          </span>
                                        </div>
                                        {don.method === 'cash' && don.status === 'pledged' && (
                                          <button
                                            type="button"
                                            onClick={() => verifyDonation(returnLeg?.id || outbound.id)}
                                            className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 tap-target shadow-xs cursor-pointer"
                                          >
                                            <Check className="h-3.5 w-3.5" />
                                            <span>{t('admin.verifyCashHandover', 'Verify Cash Reconciled')}</span>
                                          </button>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              )}

                              {/* Driver Service Rating & Passenger Review */}
                              {(() => {
                                const serviceRating = returnLeg?.rating || outbound.rating;
                                const serviceFeedback = returnLeg?.feedback || outbound.feedback;
                                const driverName = outbound.assigned_driver || 'Wong Kok Fu';
                                const driverRating = getDriverRating(driverName);

                                return (
                                  <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-amber-950 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                                          <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                                          {t('admin.driverRatingTitle', 'Driver Rating & Feedback')}:
                                        </span>
                                        <span className="font-black text-neutral-900">
                                          {driverName}
                                        </span>
                                        {serviceRating ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[10px]">
                                            <Check className="h-2.5 w-2.5 text-emerald-700" />
                                            {t('admin.passengerReviewed', 'Passenger Reviewed')}
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200 text-[10px] font-semibold">
                                            <Clock className="h-2.5 w-2.5 text-neutral-400" />
                                            {t('admin.awaitingReview', 'Awaiting Passenger Review')}
                                          </span>
                                        )}
                                      </div>

                                      {serviceRating ? (
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-1 text-amber-500">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                              <Star
                                                key={s}
                                                className={`h-4 w-4 ${s <= serviceRating ? 'fill-amber-400 text-amber-500' : 'text-neutral-300'}`}
                                              />
                                            ))}
                                            <span className="font-mono font-black text-neutral-900 ml-1.5 text-xs">
                                              {serviceRating}.0 / 5.0
                                            </span>
                                          </div>
                                          {serviceFeedback && (
                                            <p className="text-[11px] text-neutral-700 italic bg-white/80 p-2 rounded-lg border border-amber-200/60 mt-1">
                                              &ldquo;{serviceFeedback}&rdquo;
                                            </p>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2 text-neutral-500 text-[11px]">
                                          <div className="flex items-center gap-0.5 text-neutral-300">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                              <Star key={s} className="h-3.5 w-3.5" />
                                            ))}
                                          </div>
                                          <span>
                                            {t('admin.driverBaselineScore', 'Driver Overall Record')}: <strong className="text-amber-700">{driverRating.display} ★</strong> ({driverRating.count > 0 ? `${driverRating.count} reviews` : 'Initial 5.0'})
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    <div className="text-left sm:text-right shrink-0">
                                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-200 shadow-xs text-neutral-900">
                                        <span className="text-[10px] text-neutral-500 font-bold uppercase">{t('admin.overallScore', 'Driver Overall')}:</span>
                                        <span className="font-mono font-black text-amber-600 text-sm">{driverRating.display} ★</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
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
        )}
      </div>

      {/* Van Floor Plan Modal */}
      {selectedVanPlanSlot && (
        <VanFloorPlanModal
          isOpen={!!selectedVanPlanSlot}
          selectedTimeSlot={selectedVanPlanSlot.slot}
          selectedDay={selectedVanPlanSlot.day}
          existingBookingsForSlot={bookings.filter(b => b.appointment_time.toLowerCase().includes(selectedVanPlanSlot.slot.toLowerCase()))}
          onClose={() => setSelectedVanPlanSlot(null)}
          onBookingSuccess={() => setSelectedVanPlanSlot(null)}
        />
      )}
    </div>
  );
}
