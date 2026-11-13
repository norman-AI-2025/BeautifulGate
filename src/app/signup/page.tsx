'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { MobilityType, UserRole, BeneficiaryType } from '@/types';
import { formatPhoneNumber, formatICNumber } from '@/lib/formatters';

export default function SignUpPage() {
  const router = useRouter();
  const { signup } = useApp();
  const { t } = useLanguage();

  const [role, setRole] = useState<UserRole>('customer');
  const [fullName, setFullName] = useState('');
  const [icOrOku, setIcOrOku] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [welfareNumber, setWelfareNumber] = useState('');
  const [mobilityProfile, setMobilityProfile] = useState<MobilityType>('Manual Wheelchair');
  const [beneficiaryType, setBeneficiaryType] = useState<BeneficiaryType>('resident');
  const [errorMsg, setErrorMsg] = useState('');

  const getLocalizedMobilityOption = (m: MobilityType): string => {
    switch (m) {
      case 'Manual Wheelchair':
        return t('profile.mobilityManualWheelchair', 'Manual Wheelchair');
      case 'Motorized Wheelchair':
        return t('profile.mobilityMotorizedWheelchair', 'Motorized Wheelchair');
      case 'Assisted Walk':
        return t('profile.mobilityAssistedWalk', 'Assisted Walk');
      case 'None / Escort':
        return t('profile.mobilityNoneEscort', 'None / Escort');
      case 'None':
        return t('profile.mobilityNone', 'None');
      default:
        return m;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !icOrOku.trim()) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    try {
      await Promise.resolve(signup({
        full_name: fullName.trim(),
        ic_or_oku_number: formatICNumber(icOrOku),
        phone: formatPhoneNumber(phone),
        email: email.trim(),
        password: password,
        role: role,
        mobility_type: role === 'driver' ? 'None' : mobilityProfile,
        beneficiary_type: role === 'customer' ? beneficiaryType : undefined,
        welfare_number: role === 'customer' && welfareNumber.trim() ? welfareNumber.trim() : undefined,
      }));

      if (role === 'customer') {
        router.push('/portal');
      } else {
        router.push('/driver');
      }
    } catch {
      setErrorMsg('Failed to create account. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100/60 flex flex-col justify-center items-center px-4 py-12 relative">
      {/* Brand Header */}
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white border border-neutral-200/80 shadow-md p-2 mb-3">
          <Image
            src="/images/beautiful-gate-logo.png"
            alt="Beautiful Gate Foundation"
            width={72}
            height={72}
            priority
            className="object-contain"
          />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-neutral-900">
          {t('brand.name', 'Beautiful Gate')}
        </h1>
        <p className="text-sm text-neutral-500 font-medium mt-1">
          {t('brand.subtitle', 'Assisted Mobility')} & Artisan Registration
        </p>
      </div>

      <div className="w-full max-w-lg rounded-3xl bg-white border border-neutral-200 p-8 shadow-xl">
        <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
          {t('auth.createAccount', 'Create Account')}
        </h2>
        <p className="text-xs text-neutral-500 mt-1 mb-6">
          {t('auth.doorToDoorDesc', 'Register for door-to-door accessible hospital transit & artisan workshop craft opportunities.')}
        </p>

        {errorMsg && (
          <div className="mb-4 rounded-xl border border-neutral-300 bg-neutral-50 p-3 text-xs font-semibold text-neutral-900">
            {errorMsg}
          </div>
        )}

        {/* Segmented Registration Selector */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-neutral-700 mb-2">
            {t('auth.categoryRole', 'Account Registration Category')}
          </label>
          <div className="grid grid-cols-2 p-1 rounded-xl bg-neutral-100 border border-neutral-200">
            <button
              type="button"
              onClick={() => setRole('customer')}
              className={`py-2 rounded-lg text-xs font-bold transition-all tap-target ${
                role === 'customer'
                  ? 'bg-white text-black shadow-xs font-extrabold'
                  : 'text-neutral-500 hover:text-black'
              }`}
            >
              {t('auth.beneficiaryRole', 'OKU Beneficiary / Caregiver')}
            </button>
            <button
              type="button"
              onClick={() => setRole('driver')}
              className={`py-2 rounded-lg text-xs font-bold transition-all tap-target ${
                role === 'driver'
                  ? 'bg-white text-black shadow-xs font-extrabold'
                  : 'text-neutral-500 hover:text-black'
              }`}
            >
              {t('auth.driverStaffRole', 'Staff / Driver')}
            </button>
          </div>
          {role === 'driver' && (
            <p className="mt-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5 font-medium leading-relaxed">
              {t('auth.driverRequiresAdminApproval', 'Notice: New Staff & Driver registrations require administrator approval before operational dispatch.')}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                {t('auth.fullName', 'Full Legal Name')}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('auth.asInMyKad', 'As in MyKad')}
                className="apple-input w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                {role === 'customer' 
                  ? t('auth.customerOkuLabel', 'Malaysian IC / OKU Card No.') 
                  : t('auth.driverStaffLabel', 'Staff ID / Malaysian IC')}
              </label>
              <input
                type="text"
                required
                value={icOrOku}
                onChange={(e) => setIcOrOku(e.target.value)}
                onBlur={() => setIcOrOku(formatICNumber(icOrOku))}
                placeholder="e.g. 060412-05-0245"
                className="apple-input w-full font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                {t('auth.phone', 'Mobile Phone Number')}
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => setPhone(formatPhoneNumber(phone))}
                placeholder="e.g. +6012-3456789"
                className="apple-input w-full font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                {t('auth.email', 'Email Address')}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="apple-input w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              {t('auth.password', 'Account Password')}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.min8Chars', 'Minimum 8 characters')}
              className="apple-input w-full"
            />
          </div>

          {/* Default Mobility Profile & Beneficiary Category (Segmented Choice for Beneficiaries) */}
          {role === 'customer' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-2">
                  {t('profile.beneficiaryType', 'Beneficiary Category')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'resident' as BeneficiaryType, label: t('profile.beneficiaryTypeResident', 'Resident') },
                    { key: 'daycare' as BeneficiaryType, label: t('profile.beneficiaryTypeDaycare', 'Daycare') },
                    { key: 'non_resident' as BeneficiaryType, label: t('profile.beneficiaryTypeNonResident', 'Non-Resident') }
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setBeneficiaryType(item.key)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all tap-target ${
                        beneficiaryType === item.key
                          ? 'border-[#F37021] bg-[#F37021] text-white shadow-xs'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-400'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  {beneficiaryType === 'non_resident'
                    ? t('profile.nonResidentSignupNote', 'Van transit booking only')
                    : t('profile.residentDaycareSignupNote', 'Includes workshop earnings tracking & van transit')}
                </p>
              </div>

              {beneficiaryType !== 'non_resident' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    {t('profile.welfareNumber', 'Welfare Number (JKM)')} <span className="text-neutral-400 font-normal">({t('common.optional', 'Optional')})</span>
                  </label>
                  <input
                    type="text"
                    value={welfareNumber}
                    onChange={(e) => setWelfareNumber(e.target.value)}
                    placeholder="e.g. WLF-89210-PJ / JKM-0941"
                    className="apple-input w-full font-mono text-xs"
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">
                    {t('profile.welfareDesc', 'JKM registration number for artisan allowance subsidy.')}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-2">
                  {t('auth.mobilityCategory', 'Default Mobility Profile')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Manual Wheelchair', 'Motorized Wheelchair', 'Assisted Walk', 'None / Escort'] as MobilityType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setMobilityProfile(type)}
                      className={`p-3 rounded-xl border text-xs font-bold text-left transition-all tap-target ${
                        mobilityProfile === type
                          ? 'border-[#F37021] bg-[#F37021] text-white shadow-xs'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-400'
                      }`}
                    >
                      {getLocalizedMobilityOption(type)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#F37021] hover:bg-[#D9530F] text-white font-extrabold text-sm shadow-md transition-all active:scale-[0.99] tap-target"
            >
              {t('auth.createAccount', 'Create Account')}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-neutral-600">
          <span>{t('auth.alreadyAccount', 'Already registered?')} </span>
          <Link href="/login" className="font-bold text-[#F37021] hover:underline">
            {t('auth.signIn', 'Sign In')}
          </Link>
        </div>
      </div>
    </div>
  );
}

