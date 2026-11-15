'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
  HeartHandshake, 
  Car, 
  Sparkles, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  Filter, 
  Download, 
  ChevronRight, 
  MoreHorizontal, 
  ExternalLink,
  Award,
  Layers,
  Banknote,
  Building2,
  TrendingUp,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import { ArtisanDrawer } from '@/components/ArtisanDrawer';
import { ArtisanSummary } from '@/types';

export default function AdminOverviewDashboard() {
  const { 
    bookings, 
    profiles, 
    products, 
    workLogs, 
    getArtisanStats, 
    exportDonationsCSV 
  } = useApp();
  const { t } = useLanguage();

  const [selectedArtisanForDrawer, setSelectedArtisanForDrawer] = useState<ArtisanSummary | null>(null);
  const [hoveredDonationMonth, setHoveredDonationMonth] = useState<number | null>(null);

  // Today's formatted date string
  const formattedToday = useMemo(() => {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  // 1. KPI Calculation: Total Donations (MTD)
  const donatedBookings = useMemo(() => bookings.filter(b => Boolean(b.donation)), [bookings]);
  const totalDonationsAmount = useMemo(() => {
    return donatedBookings.reduce((sum, b) => sum + (b.donation?.amount || 0), 0);
  }, [donatedBookings]);

  const qrDonationsAmount = useMemo(() => {
    return donatedBookings
      .filter(b => b.donation?.method === 'qr')
      .reduce((sum, b) => sum + (b.donation?.amount || 0), 0);
  }, [donatedBookings]);

  const cashDonationsAmount = useMemo(() => {
    return donatedBookings
      .filter(b => b.donation?.method === 'cash')
      .reduce((sum, b) => sum + (b.donation?.amount || 0), 0);
  }, [donatedBookings]);

  // 2. KPI Calculation: Dispatches & Runs
  const totalTripsCount = bookings.length;
  const activeTripsCount = useMemo(() => {
    return bookings.filter(b => ['en_route_pickup', 'picked_up', 'en_route_hospital'].includes(b.status)).length;
  }, [bookings]);
  const pendingBookingsCount = useMemo(() => {
    return bookings.filter(b => b.status === 'pending').length;
  }, [bookings]);

  // 3. KPI Calculation: Artisan Workshop Production & RM Payout
  const totalCardsProduced = useMemo(() => {
    return workLogs.reduce((sum, l) => sum + (l.units_completed || 0), 0);
  }, [workLogs]);

  const totalArtisanPayout = useMemo(() => {
    return workLogs.reduce((sum, l) => sum + (l.total_earned || (l.units_completed * (l.piece_rate_snapshot || 2.0))), 0);
  }, [workLogs]);

  // 4. KPI Calculation: Community Members
  const totalMembersCount = profiles.length;
  const beneficiariesCount = useMemo(() => profiles.filter(p => p.role === 'customer').length, [profiles]);
  const driversCount = useMemo(() => profiles.filter(p => p.role === 'driver').length, [profiles]);

  // Top OKU Artisans Ranking
  const artisanLeaderboard = useMemo(() => {
    const artisanProfiles = profiles.filter(p => p.role === 'customer');
    const summaries = artisanProfiles.map(p => getArtisanStats(p.id));
    // Sort descending by total units completed
    return summaries
      .filter(s => s.yearUnits > 0 || s.monthEarned > 0)
      .sort((a, b) => b.yearUnits - a.yearUnits)
      .slice(0, 5);
  }, [profiles, getArtisanStats]);

  // Monthly timeline data for Donation & Production charts (Jan to Oct / 10 months)
  const timelineMonths = [
    { name: 'Jan', cash: 850, qr: 1200, cards: 180, payout: 360 },
    { name: 'Feb', cash: 920, qr: 1450, cards: 240, payout: 480 },
    { name: 'Mar', cash: 1100, qr: 1680, cards: 310, payout: 620 },
    { name: 'Apr', cash: 980, qr: 1890, cards: 290, payout: 580 },
    { name: 'May', cash: 1250, qr: 2100, cards: 420, payout: 840 },
    { name: 'Jun', cash: 1400, qr: 2350, cards: 380, payout: 760 },
    { name: 'Jul', cash: 1350, qr: 2500, cards: 460, payout: 920 },
    { name: 'Aug', cash: 1600, qr: 2780, cards: 510, payout: 1020 },
    { name: 'Sep', cash: 1750, qr: 2950, cards: 490, payout: 980 },
    { name: 'Oct', cash: 1900, qr: 3200, cards: 580, payout: 1160 }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            {t('nav.dashboard', 'Dashboard')}
          </h1>
          <p className="text-xs text-neutral-400 font-semibold mt-0.5 capitalize">
            {formattedToday}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Date Range Selector */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-200/90 bg-white text-xs font-bold text-neutral-700 shadow-2xs">
            <Calendar className="h-3.5 w-3.5 text-neutral-400" />
            <span>{t('admin.currentPeriod', 'Jan 1, 2026 - Dec 31, 2026')}</span>
          </div>

          {/* Filter Button */}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200/90 bg-white text-xs font-bold text-neutral-700 hover:bg-neutral-50 shadow-2xs transition-colors"
          >
            <Filter className="h-3.5 w-3.5 text-neutral-400" />
            <span>{t('common.filter', 'Filter')}</span>
          </button>

          {/* Export Button */}
          <button
            type="button"
            onClick={exportDonationsCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-2xs transition-all active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{t('common.export', 'Export')}</span>
          </button>
        </div>
      </div>

      {/* Row 1: 4 Top Revello KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Donations */}
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-neutral-300 transition-colors">
          <div>
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <span className="text-xs font-bold flex items-center gap-1.5 text-teal-800">
                <HeartHandshake className="h-4 w-4 text-teal-600" />
                {t('admin.kpiTotalDonations', 'Total Income / Donations')}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-teal-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>↗ 43% {t('admin.comparedLastMonth', 'Compared to last month')}</span>
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
            <div>
              <span className="text-2xl font-black text-neutral-900 font-mono tabular-nums tracking-tight">
                RM {totalDonationsAmount.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </span>
              <p className="text-[10px] text-neutral-400 font-medium mt-0.5">
                QR: RM {qrDonationsAmount} · Cash: RM {cashDonationsAmount}
              </p>
            </div>
            {/* Sparkline Visualizer */}
            <div className="flex items-end gap-1 h-8">
              {[40, 60, 45, 75, 55, 90, 70, 100].map((h, i) => (
                <div 
                  key={i} 
                  style={{ height: `${h}%` }}
                  className="w-1.5 rounded-full bg-teal-600/30 hover:bg-teal-600 transition-colors" 
                />
              ))}
            </div>
          </div>
        </div>

        {/* KPI 2: Artisan Craft Production & Payout */}
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-neutral-300 transition-colors">
          <div>
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <span className="text-xs font-bold flex items-center gap-1.5 text-teal-800">
                <Sparkles className="h-4 w-4 text-[#F37021]" />
                {t('admin.kpiArtisanProduction', 'Artisan Craft Output')}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-teal-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>↗ 32% {t('admin.comparedLastMonth', 'Compared to last month')}</span>
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
            <div>
              <span className="text-2xl font-black text-neutral-900 font-mono tabular-nums tracking-tight">
                {totalCardsProduced.toLocaleString()}
              </span>
              <p className="text-[10px] text-neutral-400 font-medium mt-0.5">
                {t('admin.disbursed', 'Disbursed')}: RM {totalArtisanPayout.toFixed(2)}
              </p>
            </div>
            <div className="flex items-end gap-1 h-8">
              {[30, 50, 40, 70, 60, 85, 75, 95].map((h, i) => (
                <div 
                  key={i} 
                  style={{ height: `${h}%` }}
                  className="w-1.5 rounded-full bg-[#F37021]/30 hover:bg-[#F37021] transition-colors" 
                />
              ))}
            </div>
          </div>
        </div>

        {/* KPI 3: Transit Runs & Pending Orders */}
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-neutral-300 transition-colors">
          <div>
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <span className="text-xs font-bold flex items-center gap-1.5 text-teal-800">
                <Car className="h-4 w-4 text-sky-600" />
                {t('admin.kpiTransitTrips', 'Transit Runs / Bookings')}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-rose-500 mt-1">
              <ArrowDownRight className="h-3 w-3" />
              <span>↘ 12% {t('admin.comparedLastMonth', 'Compared to last month')}</span>
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
            <div>
              <span className="text-2xl font-black text-neutral-900 font-mono tabular-nums tracking-tight">
                {totalTripsCount}+
              </span>
              <p className="text-[10px] text-neutral-400 font-medium mt-0.5">
                {activeTripsCount} {t('admin.activeNow', 'Active')} · {pendingBookingsCount} {t('admin.pendingApproval', 'Pending')}
              </p>
            </div>
            <div className="flex items-end gap-1 h-8">
              {[50, 70, 60, 40, 80, 65, 70, 85].map((h, i) => (
                <div 
                  key={i} 
                  style={{ height: `${h}%` }}
                  className="w-1.5 rounded-full bg-sky-500/30 hover:bg-sky-500 transition-colors" 
                />
              ))}
            </div>
          </div>
        </div>

        {/* KPI 4: Registered Members */}
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-neutral-300 transition-colors">
          <div>
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <span className="text-xs font-bold flex items-center gap-1.5 text-teal-800">
                <Users className="h-4 w-4 text-purple-600" />
                {t('admin.kpiCommunityMembers', 'Community Members')}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-teal-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>↗ 15% {t('admin.comparedLastMonth', 'Compared to last month')}</span>
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
            <div>
              <span className="text-2xl font-black text-neutral-900 font-mono tabular-nums tracking-tight">
                {totalMembersCount}
              </span>
              <p className="text-[10px] text-neutral-400 font-medium mt-0.5">
                {beneficiariesCount} {t('admin.filterBeneficiaries', 'Beneficiaries')} · {driversCount} {t('admin.filterDrivers', 'Drivers')}
              </p>
            </div>
            <div className="flex items-end gap-1 h-8">
              {[35, 45, 55, 65, 70, 75, 85, 90].map((h, i) => (
                <div 
                  key={i} 
                  style={{ height: `${h}%` }}
                  className="w-1.5 rounded-full bg-purple-500/30 hover:bg-purple-500 transition-colors" 
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Dual Central Charts (Revenue Over Time & Revenue Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Chart: Revenue / Inflow Over Time (Dot Matrix style like Revello) */}
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-teal-600" />
                <h3 className="text-sm font-black text-neutral-900 tracking-tight">
                  {t('admin.revenueOverTime', 'Revenue Over Time')}
                </h3>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100">
                  <Filter className="h-3.5 w-3.5" />
                </button>
                <button type="button" className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-neutral-900 font-mono tabular-nums tracking-tight">
                RM {totalDonationsAmount > 0 ? (totalDonationsAmount * 3.6).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '90,650,278'}
              </span>
              <span className="text-xs font-bold text-teal-600 flex items-center gap-0.5">
                <ArrowUpRight className="h-3.5 w-3.5" />
                56% {t('admin.increasedVsLastMonth', 'Increased vs last month')}
              </span>
            </div>
          </div>

          {/* Dot Matrix Visual Chart */}
          <div className="mt-8 pt-4 border-t border-neutral-100">
            <div className="grid grid-cols-10 gap-2 sm:gap-3 items-end h-44">
              {timelineMonths.map((m, idx) => {
                const totalUnits = 8;
                const activeUnits = Math.min(8, Math.max(2, Math.round(((m.cash + m.qr) / 5100) * 8)));
                const isHovered = hoveredDonationMonth === idx;

                return (
                  <div 
                    key={m.name} 
                    className="flex flex-col items-center gap-1 group relative cursor-pointer"
                    onMouseEnter={() => setHoveredDonationMonth(idx)}
                    onMouseLeave={() => setHoveredDonationMonth(null)}
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-12 z-20 px-2 py-1 rounded-lg bg-neutral-900 text-white text-[10px] font-mono whitespace-nowrap shadow-md pointer-events-none">
                        <p className="font-bold">{m.name}: RM {m.cash + m.qr}</p>
                        <p className="text-neutral-400 text-[9px]">QR: RM {m.qr} | Cash: RM {m.cash}</p>
                      </div>
                    )}

                    {/* Dot Column (Stack of circular pills) */}
                    <div className="flex flex-col-reverse gap-1.5 w-full items-center">
                      {Array.from({ length: totalUnits }).map((_, dotIdx) => {
                        const isFilled = dotIdx < activeUnits;
                        const isTop = dotIdx === activeUnits - 1;
                        return (
                          <span
                            key={dotIdx}
                            className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full transition-all duration-300 ${
                              isFilled 
                                ? isTop
                                  ? 'bg-teal-500 shadow-xs'
                                  : 'bg-teal-700/80'
                                : 'bg-neutral-100'
                            } ${isHovered && isFilled ? 'scale-110 bg-[#F37021]' : ''}`}
                          />
                        );
                      })}
                    </div>
                    {/* Month Label */}
                    <span className={`text-[11px] font-semibold mt-2 transition-colors ${
                      isHovered ? 'text-teal-700 font-bold' : 'text-neutral-400'
                    }`}>
                      {m.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Chart: Revenue Breakdown (Dual Smooth Spline Curves like Revello) */}
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-teal-600" />
                <h3 className="text-sm font-black text-neutral-900 tracking-tight">
                  {t('admin.revenueBreakdown', 'Revenue Breakdown')}
                </h3>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100">
                  <Filter className="h-3.5 w-3.5" />
                </button>
                <button type="button" className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-neutral-900 font-mono tabular-nums tracking-tight">
                RM {totalArtisanPayout > 0 ? (totalArtisanPayout * 12).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '4,650,278'}
              </span>
              <span className="text-xs font-bold text-rose-500 flex items-center gap-0.5">
                <ArrowDownRight className="h-3.5 w-3.5" />
                39% {t('admin.increasedVsLastMonth', 'Increased vs last month')}
              </span>
            </div>
          </div>

          {/* SVG Smooth Dual Spline Curve with Gradient Fill */}
          <div className="mt-6 pt-4 border-t border-neutral-100 relative">
            <div className="relative h-44 w-full">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="curveGrad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0D9488" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#0D9488" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="curveGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F37021" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#F37021" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines */}
                <line x1="0" y1="30" x2="500" y2="30" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="75" x2="500" y2="75" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />

                {/* Area 1: Online / Digital QR Collections */}
                <path
                  d="M 0 110 Q 50 100, 100 85 T 200 95 T 300 70 T 400 45 T 500 30 L 500 150 L 0 150 Z"
                  fill="url(#curveGrad1)"
                />
                {/* Stroke Line 1 */}
                <path
                  d="M 0 110 Q 50 100, 100 85 T 200 95 T 300 70 T 400 45 T 500 30"
                  fill="none"
                  stroke="#0D9488"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Area 2: Cash Handover Collections */}
                <path
                  d="M 0 130 Q 50 120, 100 115 T 200 125 T 300 100 T 400 80 T 500 70 L 500 150 L 0 150 Z"
                  fill="url(#curveGrad2)"
                />
                {/* Stroke Line 2 */}
                <path
                  d="M 0 130 Q 50 120, 100 115 T 200 125 T 300 100 T 400 80 T 500 70"
                  fill="none"
                  stroke="#F37021"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                />

                {/* Focus Indicator Pin (matching Revello screenshot at May/Jun) */}
                <line x1="330" y1="10" x2="330" y2="145" stroke="#CBD5E1" strokeWidth="1.5" />
                <circle cx="330" cy="62" r="4.5" fill="#0D9488" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx="330" cy="95" r="4.5" fill="#F37021" stroke="#FFFFFF" strokeWidth="2" />
              </svg>

              {/* Float Tooltip Card */}
              <div className="absolute top-1 right-20 sm:right-32 bg-white/95 backdrop-blur-xs border border-neutral-200/90 rounded-xl p-2.5 shadow-md text-xs space-y-1">
                <p className="text-[10px] font-bold text-neutral-400">May 15, 2026</p>
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-neutral-600 text-[11px]">
                    <span className="h-2 w-2 rounded-full bg-teal-600" />
                    {t('admin.onlineSales', 'Online QR')}
                  </span>
                  <span className="font-mono font-bold text-neutral-900 text-[11px]">812</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-neutral-600 text-[11px]">
                    <span className="h-2 w-2 rounded-full bg-[#F37021]" />
                    {t('admin.offlineSales', 'Driver Cash')}
                  </span>
                  <span className="font-mono font-bold text-neutral-900 text-[11px]">127</span>
                </div>
              </div>
            </div>

            {/* Bottom Month Axis */}
            <div className="flex items-center justify-between mt-3 text-[11px] font-semibold text-neutral-400 px-1">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'].map(m => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Product Sales (Leaderboard) & Sales by Category (Donut Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (Span 8): Top OKU Artisan Leaderboard */}
        <div className="lg:col-span-8 rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-[#F37021]" />
                <h3 className="text-sm font-black text-neutral-900 tracking-tight">
                  {t('admin.topArtisansLeaderboard', 'Product Sales & OKU Artisan Output')}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/admin/artisans"
                  className="text-xs font-bold text-[#F37021] hover:underline flex items-center gap-1"
                >
                  <span>{t('admin.viewWorkshop', 'View Workshop')}</span>
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* 3 Top Category Columns (matching Revello screenshot layout) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {/* Column 1: Top Artisan Leader */}
              <div className="rounded-xl bg-neutral-50/70 p-4 border border-neutral-200/80 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-black text-neutral-900 font-mono tabular-nums">
                    624,071 <span className="text-xs font-semibold text-neutral-400 font-sans">Units</span>
                  </span>
                  <span className="text-xs font-bold text-teal-600">↗ 56%</span>
                </div>
                <div className="space-y-2 pt-2 border-t border-neutral-200/60 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-700 truncate">Floral Bookmark Card</span>
                    <span className="font-mono font-bold text-teal-700">213+</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-700 truncate">Batik Greeting Card</span>
                    <span className="font-mono font-bold text-teal-700">182+</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-700 truncate">Songket Note Card</span>
                    <span className="font-mono font-bold text-teal-700">142+</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-700 truncate">Heritage Postcard</span>
                    <span className="font-mono font-bold text-teal-700">138+</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-700 truncate">Resort Welcome Card</span>
                    <span className="font-mono font-bold text-teal-700">85+</span>
                  </div>
                </div>
              </div>

              {/* Column 2: Workshop Cohort 2 */}
              <div className="rounded-xl bg-neutral-50/70 p-4 border border-neutral-200/80 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-black text-neutral-900 font-mono tabular-nums">
                    832,210 <span className="text-xs font-semibold text-neutral-400 font-sans">Units</span>
                  </span>
                  <span className="text-xs font-bold text-rose-500">↘ 12%</span>
                </div>
                <div className="space-y-2 pt-2 border-t border-neutral-200/60 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-700 truncate">Sunway Resort Special</span>
                    <span className="font-mono font-bold text-teal-700">420+</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-700 truncate">Shangri-La Eco Card</span>
                    <span className="font-mono font-bold text-teal-700">262+</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-700 truncate">Pavilion Hotel Suite</span>
                    <span className="font-mono font-bold text-teal-700">236+</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-700 truncate">Festive Raya Card</span>
                    <span className="font-mono font-bold text-teal-700">92+</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-700 truncate">CNY Auspicious Envelope</span>
                    <span className="font-mono font-bold text-teal-700">21+</span>
                  </div>
                </div>
              </div>

              {/* Column 3: Workshop Cohort 3 */}
              <div className="rounded-xl bg-neutral-50/70 p-4 border border-neutral-200/80 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-black text-neutral-900 font-mono tabular-nums">
                    454,410 <span className="text-xs font-semibold text-neutral-400 font-sans">Units</span>
                  </span>
                  <span className="text-xs font-bold text-teal-600">↗ 56%</span>
                </div>
                <div className="space-y-2 pt-2 border-t border-neutral-200/60 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-700 truncate">Pressed Flower Series</span>
                    <span className="font-mono font-bold text-teal-700">200+</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-700 truncate">Recycled Pulp Texture</span>
                    <span className="font-mono font-bold text-teal-700">120+</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-700 truncate">Coffee Husk Card</span>
                    <span className="font-mono font-bold text-teal-700">97+</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-700 truncate">Seed Paper Sprout Card</span>
                    <span className="font-mono font-bold text-teal-700">95+</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-700 truncate">Custom Corporate Card</span>
                    <span className="font-mono font-bold text-teal-700">20+</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Artisan Quick-Links */}
          {artisanLeaderboard.length > 0 && (
            <div className="mt-5 pt-3 border-t border-neutral-100 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-neutral-400">{t('admin.activeArtisans', 'Active Artisans')}:</span>
              {artisanLeaderboard.map((artisan) => (
                <button
                  key={artisan.profile.id}
                  type="button"
                  onClick={() => setSelectedArtisanForDrawer(artisan)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-[#F37021] hover:text-white text-neutral-700 text-xs font-semibold transition-colors"
                >
                  <UserAvatar
                    src={artisan.profile.avatar_url}
                    name={artisan.profile.full_name}
                    size={18}
                    className="rounded-full"
                  />
                  <span>{artisan.profile.full_name}</span>
                  <span className="text-[10px] opacity-70 font-mono">({artisan.yearUnits})</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right (Span 4): Collaborator & Category Donut Chart (Revello Sales by Category) */}
        <div className="lg:col-span-4 rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-teal-600" />
                <h3 className="text-sm font-black text-neutral-900 tracking-tight">
                  {t('admin.salesByCategory', 'Sales by Category')}
                </h3>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100">
                  <Filter className="h-3.5 w-3.5" />
                </button>
                <button type="button" className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Circular Donut Visual with Center Total */}
            <div className="relative my-6 flex items-center justify-center">
              <svg className="w-44 h-44 -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#F1F5F9"
                  strokeWidth="10"
                />
                {/* Segment 1: Electronics / Resorts (36%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#0D9488"
                  strokeWidth="10"
                  strokeDasharray="86 238"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
                {/* Segment 2: Fashion / Boutiques (24%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#F37021"
                  strokeWidth="10"
                  strokeDasharray="57 238"
                  strokeDashoffset="-96"
                  strokeLinecap="round"
                />
                {/* Segment 3: Home & Living / Corporate (15%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#0284C7"
                  strokeWidth="10"
                  strokeDasharray="36 238"
                  strokeDashoffset="-163"
                  strokeLinecap="round"
                />
              </svg>

              {/* Center Total Figure */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Total
                </span>
                <span className="text-xl font-black text-neutral-900 font-mono tracking-tight tabular-nums">
                  $102,000
                </span>
              </div>
            </div>

            {/* Legend Breakdown */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-1 rounded-full bg-teal-700" />
                  <span className="font-semibold text-neutral-700">Sunway Resort & Hotels</span>
                </div>
                <span className="font-mono font-bold text-neutral-900">54,071 <span className="text-[10px] text-neutral-400 font-sans">sales</span></span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-1 rounded-full bg-[#F37021]" />
                  <span className="font-semibold text-neutral-700">Shangri-La Series</span>
                </div>
                <span className="font-mono font-bold text-neutral-900">32,210 <span className="text-[10px] text-neutral-400 font-sans">sales</span></span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-1 rounded-full bg-sky-600" />
                  <span className="font-semibold text-neutral-700">Pavilion Hotel Suite</span>
                </div>
                <span className="font-mono font-bold text-neutral-900">24,410 <span className="text-[10px] text-neutral-400 font-sans">sales</span></span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
            <span className="text-neutral-400 font-medium">3 {t('admin.partnerAccounts', 'Partner Accounts')}</span>
            <Link
              href="/admin/donations"
              className="text-teal-700 font-bold hover:underline flex items-center gap-1"
            >
              <span>{t('admin.auditLedger', 'Audit Ledger')}</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Expandable Artisan Drawer if clicked */}
      {selectedArtisanForDrawer && (
        <ArtisanDrawer
          artisan={selectedArtisanForDrawer}
          onClose={() => setSelectedArtisanForDrawer(null)}
        />
      )}
    </div>
  );
}
