'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
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
  Filter,
  Navigation,
  Star,
  MessageSquare,
  ShieldCheck,
  MapPin,
  AlertCircle
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
    getArtisanStats, 
    exportPayrollCSV 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'dispatch' | 'artisans' | 'analytics'>('dispatch');

  // Dispatch table filter tab
  const [dispatchFilter, setDispatchFilter] = useState<'all' | 'pending' | 'active' | 'completed'>('all');

  // Artisan search query and selected artisan drawer
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArtisanForDrawer, setSelectedArtisanForDrawer] = useState<ArtisanSummary | null>(null);

  // Compute metrics for Dispatch
  const totalBookingsCount = bookings.length;
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const inTransitCount = bookings.filter(b => 
    ['approved', 'en_route_pickup', 'picked_up', 'en_route_hospital'].includes(b.status)
  ).length;
  const completedCount = bookings.filter(b => 
    ['dropped_off', 'en_route_next'].includes(b.status)
  ).length;

  // PRIORITY CURRENT DISPATCH:
  // Find the booking currently active on the road (en_route_pickup, picked_up, en_route_hospital)
  // or the highest priority approved ride
  const currentActiveDispatch = useMemo(() => {
    return bookings.find(b => 
      ['en_route_pickup', 'picked_up', 'en_route_hospital'].includes(b.status)
    ) || bookings.find(b => b.status === 'approved') || bookings[0];
  }, [bookings]);

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
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-cyan-900 text-white shadow-md">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-300">
                  Supervisor Control Tower
                </span>
                <span className="inline-flex items-center rounded-full bg-cyan-400 text-teal-950 font-black px-2.5 py-0.5 text-xs shadow-xs">
                  Admin Dispatch Active
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
                Beautiful Gate Operations
              </h1>
            </div>

            {/* Top-Level Navigation Bar */}
            <div className="flex rounded-full bg-teal-950/60 p-1 border border-teal-700/60 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab('dispatch')}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all tap-target ${
                  activeTab === 'dispatch'
                    ? 'bg-cyan-400 text-teal-950 font-black shadow-sm'
                    : 'text-teal-100 hover:text-white'
                }`}
              >
                <Car className="h-4 w-4" />
                Transit Dispatch
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('artisans')}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all tap-target ${
                  activeTab === 'artisans'
                    ? 'bg-cyan-400 text-teal-950 font-black shadow-sm'
                    : 'text-teal-100 hover:text-white'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                Artisans & Workshop
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all tap-target ${
                  activeTab === 'analytics'
                    ? 'bg-cyan-400 text-teal-950 font-black shadow-sm'
                    : 'text-teal-100 hover:text-white'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </button>
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
            {/* ============================================================== */}
            {currentActiveDispatch && (
              <div className="rounded-3xl border-2 border-teal-700 bg-gradient-to-r from-teal-900 via-teal-800 to-cyan-900 text-white p-6 sm:p-7 shadow-lg relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-teal-700 gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400" />
                      </span>
                      <span className="text-xs font-extrabold uppercase tracking-widest text-cyan-300">
                        Priority Current Active Dispatch
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black bg-cyan-400 text-teal-950 px-3 py-1 rounded-lg">
                        Plate: {currentActiveDispatch.assigned_vehicle.plate}
                      </span>
                      <span className="font-mono text-xs font-bold text-white bg-teal-950 px-3 py-1 rounded-lg border border-teal-700">
                        Slot: {currentActiveDispatch.appointment_time}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Passenger & Space */}
                    <div>
                      <p className="text-[11px] text-teal-300 font-bold uppercase tracking-wider">
                        Active Passenger
                      </p>
                      <h3 className="text-2xl font-black text-white mt-0.5">
                        {currentActiveDispatch.passenger_name}
                      </h3>
                      <p className="text-xs text-teal-100 font-semibold mt-1">
                        Allocated Space: <span className="font-bold text-cyan-300">{currentActiveDispatch.assigned_space}</span>
                      </p>
                      <p className="text-xs text-teal-200 mt-0.5 font-mono">
                        OKU: {currentActiveDispatch.oku_id} · {currentActiveDispatch.phone}
                      </p>
                    </div>

                    {/* Destination Hospital */}
                    <div>
                      <p className="text-[11px] text-teal-300 font-bold uppercase tracking-wider">
                        Destination Clinic
                      </p>
                      <h4 className="text-lg font-extrabold text-white mt-0.5">
                        {currentActiveDispatch.hospital_name}
                      </h4>
                      <p className="text-xs text-teal-100 font-medium">
                        {currentActiveDispatch.clinic_department}
                      </p>
                      <p className="text-[11px] text-teal-200 mt-1 truncate">
                        Pickup: {currentActiveDispatch.pickup_address}
                      </p>
                    </div>

                    {/* Driver & Operator Status */}
                    <div className="rounded-2xl bg-teal-950/60 p-4 border border-teal-700 space-y-1.5">
                      <p className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">
                        Operator on Duty
                      </p>
                      <p className="text-base font-extrabold text-white">
                        {currentActiveDispatch.assigned_driver}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-cyan-300 font-bold pt-1">
                        <span>Current Stage:</span>
                        <span className="uppercase font-mono bg-teal-800 px-2 py-0.5 rounded text-white border border-teal-600">
                          {currentActiveDispatch.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Real-time progression bar directly inside admin hero */}
                  <div className="rounded-2xl bg-white text-neutral-900 p-4 shadow-inner">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1 text-center">
                      Live Highway & Clinic Checkpoint Progression
                    </p>
                    <LinearStageIndicator
                      status={currentActiveDispatch.status}
                      timestamps={currentActiveDispatch.timestamps}
                    />
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

              <div className="rounded-2xl border-2 border-teal-500 bg-teal-50/80 p-4 shadow-xs">
                <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">
                  In Transit
                </span>
                <p className="text-2xl font-black text-teal-950 mt-1 font-mono">
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
                        ? 'bg-teal-800 text-white shadow-xs'
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
                        ? 'bg-teal-800 text-white shadow-xs'
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
                        ? 'bg-emerald-600 text-white shadow-xs'
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
                      <th className="py-3.5 px-4">Passenger</th>
                      <th className="py-3.5 px-4">Destination</th>
                      <th className="py-3.5 px-4">Allocated Space</th>
                      <th className="py-3.5 px-4">Status & Checkpoint</th>
                      <th className="py-3.5 px-4">Beneficiary Rating</th>
                      <th className="py-3.5 px-4 text-right">Approval Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white">
                    {filteredBookings.map((b) => {
                      const isPending = b.status === 'pending';
                      const lastAction = formatLastAction(b);

                      return (
                        <tr key={b.id} className="hover:bg-neutral-50/80 transition-colors">
                          <td className="py-4 px-4 font-mono font-bold text-teal-950 whitespace-nowrap">
                            {b.appointment_time}
                          </td>

                          <td className="py-4 px-4 whitespace-nowrap">
                            <p className="font-extrabold text-neutral-900">{b.passenger_name}</p>
                            <p className="text-[11px] font-mono text-neutral-500">OKU: {b.oku_id}</p>
                          </td>

                          <td className="py-4 px-4 max-w-xs">
                            <p className="font-bold text-neutral-900 truncate">{b.hospital_name}</p>
                            <p className="text-[11px] text-neutral-500 truncate">{b.clinic_department}</p>
                          </td>

                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="font-mono text-[11px] font-bold bg-teal-50 text-teal-900 px-2.5 py-1 rounded-md border border-teal-200">
                              {b.assigned_space}
                            </span>
                          </td>

                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide w-fit ${
                                b.status === 'pending'
                                  ? 'bg-yellow-400 text-yellow-950'
                                  : b.status === 'approved'
                                  ? 'bg-teal-100 text-teal-900 border border-teal-300'
                                  : b.status === 'en_route_pickup' || b.status === 'picked_up' || b.status === 'en_route_hospital'
                                  ? 'bg-teal-800 text-white'
                                  : b.status === 'dropped_off' || b.status === 'en_route_next'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {b.status.replace(/_/g, ' ')}
                              </span>
                              <span className="text-[10px] text-neutral-500 font-mono mt-1">
                                {lastAction}
                              </span>
                            </div>
                          </td>

                          {/* USER SPEC: USER CAN RATE AFTER SERVICE COMPLETED & IT WILL SHOW AT ADMINISTRATOR PAGE */}
                          <td className="py-4 px-4 max-w-xs">
                            {b.rating ? (
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1 text-amber-500">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      className={`h-3.5 w-3.5 ${
                                        s <= b.rating! ? 'fill-amber-400 text-amber-500' : 'text-neutral-300'
                                      }`}
                                    />
                                  ))}
                                  <span className="text-xs font-black text-neutral-900 ml-1">
                                    {b.rating}/5
                                  </span>
                                </div>
                                {b.feedback && (
                                  <p className="text-[11px] text-neutral-600 italic line-clamp-1">
                                    &quot;{b.feedback}&quot;
                                  </p>
                                )}
                              </div>
                            ) : b.status === 'dropped_off' || b.status === 'en_route_next' ? (
                              <span className="text-[11px] text-neutral-400 italic">
                                Awaiting passenger review
                              </span>
                            ) : (
                              <span className="text-[11px] text-neutral-300">
                                In Progress
                              </span>
                            )}
                          </td>

                          {/* Approval Actions */}
                          <td className="py-4 px-4 text-right whitespace-nowrap">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => approveBooking(b.id)}
                                  className="px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-xs flex items-center gap-1 shadow-sm tap-target"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => declineBooking(b.id)}
                                  className="px-2.5 py-1.5 rounded-xl border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-100 font-bold text-xs tap-target"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-neutral-400">
                                Assigned WVV 4108
                              </span>
                            )}
                          </td>
                        </tr>
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
                        className="hover:bg-teal-50/50 cursor-pointer transition-colors"
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
                          <span className="rounded-md bg-teal-50 border border-teal-200 px-2.5 py-1 text-[11px] font-bold text-teal-900">
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
                            className="inline-flex items-center text-xs font-bold text-teal-800 hover:text-teal-950 gap-1 tap-target"
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
                className="px-5 py-2.5 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-xs flex items-center gap-2 shadow-md tap-target"
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
