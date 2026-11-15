'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
  HeartHandshake, 
  Download, 
  QrCode, 
  Banknote, 
  Receipt, 
  Clock, 
  Check, 
  ShieldCheck 
} from 'lucide-react';
import { TransitBooking } from '@/types';

export default function AdminDonationsPage() {
  const { bookings, verifyDonation, exportDonationsCSV } = useApp();
  const { t } = useLanguage();

  const [donationTimeRange, setDonationTimeRange] = useState<'1_week' | '1_month' | '1_year'>('1_month');
  const [donationMethodFilter, setDonationMethodFilter] = useState<'all' | 'qr' | 'cash'>('all');

  const donatedBookings = useMemo(() => bookings.filter(b => Boolean(b.donation)), [bookings]);

  // Helper to test if a donation falls within the time range
  const isWithinTimeRange = (dateStr?: string, range: '1_week' | '1_month' | '1_year' = '1_month') => {
    if (!dateStr) return true;
    let d = new Date(dateStr);
    if (isNaN(d.getTime()) && dateStr.includes(',')) {
      const parts = dateStr.split(',');
      d = new Date(parts.slice(1).join(' ').trim());
    }
    if (isNaN(d.getTime())) return true;

    const nowMs = Date.now();
    const diffMs = nowMs - d.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    // Allow upcoming/scheduled bookings (up to 7 days ahead) or in the past:
    if (range === '1_week') return diffDays >= -7 && diffDays <= 7;
    if (range === '1_month') return diffDays >= -30 && diffDays <= 30;
    if (range === '1_year') return diffDays >= -365 && diffDays <= 365;
    return true;
  };

  // Card 1: Total Donations for Selected Period (1 Week / 1 Month / 1 Year)
  const periodDonations = useMemo(() => {
    return donatedBookings.filter(b => isWithinTimeRange(b.donation?.timestamp || b.date, donationTimeRange));
  }, [donatedBookings, donationTimeRange]);
  const periodTotal = useMemo(() => periodDonations.reduce((sum, b) => sum + (b.donation?.amount || 0), 0), [periodDonations]);
  const periodCount = periodDonations.length;

  const periodCardTitle = donationTimeRange === '1_week'
    ? t('admin.donationInWeek', 'Donation in 1 Week')
    : donationTimeRange === '1_year'
    ? t('admin.donationInYear', 'Donation in 1 Year')
    : t('admin.donationInMonth', 'Donation in a Month');

  // Card 2: Donation via QR
  const qrDonations = useMemo(() => {
    return donatedBookings.filter(b => b.donation?.method === 'qr' && isWithinTimeRange(b.donation?.timestamp || b.date, donationTimeRange));
  }, [donatedBookings, donationTimeRange]);
  const qrTotal = useMemo(() => qrDonations.reduce((sum, b) => sum + (b.donation?.amount || 0), 0), [qrDonations]);

  // Card 3: Donation via Driver (Cash)
  const cashDonations = useMemo(() => {
    return donatedBookings.filter(b => b.donation?.method === 'cash' && isWithinTimeRange(b.donation?.timestamp || b.date, donationTimeRange));
  }, [donatedBookings, donationTimeRange]);
  const cashTotal = useMemo(() => cashDonations.reduce((sum, b) => sum + (b.donation?.amount || 0), 0), [cashDonations]);

  // Filtered donations for Donation Audit Ledger
  const filteredDonations = useMemo(() => {
    return donatedBookings.filter(b => {
      const rawDate = b.donation?.timestamp || b.date;
      if (!isWithinTimeRange(rawDate, donationTimeRange)) return false;
      if (donationMethodFilter === 'qr') return b.donation?.method === 'qr';
      if (donationMethodFilter === 'cash') return b.donation?.method === 'cash';
      return true;
    });
  }, [donatedBookings, donationTimeRange, donationMethodFilter]);

  const formatBookingDate = (dateStr?: string): string => {
    if (!dateStr) return '—';
    if (dateStr.includes(',')) {
      const parts = dateStr.split(',');
      if (parts.length >= 2) {
        return parts.slice(1).join(' ').trim();
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }
    return dateStr;
  };

  return (
    <div className="space-y-6">
      {/* Header & Export CSV */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900">
            {t('admin.donationTrackerTitle', 'Voluntary Transit Donations & Fuel Subsidy Tracker')}
          </h2>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">
            Audit voluntary passenger contributions received via DuitNow National QR and driver cash handover.
          </p>
        </div>

        <button
          type="button"
          onClick={exportDonationsCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F37021] hover:bg-[#D9530F] text-white text-xs font-bold shadow-xs tap-target transition-all active:scale-95 self-start sm:self-auto cursor-pointer"
        >
          <Download className="h-4 w-4" />
          <span>{t('admin.exportDonationReport', 'Export Donation Ledger (CSV)')}</span>
        </button>
      </div>

      {/* 3 Prioritized Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Donation in Selected Period */}
        <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-950 flex items-center gap-1.5">
            <HeartHandshake className="h-4 w-4 text-[#F37021]" />
            {periodCardTitle}
          </span>
          <p className="text-3xl font-black text-[#D9530F] mt-2 font-mono tabular-nums">
            RM {periodTotal.toFixed(2)}
          </p>
          <p className="text-[11px] text-neutral-600 mt-1">
            {periodCount} {t('admin.contributions', 'contributions')}
          </p>
        </div>

        {/* Card 2: Donation via QR */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
            <QrCode className="h-4 w-4 text-emerald-600" />
            {t('admin.donationViaQR', 'Donation via QR')}
          </span>
          <p className="text-3xl font-black text-neutral-900 mt-2 font-mono tabular-nums">
            RM {qrTotal.toFixed(2)}
          </p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">
            {qrDonations.length} {t('admin.contributions', 'contributions')} · DuitNow National QR
          </p>
        </div>

        {/* Card 3: Donation via Driver */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
            <Banknote className="h-4 w-4 text-amber-600" />
            {t('admin.donationViaDriver', 'Donation via Driver')}
          </span>
          <p className="text-3xl font-black text-neutral-900 mt-2 font-mono tabular-nums">
            RM {cashTotal.toFixed(2)}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">
            {cashDonations.length} {t('admin.contributions', 'contributions')} · Handed over in cash
          </p>
        </div>
      </div>

      {/* Filter Tabs & Donation Ledger Table */}
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-neutral-200 gap-4">
          <div>
            <h3 className="text-base font-bold text-neutral-900 tracking-tight flex items-center gap-2">
              <Receipt className="h-4 w-4 text-[#F37021]" />
              <span>Donation Audit Ledger</span>
            </h3>
          </div>

          {/* Filter Bars: Time Range & Methods */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Time Range Filter Bar */}
            <div className="flex items-center rounded-xl bg-neutral-100 p-1 border border-neutral-200 text-xs">
              <button
                type="button"
                onClick={() => setDonationTimeRange('1_week')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all tap-target cursor-pointer ${
                  donationTimeRange === '1_week'
                    ? 'bg-[#F37021] text-white shadow-xs'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                {t('admin.filter1Week', '1 Week')}
              </button>
              <button
                type="button"
                onClick={() => setDonationTimeRange('1_month')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all tap-target cursor-pointer ${
                  donationTimeRange === '1_month'
                    ? 'bg-[#F37021] text-white shadow-xs'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                {t('admin.filter1Month', '1 Month')}
              </button>
              <button
                type="button"
                onClick={() => setDonationTimeRange('1_year')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all tap-target cursor-pointer ${
                  donationTimeRange === '1_year'
                    ? 'bg-[#F37021] text-white shadow-xs'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                {t('admin.filter1Year', '1 Year')}
              </button>
            </div>

            {/* Method Filter */}
            <div className="flex items-center rounded-xl bg-neutral-100 p-1 border border-neutral-200 text-xs">
              <button
                type="button"
                onClick={() => setDonationMethodFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all tap-target cursor-pointer ${
                  donationMethodFilter === 'all'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                {t('admin.filterAllDonations', 'All Donations')}
              </button>
              <button
                type="button"
                onClick={() => setDonationMethodFilter('qr')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all tap-target cursor-pointer ${
                  donationMethodFilter === 'qr'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                {t('admin.donationViaQR', 'Donation via QR')}
              </button>
              <button
                type="button"
                onClick={() => setDonationMethodFilter('cash')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all tap-target cursor-pointer ${
                  donationMethodFilter === 'cash'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                {t('admin.donationViaDriver', 'Donation via Driver')}
              </button>
            </div>
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
                <th className="py-3.5 px-4">{t('admin.driverCol', 'Assigned Driver')}</th>
                <th className="py-3.5 px-4">{t('admin.methodCol', 'Payment Method')}</th>
                <th className="py-3.5 px-4">{t('admin.amountCol', 'Amount (MYR)')}</th>
                <th className="py-3.5 px-4 text-right">{t('admin.statusCol', 'Status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {filteredDonations.map((b) => {
                const d = b.donation!;

                return (
                  <tr key={b.id} className="hover:bg-neutral-50/80 transition-colors">
                    {/* Time Slot */}
                    <td className="py-4 px-4 whitespace-nowrap font-mono font-bold text-neutral-950 tabular-nums">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-neutral-400" />
                        <span>{b.appointment_time}</span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 whitespace-nowrap font-semibold text-neutral-700">
                      {formatBookingDate(b.date)}
                    </td>

                    {/* Name */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-bold text-neutral-900 block leading-tight">
                        {b.passenger_name}
                      </span>
                      <span className="font-mono text-[10px] text-neutral-500 block mt-0.5">
                        OKU: {b.oku_id}
                      </span>
                    </td>

                    {/* Assigned Driver */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-bold text-neutral-900 block leading-tight">
                        {b.assigned_driver}
                      </span>
                      <span className="font-mono text-[10px] text-neutral-500 block mt-0.5">
                        {b.assigned_vehicle?.plate || 'WVV 4108'}
                      </span>
                    </td>

                    {/* Payment Method */}
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

                    {/* Amount */}
                    <td className="py-4 px-4 whitespace-nowrap font-mono font-bold text-sm text-[#F37021] tabular-nums">
                      RM {d.amount.toFixed(2)}
                    </td>

                    {/* Status & Verify Action */}
                    <td className="py-4 px-4 whitespace-nowrap text-right">
                      {d.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span>{t('donation.received', 'Received')}</span>
                        </span>
                      ) : (
                        <div className="inline-flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                            <Clock className="h-3 w-3 text-amber-600" />
                            <span>{t('donation.pending', 'Pending')}</span>
                          </span>
                          {d.method === 'cash' && (
                            <button
                              type="button"
                              onClick={() => verifyDonation(b.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tap-target transition-all active:scale-95 cursor-pointer"
                            >
                              {t('donation.markReceived', 'Verify Received')}
                            </button>
                          )}
                        </div>
                      )}
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
  );
}
