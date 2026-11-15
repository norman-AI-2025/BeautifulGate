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
  const { t, language } = useLanguage();

  const [selectedArtisanForDrawer, setSelectedArtisanForDrawer] = useState<ArtisanSummary | null>(null);
  const [hoveredDonationMonth, setHoveredDonationMonth] = useState<number | null>(null);
  const [hoveredPayoutMonth, setHoveredPayoutMonth] = useState<number | null>(null);

  // Locale-aware formatted today string
  const formattedToday = useMemo(() => {
    const localeCode = language === 'zh' ? 'zh-CN' : language === 'ms' ? 'ms-MY' : 'en-US';
    return new Intl.DateTimeFormat(localeCode, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date());
  }, [language]);

  // Current year
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  // 1. KPI: Total Donations from Supabase bookings
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

  // 2. KPI: Dispatches & Runs from Supabase bookings
  const totalTripsCount = bookings.length;
  const activeTripsCount = useMemo(() => {
    return bookings.filter(b => ['en_route_pickup', 'picked_up', 'en_route_hospital'].includes(b.status)).length;
  }, [bookings]);
  const pendingBookingsCount = useMemo(() => {
    return bookings.filter(b => b.status === 'pending').length;
  }, [bookings]);

  // 3. KPI: Artisan Workshop Production & Payouts from Supabase workLogs
  const totalCardsProduced = useMemo(() => {
    return workLogs.reduce((sum, l) => sum + (l.units_completed || 0), 0);
  }, [workLogs]);

  const totalArtisanPayout = useMemo(() => {
    return workLogs.reduce((sum, l) => sum + (l.total_earned || (l.units_completed * (l.piece_rate_snapshot || 2.0))), 0);
  }, [workLogs]);

  // 4. KPI: Registered Community Members from Supabase profiles
  const totalMembersCount = profiles.length;
  const beneficiariesCount = useMemo(() => profiles.filter(p => p.role === 'customer').length, [profiles]);
  const driversCount = useMemo(() => profiles.filter(p => p.role === 'driver').length, [profiles]);

  // Dynamic monthly timeline aggregation strictly from Supabase data
  const timelineMonths = useMemo(() => {
    const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNamesZh = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const monthNamesMs = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];
    const labels = language === 'zh' ? monthNamesZh : language === 'ms' ? monthNamesMs : monthNamesEn;

    // Up to current month (or all 12 months)
    return labels.map((label, monthIndex) => {
      // Filter bookings for this month
      let cash = 0;
      let qr = 0;
      donatedBookings.forEach(b => {
        const rawDate = b.donation?.timestamp || b.date || b.created_at;
        if (rawDate) {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime()) && d.getMonth() === monthIndex) {
            if (b.donation?.method === 'cash') cash += b.donation.amount || 0;
            if (b.donation?.method === 'qr') qr += b.donation.amount || 0;
          }
        }
      });

      // Filter worklogs for this month
      let cards = 0;
      let payout = 0;
      workLogs.forEach(l => {
        if (l.logged_date) {
          const parts = l.logged_date.split('-');
          const m = parseInt(parts[1], 10) - 1;
          if (m === monthIndex) {
            cards += l.units_completed || 0;
            payout += l.total_earned || (l.units_completed * (l.piece_rate_snapshot || 2.0));
          }
        }
      });

      return {
        name: label,
        monthIndex,
        cash,
        qr,
        totalDonations: cash + qr,
        cards,
        payout
      };
    });
  }, [donatedBookings, workLogs, language]);

  // Max values for chart scaling
  const maxDonationMonth = useMemo(() => {
    const max = Math.max(...timelineMonths.map(m => m.totalDonations), 100);
    return max;
  }, [timelineMonths]);

  const maxCardsMonth = useMemo(() => {
    return Math.max(...timelineMonths.map(m => m.cards), 50);
  }, [timelineMonths]);

  const maxPayoutMonth = useMemo(() => {
    return Math.max(...timelineMonths.map(m => m.payout), 100);
  }, [timelineMonths]);

  // Month-over-Month calculation for Donations
  const donationTrend = useMemo(() => {
    const currentMonthIdx = new Date().getMonth();
    const currentVal = timelineMonths[currentMonthIdx]?.totalDonations || 0;
    const prevVal = currentMonthIdx > 0 ? timelineMonths[currentMonthIdx - 1]?.totalDonations || 0 : 0;
    if (prevVal === 0) {
      return { diff: currentVal > 0 ? 100 : 0, isUp: true };
    }
    const pct = Math.round(((currentVal - prevVal) / prevVal) * 100);
    return { diff: Math.abs(pct), isUp: pct >= 0 };
  }, [timelineMonths]);

  // Month-over-Month calculation for Artisan Craft Cards
  const cardsTrend = useMemo(() => {
    const currentMonthIdx = new Date().getMonth();
    const currentVal = timelineMonths[currentMonthIdx]?.cards || 0;
    const prevVal = currentMonthIdx > 0 ? timelineMonths[currentMonthIdx - 1]?.cards || 0 : 0;
    if (prevVal === 0) {
      return { diff: currentVal > 0 ? 100 : 0, isUp: true };
    }
    const pct = Math.round(((currentVal - prevVal) / prevVal) * 100);
    return { diff: Math.abs(pct), isUp: pct >= 0 };
  }, [timelineMonths]);

  // Top OKU Artisans Leaderboard derived strictly from Supabase profiles and logs
  const artisanLeaderboard = useMemo(() => {
    const artisanProfiles = profiles.filter(p => p.role === 'customer');
    const summaries = artisanProfiles.map(p => getArtisanStats(p.id));
    return summaries
      .filter(s => s.yearUnits > 0 || s.monthEarned > 0 || s.todayUnits > 0)
      .sort((a, b) => b.yearUnits - a.yearUnits)
      .slice(0, 6);
  }, [profiles, getArtisanStats]);

  // Top Products breakdown aggregated directly from Supabase workLogs
  const productOutputBreakdown = useMemo(() => {
    const map = new Map<string, { product: any; units: number; earnings: number }>();

    products.forEach(p => {
      map.set(p.id, { product: p, units: 0, earnings: 0 });
    });

    workLogs.forEach(l => {
      const entry = map.get(l.card_id);
      if (entry) {
        entry.units += l.units_completed || 0;
        entry.earnings += l.total_earned || (l.units_completed * (l.piece_rate_snapshot || 2.0));
      } else {
        // Uncatalogued or custom series
        const fallbackProd = {
          id: l.card_id,
          name: l.card_name || 'Artisan Craft Series',
          resort_client: 'Resort Partner',
          piece_rate: l.piece_rate_snapshot || 2.0
        };
        map.set(l.card_id, {
          product: fallbackProd,
          units: l.units_completed || 0,
          earnings: l.total_earned || (l.units_completed * (l.piece_rate_snapshot || 2.0))
        });
      }
    });

    return Array.from(map.values())
      .filter(e => e.units > 0)
      .sort((a, b) => b.units - a.units);
  }, [products, workLogs]);

  // Collaborator & Category Donut distribution derived strictly from Supabase
  const collaboratorDonutData = useMemo(() => {
    const totalUnits = productOutputBreakdown.reduce((sum, item) => sum + item.units, 0);
    const colors = ['#0D9488', '#F37021', '#0284C7', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899'];

    if (totalUnits === 0) {
      return { totalUnits: 0, segments: [] };
    }

    let cumulativePct = 0;
    const circumference = 238.76; // 2 * PI * 38

    const segments = productOutputBreakdown.slice(0, 5).map((item, idx) => {
      const pct = (item.units / totalUnits) * 100;
      const strokeDash = (pct / 100) * circumference;
      const strokeOffset = -(cumulativePct / 100) * circumference;
      cumulativePct += pct;

      return {
        id: item.product.id,
        name: item.product.name,
        resort: item.product.resort_client,
        units: item.units,
        percentage: Math.round(pct),
        color: colors[idx % colors.length],
        strokeDash: `${strokeDash} ${circumference}`,
        strokeOffset
      };
    });

    return { totalUnits, segments };
  }, [productOutputBreakdown]);

  // Compute SVG polyline/path points for area chart
  const { cardsPath, payoutPath, fillPath } = useMemo(() => {
    if (timelineMonths.length === 0) {
      return { cardsPath: '', payoutPath: '', fillPath: '' };
    }

    const width = 480;
    const height = 120;
    const xStep = width / (timelineMonths.length - 1);

    const cardsPoints = timelineMonths.map((m, i) => {
      const x = 10 + i * xStep;
      const y = 135 - (m.cards / maxCardsMonth) * height;
      return `${x},${y}`;
    });

    const payoutPoints = timelineMonths.map((m, i) => {
      const x = 10 + i * xStep;
      const y = 135 - (m.payout / maxPayoutMonth) * height;
      return `${x},${y}`;
    });

    const cPath = `M ${cardsPoints[0]} L ${cardsPoints.slice(1).join(' L ')}`;
    const pPath = `M ${payoutPoints[0]} L ${payoutPoints.slice(1).join(' L ')}`;
    const fPath = `${cPath} L 490,140 L 10,140 Z`;

    return { cardsPath: cPath, payoutPath: pPath, fillPath: fPath };
  }, [timelineMonths, maxCardsMonth, maxPayoutMonth]);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            {t('admin.dashboardTitle', 'Dashboard')}
          </h1>
          <p className="text-xs text-neutral-400 font-semibold mt-0.5 capitalize">
            {formattedToday}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Current Period Label */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-200/90 bg-white text-xs font-bold text-neutral-700 shadow-2xs">
            <Calendar className="h-3.5 w-3.5 text-neutral-400" />
            <span>
              {t('admin.currentPeriod', 'Current Fiscal Year ({year})').replace('{year}', currentYear.toString())}
            </span>
          </div>

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
            <div className={`flex items-center gap-1 text-[11px] font-bold mt-1 ${donationTrend.isUp ? 'text-teal-600' : 'text-rose-500'}`}>
              {donationTrend.isUp ? <TrendingUp className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              <span>
                {donationTrend.isUp ? '↗' : '↘'} {donationTrend.diff}% {t('admin.comparedLastMonth', 'Compared to last month')}
              </span>
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
            <div>
              <span className="text-2xl font-black text-neutral-900 font-mono tabular-nums tracking-tight">
                RM {totalDonationsAmount.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </span>
              <p className="text-[10px] text-neutral-400 font-medium mt-0.5">
                {t('admin.onlineQr', 'QR')}: RM {qrDonationsAmount} · {t('admin.driverCash', 'Cash')}: RM {cashDonationsAmount}
              </p>
            </div>
            {/* Sparkline Visualizer derived from Supabase monthly donations */}
            <div className="flex items-end gap-1 h-8">
              {timelineMonths.slice(-8).map((m, i) => {
                const h = Math.max(15, Math.round((m.totalDonations / maxDonationMonth) * 100));
                return (
                  <div 
                    key={i} 
                    style={{ height: `${h}%` }}
                    title={`${m.name}: RM ${m.totalDonations}`}
                    className="w-1.5 rounded-full bg-teal-600/30 hover:bg-teal-600 transition-colors cursor-pointer" 
                  />
                );
              })}
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
            <div className={`flex items-center gap-1 text-[11px] font-bold mt-1 ${cardsTrend.isUp ? 'text-teal-600' : 'text-rose-500'}`}>
              {cardsTrend.isUp ? <TrendingUp className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              <span>
                {cardsTrend.isUp ? '↗' : '↘'} {cardsTrend.diff}% {t('admin.comparedLastMonth', 'Compared to last month')}
              </span>
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
            {/* Sparkline Visualizer derived from Supabase monthly cards */}
            <div className="flex items-end gap-1 h-8">
              {timelineMonths.slice(-8).map((m, i) => {
                const h = Math.max(15, Math.round((m.cards / maxCardsMonth) * 100));
                return (
                  <div 
                    key={i} 
                    style={{ height: `${h}%` }}
                    title={`${m.name}: ${m.cards} ${t('admin.unitsLabel', 'Units')}`}
                    className="w-1.5 rounded-full bg-[#F37021]/30 hover:bg-[#F37021] transition-colors cursor-pointer" 
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* KPI 3: Transit Runs & Bookings */}
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-neutral-300 transition-colors">
          <div>
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <span className="text-xs font-bold flex items-center gap-1.5 text-teal-800">
                <Car className="h-4 w-4 text-sky-600" />
                {t('admin.kpiTransitTrips', 'Transit Runs / Bookings')}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-teal-600 mt-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>{bookings.filter(b => b.status === 'dropped_off').length} {t('common.verified', 'Completed')}</span>
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
            <div>
              <span className="text-2xl font-black text-neutral-900 font-mono tabular-nums tracking-tight">
                {totalTripsCount}
              </span>
              <p className="text-[10px] text-neutral-400 font-medium mt-0.5">
                {activeTripsCount} {t('admin.activeNow', 'Active')} · {pendingBookingsCount} {t('admin.pendingApproval', 'Pending')}
              </p>
            </div>
            <div className="flex items-end gap-1 h-8">
              {[40, 65, 50, 80, 60, 75, 90, 85].map((h, i) => (
                <div 
                  key={i} 
                  style={{ height: `${h}%` }}
                  className="w-1.5 rounded-full bg-sky-500/30 hover:bg-sky-500 transition-colors" 
                />
              ))}
            </div>
          </div>
        </div>

        {/* KPI 4: Registered Community Members */}
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
              <span>{profiles.filter(p => p.role === 'admin').length} {t('admin.filterAdmins', 'Administrators')}</span>
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

      {/* Row 2: Dual Central Charts (Donation Inflow & Production/Payout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Chart: Revenue / Inflow Over Time (Strictly from Supabase bookings) */}
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-teal-600" />
                <h3 className="text-sm font-black text-neutral-900 tracking-tight">
                  {t('admin.revenueOverTime', 'Donation Inflow Over Time')}
                </h3>
              </div>
              <Link 
                href="/admin/donations" 
                className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1"
              >
                <span>{t('admin.auditLedger', 'Audit Ledger')}</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-neutral-900 font-mono tabular-nums tracking-tight">
                RM {totalDonationsAmount.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </span>
              <span className={`text-xs font-bold flex items-center gap-0.5 ${donationTrend.isUp ? 'text-teal-600' : 'text-rose-500'}`}>
                {donationTrend.isUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {donationTrend.diff}% {t('admin.increasedVsLastMonth', 'vs last month')}
              </span>
            </div>
          </div>

          {/* Dot Matrix Visual Chart */}
          <div className="mt-8 pt-4 border-t border-neutral-100">
            <div className="grid grid-cols-12 gap-1.5 sm:gap-2 items-end h-44">
              {timelineMonths.map((m, idx) => {
                const totalUnits = 8;
                // Proportional filled dots (1 to 8) based on actual donations in Supabase
                const activeUnits = m.totalDonations > 0 
                  ? Math.min(8, Math.max(1, Math.round((m.totalDonations / maxDonationMonth) * 8)))
                  : 1;
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
                        <p className="font-bold">{m.name}: RM {m.totalDonations}</p>
                        <p className="text-neutral-400 text-[9px]">{t('admin.onlineQr', 'QR')}: RM {m.qr} | {t('admin.driverCash', 'Cash')}: RM {m.cash}</p>
                      </div>
                    )}

                    {/* Dot Column */}
                    <div className="flex flex-col-reverse gap-1.5 w-full items-center">
                      {Array.from({ length: totalUnits }).map((_, dotIdx) => {
                        const isFilled = dotIdx < activeUnits && m.totalDonations > 0;
                        const isTop = isFilled && dotIdx === activeUnits - 1;
                        return (
                          <span
                            key={dotIdx}
                            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
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
                    <span className={`text-[10px] font-semibold mt-2 transition-colors truncate ${
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

        {/* Right Chart: Production & Payouts (Strictly from Supabase workLogs) */}
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#F37021]" />
                <h3 className="text-sm font-black text-neutral-900 tracking-tight">
                  {t('admin.revenueBreakdown', 'Artisan Workshop Production & Payouts')}
                </h3>
              </div>
              <Link 
                href="/admin/artisans" 
                className="text-xs font-bold text-[#F37021] hover:underline flex items-center gap-1"
              >
                <span>{t('admin.viewWorkshop', 'View Workshop')}</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-neutral-900 font-mono tabular-nums tracking-tight">
                RM {totalArtisanPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`text-xs font-bold flex items-center gap-0.5 ${cardsTrend.isUp ? 'text-teal-600' : 'text-rose-500'}`}>
                {cardsTrend.isUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {cardsTrend.diff}% {t('admin.increasedVsLastMonth', 'vs last month')}
              </span>
            </div>
          </div>

          {/* SVG Smooth Curves with Gradient Fill strictly from Supabase data */}
          <div className="mt-6 pt-4 border-t border-neutral-100 relative">
            <div className="relative h-44 w-full">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="payoutGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0D9488" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#0D9488" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="cardsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F37021" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#F37021" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines */}
                <line x1="0" y1="30" x2="500" y2="30" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="75" x2="500" y2="75" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />

                {/* Real Data Curve: Cards Completed */}
                {fillPath && (
                  <path d={fillPath} fill="url(#payoutGrad)" />
                )}
                {cardsPath && (
                  <path
                    d={cardsPath}
                    fill="none"
                    stroke="#0D9488"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Real Data Curve: Payout Disbursed */}
                {payoutPath && (
                  <path
                    d={payoutPath}
                    fill="none"
                    stroke="#F37021"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>

              {/* Real Legend Badge */}
              <div className="absolute top-1 right-2 bg-white/95 backdrop-blur-xs border border-neutral-200/90 rounded-xl p-2.5 shadow-xs text-xs space-y-1">
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-neutral-600 text-[11px]">
                    <span className="h-2 w-2 rounded-full bg-teal-600" />
                    {t('admin.cardsProduced', 'Cards Produced')}
                  </span>
                  <span className="font-mono font-bold text-neutral-900 text-[11px]">
                    {totalCardsProduced}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-neutral-600 text-[11px]">
                    <span className="h-2 w-2 rounded-full bg-[#F37021]" />
                    {t('admin.payoutDisbursed', 'Payout Disbursed')}
                  </span>
                  <span className="font-mono font-bold text-neutral-900 text-[11px]">
                    RM {totalArtisanPayout.toFixed(0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Month Axis */}
            <div className="flex items-center justify-between mt-3 text-[10px] font-semibold text-neutral-400 px-1">
              {timelineMonths.map(m => (
                <span key={m.name} className="truncate max-w-[30px]">{m.name}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Top OKU Artisans Leaderboard & Collaborator Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (Span 8): Real OKU Artisan Leaderboard */}
        <div className="lg:col-span-8 rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-[#F37021]" />
                <h3 className="text-sm font-black text-neutral-900 tracking-tight">
                  {t('admin.topArtisansLeaderboard', 'Top OKU Artisans & Craft Output')}
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

            {/* Top Artisans Cards strictly from Supabase */}
            {artisanLeaderboard.length === 0 ? (
              <div className="py-12 text-center text-neutral-400 text-xs">
                <p>{t('admin.noDataYet', 'No activity recorded in Supabase yet.')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {artisanLeaderboard.slice(0, 3).map((artisan, rankIdx) => {
                  const rankIcons = ['🥇', '🥈', '🥉'];
                  return (
                    <div 
                      key={artisan.profile.id}
                      className="rounded-xl bg-neutral-50/70 p-4 border border-neutral-200/80 space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base shrink-0">{rankIcons[rankIdx]}</span>
                            <UserAvatar
                              src={artisan.profile.avatar_url}
                              name={artisan.profile.full_name}
                              size={28}
                              className="rounded-lg shrink-0"
                            />
                            <div className="min-w-0">
                              <p 
                                className="font-extrabold text-neutral-900 text-xs truncate" 
                                title={artisan.profile.full_name}
                              >
                                {artisan.profile.full_name.length > 15 
                                  ? artisan.profile.full_name.trim().split(/\s+/)[0] 
                                  : artisan.profile.full_name}
                              </p>
                              {artisan.profile.chinese_name && (
                                <p className="text-[10px] text-neutral-500 truncate">
                                  {artisan.profile.chinese_name}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 shrink-0">
                            #{rankIdx + 1}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-neutral-200/60 flex items-baseline justify-between">
                          <div>
                            <span className="text-lg font-black text-neutral-900 font-mono tabular-nums">
                              {artisan.yearUnits.toLocaleString()}
                            </span>
                            <span className="text-xs font-semibold text-neutral-400 ml-1">
                              {t('admin.unitsLabel', 'Units')}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-[#F37021] font-mono">
                            RM {artisan.yearEarned.toFixed(2)}
                          </span>
                        </div>

                        {/* Recent Card logs by this artisan */}
                        <div className="space-y-1.5 pt-1 text-[11px]">
                          <div className="flex items-center justify-between text-neutral-500">
                            <span>{t('admin.todayEarnings', 'Today')}</span>
                            <span className="font-mono font-bold text-neutral-700">
                              {artisan.todayUnits} {t('admin.unitsLabel', 'Units')} (RM {artisan.todayEarned.toFixed(2)})
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-neutral-500">
                            <span>{t('admin.monthEarnings', 'This Month')}</span>
                            <span className="font-mono font-bold text-neutral-700">
                              {artisan.monthUnits} {t('admin.unitsLabel', 'Units')} (RM {artisan.monthEarned.toFixed(2)})
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedArtisanForDrawer(artisan)}
                        className="w-full mt-2 py-1.5 px-3 rounded-lg bg-white hover:bg-[#F37021] hover:text-white border border-neutral-200 text-neutral-700 text-xs font-bold transition-colors text-center"
                      >
                        {t('admin.viewWorkshop', 'View Workshop Ledger')}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Artisan Quick-Pills */}
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
                  <span>
                    {artisan.profile.full_name.length > 15 
                      ? artisan.profile.full_name.trim().split(/\s+/)[0] 
                      : artisan.profile.full_name}
                  </span>
                  <span className="text-[10px] opacity-70 font-mono">({artisan.yearUnits})</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right (Span 4): Real Collaborator & Card Series Output (Donut Chart) */}
        <div className="lg:col-span-4 rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-teal-600" />
                <h3 className="text-sm font-black text-neutral-900 tracking-tight">
                  {t('admin.salesByCategory', 'Collaborator & Card Series Output')}
                </h3>
              </div>
              <div className="flex items-center gap-1">
                <Link
                  href="/admin/artisans"
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                  title={t('admin.viewWorkshop', 'View Workshop')}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Circular Donut Visual with Center Total from Supabase */}
            <div className="relative my-6 flex items-center justify-center">
              <svg className="w-44 h-44 -rotate-90" viewBox="0 0 100 100">
                {/* Background Base Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#F1F5F9"
                  strokeWidth="10"
                />

                {/* Dynamic Segments strictly from Supabase */}
                {collaboratorDonutData.segments.map((seg) => (
                  <circle
                    key={seg.id}
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth="10"
                    strokeDasharray={seg.strokeDash}
                    strokeDashoffset={seg.strokeOffset}
                    strokeLinecap="round"
                  />
                ))}
              </svg>

              {/* Center Total Figure */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  {t('admin.totalUnits', 'Total Output')}
                </span>
                <span className="text-xl font-black text-neutral-900 font-mono tracking-tight tabular-nums">
                  {collaboratorDonutData.totalUnits.toLocaleString()}
                </span>
                <span className="text-[10px] text-neutral-400 font-medium">
                  {t('admin.unitsLabel', 'Units')}
                </span>
              </div>
            </div>

            {/* Real Collaborator Breakdown Legend from Supabase */}
            <div className="space-y-3 pt-2">
              {collaboratorDonutData.segments.length === 0 ? (
                <div className="py-4 text-center text-neutral-400 text-xs">
                  {t('admin.noDataYet', 'No activity recorded in Supabase yet.')}
                </div>
              ) : (
                collaboratorDonutData.segments.map((seg) => (
                  <div key={seg.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0 max-w-[65%]">
                      <span 
                        className="h-2.5 w-1 rounded-full shrink-0" 
                        style={{ backgroundColor: seg.color }}
                      />
                      <span className="font-semibold text-neutral-700 truncate" title={seg.name}>
                        {seg.name}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-neutral-900 shrink-0">
                      {seg.units.toLocaleString()} <span className="text-[10px] text-neutral-400 font-sans">({seg.percentage}%)</span>
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
            <span className="text-neutral-400 font-medium">
              {products.length} {t('admin.partnerAccounts', 'Collaborators / Products')}
            </span>
            <Link
              href="/admin/artisans"
              className="text-teal-700 font-bold hover:underline flex items-center gap-1"
            >
              <span>{t('admin.tabArtisans', 'Workshop Ledger')}</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

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
