'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { ArrowRight, UserCheck, Car, Shield } from 'lucide-react';
import { UserRole } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const { login, switchRole } = useApp();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    const success = login(email);
    if (success) {
      router.push('/portal');
    }
  };

  const handleQuickSignIn = (role: UserRole) => {
    switchRole(role);
    if (role === 'customer') router.push('/portal');
    else if (role === 'driver') router.push('/driver');
    else if (role === 'admin') router.push('/admin');
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
          {t('home.title', 'Assisted Mobility & Artisan Workshop Platform')}
        </p>
      </div>

      {/* Centered Modal Card */}
      <div className="w-full max-w-md rounded-3xl bg-white border border-neutral-200 p-8 shadow-xl">
        <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
          {t('auth.signIn', 'Sign In')}
        </h2>
        <p className="text-xs text-neutral-500 mt-1 mb-6">
          {t('auth.accessSubtitle', 'Access your transit bookings and workshop craft earnings.')}
        </p>

        {errorMsg && (
          <div className="mb-4 rounded-xl border border-neutral-300 bg-neutral-50 p-3 text-xs font-semibold text-neutral-900">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              {t('auth.email', 'Email Address')}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@beautifulgate.org.my"
              className="apple-input w-full"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-neutral-700">
                {t('auth.password', 'Password')}
              </label>
              <a href="#" className="text-xs font-semibold text-neutral-500 hover:text-black">
                {t('auth.forgot', 'Forgot?')}
              </a>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="apple-input w-full"
            />
          </div>

          {/* Primary Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#F37021] hover:bg-[#D9530F] text-white font-extrabold text-sm shadow-md transition-all active:scale-[0.99] tap-target"
            >
              {t('auth.signIn', 'Sign In')}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-neutral-600">
          <span>{t('auth.noAccount', "Don't have an account?")} </span>
          <Link href="/signup" className="font-bold text-[#F37021] hover:underline">
            {t('auth.createAccount', 'Create an account')}
          </Link>
        </div>

        {/* Dev / Demo Mode Quick Switcher */}
        <div className="mt-8 border-t border-neutral-200 pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              {t('auth.devQuickAccess', 'Dev / Evaluator Quick Access')}
            </span>
            <span className="text-[10px] font-medium text-neutral-400">
              {t('auth.oneClickAuth', '1-Click Auth')}
            </span>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleQuickSignIn('customer')}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-orange-50 hover:border-[#F37021] transition-all tap-target group"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center text-[#F37021]">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900 group-hover:text-[#F37021] transition-colors">
                    {t('auth.signInAsBeneficiary', 'Beneficiary / Caregiver')}
                  </p>
                  <p className="text-[11px] text-neutral-500 font-medium">Siti Nurhaliza</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-[#F37021] transition-colors" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickSignIn('driver')}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 hover:border-black transition-all tap-target group"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="h-8 w-8 rounded-lg bg-neutral-200 flex items-center justify-center text-neutral-800">
                  <Car className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900">
                    {t('auth.signInAsDriver', 'Driver (Johan)')}
                  </p>
                  <p className="text-[11px] text-neutral-500 font-medium">Toyota HiAce (WVV 4108)</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-neutral-400" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickSignIn('admin')}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 hover:border-black transition-all tap-target group"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="h-8 w-8 rounded-lg bg-neutral-200 flex items-center justify-center text-neutral-800">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900">
                    {t('auth.signInAsSupervisor', 'Administrator (Supervisor)')}
                  </p>
                  <p className="text-[11px] text-neutral-500 font-medium">Faridah Hashim</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-neutral-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

