'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CardProduct, CardWorkLog, Profile } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { Calendar, ChevronDown, Check, BarChart3, Building2 } from 'lucide-react';

interface AnalyticsChartsProps {
  workLogs: CardWorkLog[];
  products: CardProduct[];
  profiles: Profile[];
  workerId?: string;
}

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  workLogs,
  products,
  profiles,
  workerId,
}) => {
  const { t } = useLanguage();

  // If workerId is provided, isolate to that specific artisan; otherwise aggregate all
  const effectiveWorkLogs = useMemo(() => {
    if (workerId) {
      return workLogs.filter(l => l.worker_id === workerId);
    }
    return workLogs;
  }, [workLogs, workerId]);

  // Extract ONLY years that have actual data from Supabase
  const yearsWithData = useMemo(() => {
    const yearsSet = new Set<string>();
    effectiveWorkLogs.forEach(l => {
      if (l.logged_date) {
        const y = l.logged_date.slice(0, 4);
        if (/^\d{4}$/.test(y)) {
          yearsSet.add(y);
        }
      }
    });
    // Sort descending (e.g. 2026, 2025)
    return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
  }, [effectiveWorkLogs]);

  // Year filter state
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsYearDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync selectedYear: default to most recent year with real data; if none, remain null
  useEffect(() => {
    if (yearsWithData.length > 0) {
      if (!selectedYear || !yearsWithData.includes(selectedYear)) {
        setSelectedYear(yearsWithData[0]);
      }
    } else {
      setSelectedYear(null);
    }
  }, [yearsWithData, selectedYear]);

  // Logs strictly filtered by selectedYear
  const yearLogs = useMemo(() => {
    if (!selectedYear) return [];
    return effectiveWorkLogs.filter(l => l.logged_date && l.logged_date.startsWith(selectedYear));
  }, [effectiveWorkLogs, selectedYear]);

  // Dynamic monthly breakdown:
  // - Leaves blank for new users with no historical data
  // - Shows records gradually as months are logged
  // - Maximum 12 months
  const { monthlyData, maxMonthlyUnits } = useMemo(() => {
    if (!selectedYear || yearLogs.length === 0) {
      return { monthlyData: [], maxMonthlyUnits: 0 };
    }

    const recordedMonthNums = yearLogs
      .map(l => {
        const parts = l.logged_date.split('-');
        const m = parseInt(parts[1], 10);
        return isNaN(m) ? null : m;
      })
      .filter((m): m is number => m !== null && m >= 1 && m <= 12);

    if (recordedMonthNums.length === 0) {
      return { monthlyData: [], maxMonthlyUnits: 0 };
    }

    const minMonth = Math.min(...recordedMonthNums);
    const maxMonth = Math.max(...recordedMonthNums);

    const today = new Date();
    const currentYearStr = String(today.getFullYear());
    const currentMonthNum = today.getMonth() + 1; // 1-12
    const isCurrentYear = selectedYear === currentYearStr;

    // Timeline boundaries:
    // Start month is the earliest month with recorded data (records appear gradually)
    const startM = minMonth;
    // End month is current month (if current calendar year) or latest recorded month
    const rawEndM = isCurrentYear ? Math.max(maxMonth, currentMonthNum) : maxMonth;
    // Capped at 12 months max
    const endM = Math.min(12, Math.max(startM, rawEndM));

    const list: {
      label: string;
      units: number;
      wages: number;
      isCurrentMonth: boolean;
    }[] = [];

    for (let m = startM; m <= endM; m++) {
      const isCurrent = isCurrentYear && m === currentMonthNum;
      const baseMonth = MONTH_NAMES_SHORT[m - 1];
      const label = isCurrent ? `${baseMonth} (MTD)` : baseMonth;

      const logsForMonth = yearLogs.filter(l => {
        const mNum = parseInt(l.logged_date.split('-')[1], 10);
        return mNum === m;
      });

      const units = logsForMonth.reduce((sum, l) => sum + (Number(l.units_completed) || 0), 0);
      const wages = logsForMonth.reduce((sum, l) => sum + (Number(l.total_earned) || 0), 0);

      list.push({
        label,
        units,
        wages,
        isCurrentMonth: isCurrent,
      });
    }

    // Limit to max 12 months
    const finalMonthlyData = list.slice(-12);
    const maxUnits = Math.max(...finalMonthlyData.map(d => d.units), 0);

    return {
      monthlyData: finalMonthlyData,
      maxMonthlyUnits: maxUnits,
    };
  }, [selectedYear, yearLogs]);

  // Aggregate volume by product / resort client (filtered by selected year)
  const clientDistribution = useMemo(() => {
    const logsToUse = yearLogs.length > 0 ? yearLogs : effectiveWorkLogs;
    return products.map(prod => {
      const logsForProduct = logsToUse.filter(l => l.card_id === prod.id);
      const units = logsForProduct.reduce((acc, curr) => acc + (Number(curr.units_completed) || 0), 0);
      const revenue = logsForProduct.reduce((acc, curr) => acc + (Number(curr.total_earned) || 0), 0);
      return {
        id: prod.id,
        name: prod.name,
        resort: prod.resort_client,
        pieceRate: prod.piece_rate,
        units,
        revenue,
      };
    });
  }, [products, yearLogs, effectiveWorkLogs]);

  const totalUnits = useMemo(() => {
    return clientDistribution.reduce((acc, c) => acc + c.units, 0);
  }, [clientDistribution]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Monthly Production Volume (SVG Bar Chart) */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
                {t('analytics.monthlyTitle', 'Monthly Card Production Volume')}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                {t('analytics.monthlySubtitle', 'Output across all workshop artisan beneficiaries')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Filter Button: Shows ONLY the years that have data */}
              {yearsWithData.length > 0 ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsYearDropdownOpen(prev => !prev)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-xs font-bold text-neutral-800 shadow-xs transition-colors cursor-pointer"
                  >
                    <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                    <span>{selectedYear || yearsWithData[0]}</span>
                    <ChevronDown className={`h-3 w-3 text-neutral-400 transition-transform ${isYearDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isYearDropdownOpen && (
                    <div className="absolute right-0 mt-1.5 w-36 bg-white border border-neutral-200 rounded-xl shadow-lg z-30 py-1 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-100">
                        {t('analytics.filterByYear', 'Years with Data')}
                      </div>
                      {yearsWithData.map((year) => (
                        <button
                          key={year}
                          type="button"
                          onClick={() => {
                            setSelectedYear(year);
                            setIsYearDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between hover:bg-neutral-50 transition-colors cursor-pointer ${
                            selectedYear === year ? 'text-[#F37021] bg-orange-50/50 font-bold' : 'text-neutral-700'
                          }`}
                        >
                          <span>{year}</span>
                          {selectedYear === year && <Check className="h-3.5 w-3.5 text-[#F37021]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-neutral-100 text-xs font-semibold text-neutral-400">
                  <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                  <span>{t('analytics.noYearData', 'No Year Data')}</span>
                </span>
              )}

              <span className="text-xs font-mono font-semibold text-neutral-600 bg-neutral-100 px-2.5 py-1.5 rounded-lg border border-neutral-200">
                {t('analytics.unitsProduced', 'Units Produced')}
              </span>
            </div>
          </div>

          {/* Chart Canvas or Blank Empty State */}
          {monthlyData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center border-b border-neutral-200 text-center px-4 bg-neutral-50/50 rounded-xl">
              <div className="h-12 w-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400 mb-3 border border-neutral-200">
                <BarChart3 className="h-6 w-6 text-neutral-400" />
              </div>
              <p className="text-sm font-bold text-neutral-700">
                {t('analytics.noDataTitle', 'No Production Records Yet')}
              </p>
              <p className="text-xs text-neutral-400 max-w-xs mt-1">
                {t('analytics.noDataDesc', 'Historical records will appear gradually here as workshop artisans log completed cards.')}
              </p>
            </div>
          ) : (
            <div className="h-64 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-neutral-200">
              {monthlyData.map((bar) => {
                const heightPercent = maxMonthlyUnits > 0 && bar.units > 0
                  ? Math.min(100, Math.round((bar.units / maxMonthlyUnits) * 100))
                  : 0;

                return (
                  <div key={bar.label} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div className="text-[11px] font-bold text-neutral-800 mb-1 opacity-90">
                      {bar.units}
                    </div>
                    <div
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        bar.isCurrentMonth
                          ? 'bg-black'
                          : 'bg-neutral-300 group-hover:bg-neutral-400'
                      }`}
                      style={{ height: `${heightPercent}%`, minHeight: bar.units > 0 ? '6px' : '3px' }}
                    />
                    <div className="mt-3 text-[11px] font-semibold text-neutral-600 text-center truncate w-full">
                      {bar.label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
            <span>
              {monthlyData.length > 0
                ? t('analytics.trajectoryN', '{count}-Month Trajectory').replace('{count}', String(monthlyData.length))
                : t('analytics.noHistoricalData', 'No historical records')}
            </span>
            <span className="font-semibold text-neutral-900">
              {t('analytics.highest', 'Highest')}: {maxMonthlyUnits} {t('analytics.units', 'units')}
            </span>
          </div>
        </div>

        {/* Chart 2: Client Resort Distribution */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
                {t('analytics.resortTitle', 'Resort Client Distribution')}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                {t('analytics.resortSubtitle', 'Volume breakdown by partner eco-luxury hotels')}
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-200">
              {clientDistribution.length} {t('analytics.clientsCount', 'Clients')}
            </span>
          </div>

          {totalUnits === 0 && effectiveWorkLogs.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center border-b border-neutral-200 text-center px-4 bg-neutral-50/50 rounded-xl">
              <div className="h-12 w-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400 mb-3 border border-neutral-200">
                <Building2 className="h-6 w-6 text-neutral-400" />
              </div>
              <p className="text-sm font-bold text-neutral-700">
                {t('analytics.noDistributionTitle', 'No Client Orders Yet')}
              </p>
              <p className="text-xs text-neutral-400 max-w-xs mt-1">
                {t('analytics.noDistributionDesc', 'Resort client volume breakdowns will be displayed once workshop logs are recorded.')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {clientDistribution.map((item) => {
                const percentage = totalUnits > 0 ? Math.round((item.units / totalUnits) * 100) : 0;

                return (
                  <div key={item.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-neutral-900">{item.resort}</span>
                        <span className="text-neutral-500 ml-2">· {item.name}</span>
                      </div>
                      <div className="font-mono text-neutral-700 font-semibold">
                        {item.units} {t('analytics.cardsCount', 'cards')} ({percentage}%)
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden border border-neutral-200">
                      <div
                        className="h-full bg-neutral-800 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-neutral-500">
                      <span>{t('analytics.pieceRate', 'Piece Rate')}: RM {item.pieceRate.toFixed(2)}</span>
                      <span className="font-semibold text-neutral-800">
                        {t('analytics.disbursed', 'Disbursed')}: RM {item.revenue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
