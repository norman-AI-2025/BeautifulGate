'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  X, 
  HeartHandshake, 
  Banknote, 
  QrCode, 
  CheckCircle2, 
  ShieldCheck, 
  Copy, 
  Check, 
  Car, 
  User, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { TransitBooking } from '@/types';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';

interface TransitDonationModalProps {
  booking: TransitBooking;
  onClose: () => void;
}

export const TransitDonationModal: React.FC<TransitDonationModalProps> = ({ booking, onClose }) => {
  const { recordDonation } = useApp();
  const { t } = useLanguage();

  const existingDonation = booking.donation;
  const [selectedAmount, setSelectedAmount] = useState<number>(existingDonation?.amount || 10);
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [customValue, setCustomValue] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr'>(existingDonation?.method || 'cash');
  const [isSuccess, setIsSuccess] = useState<boolean>(Boolean(existingDonation));
  const [copiedRef, setCopiedRef] = useState<boolean>(false);

  const referenceCode = `BG-TR-${booking.id.slice(0, 8).toUpperCase()}`;

  const handleSelectPreset = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustom(false);
  };

  const handleCustomChange = (val: string) => {
    setCustomValue(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setSelectedAmount(num);
    }
  };

  const handleConfirmDonation = () => {
    if (selectedAmount <= 0) return;
    recordDonation(booking.id, selectedAmount, paymentMethod);
    setIsSuccess(true);
  };

  const handleCopyReference = () => {
    navigator.clipboard.writeText(referenceCode);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in-50 duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-neutral-200 shadow-2xl overflow-hidden my-6">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-neutral-950 via-stone-900 to-orange-950 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors tap-target"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-lg bg-[#F37021] text-white flex items-center justify-center shadow-xs">
              <HeartHandshake className="h-4 w-4" />
            </div>
            <span className="font-extrabold text-xs tracking-wider uppercase text-orange-200">
              Beautiful Gate Foundation
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {t('donation.title', 'Voluntary Transit Donation')}
          </h3>
          <p className="text-xs text-orange-200/90 font-medium mt-1 leading-relaxed">
            {t('donation.subtitle', 'Help Beautiful Gate Foundation subsidize fuel, vehicle upkeep & accessible hospital runs for disabled beneficiaries.')}
          </p>

          {/* Booking Context Pill */}
          <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-neutral-300 font-mono gap-2">
            <span className="truncate max-w-[240px]">
              {booking.hospital_name}
            </span>
            <span className="text-[#F37021] font-bold">
              {booking.date || 'Today'} · {booking.appointment_time}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* SUCCESS RECEIPT STATE */}
          {isSuccess ? (
            <div className="text-center space-y-4 py-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm animate-bounce">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div>
                <h4 className="text-lg font-black text-neutral-900 tracking-tight">
                  {t('donation.thankYou', 'Thank you for supporting accessible mobility!')}
                </h4>
                <p className="text-xs text-neutral-600 mt-1 max-w-sm mx-auto">
                  Your contribution directly helps keep our wheelchair-accessible Toyota HiAce running safely.
                </p>
              </div>

              {/* Official Receipt Card */}
              <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/70 p-4 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                  <span className="font-bold uppercase tracking-wider text-emerald-800 text-[10px]">
                    Donation Receipt
                  </span>
                  <span className="font-mono text-emerald-700 font-bold text-[10px]">
                    {referenceCode}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 font-medium">Contributed Amount:</span>
                  <span className="text-xl font-black font-mono text-emerald-950">
                    RM {selectedAmount.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 font-medium">Method:</span>
                  <span className="font-extrabold text-neutral-900">
                    {paymentMethod === 'cash' 
                      ? t('donation.cashOption', 'Pay Cash to Driver (Johan)') 
                      : t('donation.qrOption', 'DuitNow / Online QR')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 font-medium">Beneficiary Organization:</span>
                  <span className="font-bold text-neutral-900">Beautiful Gate Foundation</span>
                </div>

                <p className="text-[10px] text-emerald-800/90 pt-2 border-t border-emerald-200 italic leading-snug">
                  {t('donation.taxExempt', 'Beautiful Gate Foundation donations are eligible for tax exemption under Section 44(6) ITA 1967.')}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-[#F37021] hover:bg-[#D9530F] text-white font-extrabold text-xs shadow-md transition-all tap-target"
              >
                {t('donation.close', 'Close')}
              </button>
            </div>
          ) : (
            /* ACTIVE DONATION SELECTION FORM */
            <div className="space-y-5">
              {/* 1. SELECT AMOUNT */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-neutral-700">
                  1. {t('donation.selectAmount', 'Select Donation Amount')}
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[5, 10, 20, 50].map((amt) => {
                    const isSelected = !isCustom && selectedAmount === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleSelectPreset(amt)}
                        className={`h-12 rounded-2xl border-2 font-mono font-black text-sm flex flex-col items-center justify-center transition-all tap-target ${
                          isSelected
                            ? 'border-[#F37021] bg-[#F37021] text-white shadow-md scale-102'
                            : 'border-neutral-200 bg-neutral-50 hover:border-orange-300 text-neutral-800'
                        }`}
                      >
                        <span>RM {amt}</span>
                        {amt === 10 && (
                          <span className={`text-[8px] font-bold uppercase tracking-wider ${isSelected ? 'text-orange-200' : 'text-[#F37021]'}`}>
                            Recommended
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Amount Field */}
                <div className="pt-1">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={customValue}
                    onChange={(e) => {
                      setIsCustom(true);
                      handleCustomChange(e.target.value);
                    }}
                    onFocus={() => setIsCustom(true)}
                    placeholder={t('donation.customAmount', 'Custom Amount (RM)')}
                    className={`apple-input w-full text-xs font-mono font-bold ${
                      isCustom ? 'border-[#F37021] ring-2 ring-orange-200' : ''
                    }`}
                  />
                </div>
              </div>

              {/* 2. CHOOSE PAYMENT METHOD (CASH TO DRIVER vs DUITNOW QR) */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-neutral-700">
                  2. {t('donation.chooseMethod', 'Choose Payment Method')}
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3 rounded-2xl border-2 flex items-start gap-2.5 transition-all text-left tap-target ${
                      paymentMethod === 'cash'
                        ? 'border-[#F37021] bg-orange-50/70 text-orange-950 shadow-xs'
                        : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <Banknote className={`h-5 w-5 shrink-0 mt-0.5 ${paymentMethod === 'cash' ? 'text-[#F37021]' : 'text-neutral-400'}`} />
                    <div>
                      <span className="font-extrabold text-xs block">
                        {t('donation.cashOption', 'Pay Cash to Driver')}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-medium block mt-0.5">
                        {booking.assigned_driver ? `${booking.assigned_driver} (${booking.assigned_vehicle?.plate || 'Van'})` : t('nav.driverRole', 'Driver')}
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qr')}
                    className={`p-3 rounded-2xl border-2 flex items-start gap-2.5 transition-all text-left tap-target ${
                      paymentMethod === 'qr'
                        ? 'border-[#F37021] bg-orange-50/70 text-orange-950 shadow-xs'
                        : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <QrCode className={`h-5 w-5 shrink-0 mt-0.5 ${paymentMethod === 'qr' ? 'text-[#F37021]' : 'text-neutral-400'}`} />
                    <div>
                      <span className="font-extrabold text-xs block">
                        {t('donation.qrOption', 'DuitNow / Online QR')}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-medium block mt-0.5">
                        TNG / Maybank / CIMB
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* PAYMENT METHOD DETAILS */}
              {paymentMethod === 'cash' ? (
                /* OPTION A: CASH TO DRIVER */
                <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-4 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 text-orange-950 font-bold">
                    <Car className="h-4 w-4 text-[#F37021]" />
                    <span>{booking.assigned_driver || t('nav.driverRole', 'Assigned Driver')} · {booking.assigned_vehicle?.plate || 'Plate NDC 9751'}</span>
                  </div>
                  <p className="text-neutral-700 leading-relaxed text-[11px]">
                    {t('donation.cashDesc', 'Hand cash directly to driver upon pickup or drop-off.')}
                  </p>
                  <p className="text-[10px] text-orange-900 font-semibold bg-white p-2 rounded-xl border border-orange-200">
                    {t('donation.driverWillReceipt', 'Driver will collect the donation and log it into the official foundation manifest.')}
                  </p>
                </div>
              ) : (
                /* OPTION B: DUITNOW QR CODE */
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 space-y-3 text-xs">
                  {/* Malaysian DuitNow National QR Card */}
                  <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm text-center space-y-2.5">
                    {/* DuitNow Header Tag */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ED1C24]/10 text-[#ED1C24] font-black text-[10px] uppercase tracking-wider border border-[#ED1C24]/30">
                      <span className="h-2 w-2 rounded-full bg-[#ED1C24]" />
                      <span>DuitNow National QR</span>
                    </div>

                    {/* Official Beautiful Gate DuitNow QR Code Image */}
                    <div className="flex justify-center my-2">
                      <div className="relative p-2 rounded-2xl bg-white border-2 border-neutral-200 shadow-md max-w-[260px] overflow-hidden">
                        <Image
                          src="/images/beautiful-gate-duitnow-qr.png"
                          alt="Beautiful Gate Foundation DuitNow QR Code"
                          width={260}
                          height={368}
                          className="w-full h-auto object-contain rounded-xl"
                          priority
                        />
                      </div>
                    </div>

                    <div>
                      <p className="font-extrabold text-neutral-900 text-xs">
                        BEAUTIFUL GATE FOUNDATION
                      </p>
                      <p className="text-[10px] text-neutral-500 font-semibold mt-0.5">
                        {t('donation.scanDuitNowQR', 'Scan DuitNow QR with Bank or e-Wallet')}
                      </p>
                    </div>

                    {/* Reference Code Pill with Copy Action */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-100 font-mono text-[11px] text-neutral-800">
                      <span>{t('donation.reference', 'Reference')}: <strong>{referenceCode}</strong></span>
                      <button
                        type="button"
                        onClick={handleCopyReference}
                        className="flex items-center gap-1 text-[10px] font-bold text-[#F37021] hover:underline"
                      >
                        {copiedRef ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedRef ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CONFIRM BUTTON */}
              <button
                type="button"
                onClick={handleConfirmDonation}
                className="w-full py-3.5 rounded-2xl bg-[#F37021] hover:bg-[#D9530F] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] tap-target"
              >
                <span>
                  {paymentMethod === 'cash' 
                    ? t('donation.confirmCash', 'Pledge Cash Donation to Driver') 
                    : t('donation.confirmQR', 'Confirm & Mark QR Donation as Completed')}
                </span>
                <span className="font-mono bg-white/20 px-2 py-0.5 rounded-lg text-xs">
                  RM {selectedAmount.toFixed(2)}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

