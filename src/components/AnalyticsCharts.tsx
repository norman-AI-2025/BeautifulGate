'use client';

import React from 'react';
import { CardProduct, CardWorkLog, Profile } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

interface AnalyticsChartsProps {
  workLogs: CardWorkLog[];
  products: CardProduct[];
  profiles: Profile[];
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  workLogs,
  products,
  profiles,
}) => {
  const { t } = useLanguage();
  // Aggregate volume by product / resort client
  const clientDistribution = products.map(prod => {
    const logsForProduct = workLogs.filter(l => l.card_id === prod.id);
    const units = logsForProduct.reduce((acc, curr) => acc + curr.units_completed, 0);
    const revenue = logsForProduct.reduce((acc, curr) => acc + curr.total_earned, 0);
    return {
      name: prod.name,
      resort: prod.resort_client,
      pieceRate: prod.piece_rate,
      units,
      revenue,
    };
  });

  const totalUnits = clientDistribution.reduce((acc, c) => acc + c.units, 0) || 1;

  // Monthly breakdown for last 6 months
  const monthlyData = [
    { label: 'Jun', units: 480, wages: 840 },
    { label: 'Jul', units: 620, wages: 1085 },
    { label: 'Aug', units: 710, wages: 1242 },
    { label: 'Sep', units: 840, wages: 1470 },
    { label: 'Oct', units: 1280, wages: 2379 },
    {
      label: t('analytics.currentMtd', 'Nov (MTD)'),
      units: workLogs
        .filter(l => l.logged_date.startsWith('2026-11'))
        .reduce((sum, l) => sum + l.units_completed, 0),
      wages: workLogs
        .filter(l => l.logged_date.startsWith('2026-11'))
        .reduce((sum, l) => sum + l.total_earned, 0),
    },
  ];

  const maxMonthlyUnits = Math.max(...monthlyData.map(d => d.units), 100);

  // Weekly breakdown for current month (4 weeks)
  const weeklyData = [
    { label: t('analytics.week1', 'Week 1'), units: 280 },
    { label: t('analytics.week2', 'Week 2'), units: 340 },
    { label: t('analytics.week3', 'Week 3'), units: 310 },
    { label: t('analytics.week4', 'Week 4 (Current)'), units: 210 },
  ];
  const maxWeeklyUnits = Math.max(...weeklyData.map(d => d.units), 100);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Monthly Production Volume (SVG Bar Chart) */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
                {t('analytics.monthlyTitle', 'Monthly Card Production Volume')}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                {t('analytics.monthlySubtitle', 'Output across all workshop artisan beneficiaries')}
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-200">
              {t('analytics.unitsProduced', 'Units Produced')}
            </span>
          </div>

          <div className="h-64 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-neutral-200">
            {monthlyData.map((bar, idx) => {
              const heightPercent = Math.min(100, Math.round((bar.units / maxMonthlyUnits) * 100));
              const isCurrent = idx === monthlyData.length - 1;

              return (
                <div key={bar.label} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div className="text-[11px] font-bold text-neutral-800 mb-1 opacity-90">
                    {bar.units}
                  </div>
                  <div
                    className={`w-full rounded-t-lg transition-all duration-300 ${
                      isCurrent
                        ? 'bg-black'
                        : 'bg-neutral-300 group-hover:bg-neutral-400'
                    }`}
                    style={{ height: `${heightPercent}%`, minHeight: '6px' }}
                  />
                  <div className="mt-3 text-[11px] font-semibold text-neutral-600 text-center">
                    {bar.label}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
            <span>{t('analytics.trajectory', 'Historical 6-Month Trajectory')}</span>
            <span className="font-semibold text-neutral-900">{t('analytics.highest', 'Highest')}: {maxMonthlyUnits} {t('analytics.units', 'units')}</span>
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

          <div className="space-y-4">
            {clientDistribution.map((item) => {
              const percentage = Math.round((item.units / totalUnits) * 100);

              return (
                <div key={item.resort} className="space-y-1.5">
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
        </div>
      </div>
    </div>
  );
};

