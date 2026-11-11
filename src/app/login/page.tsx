'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, switchRole } = useApp();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg(t('auth.enterEmail', 'Please enter your email address.'));
      return;
    }
    if (!password) {
      setErrorMsg(t('auth.enterPassword', 'Please enter your password.'));
      return;
    }
    try {
      const result = await login(email, password);
      if (result.success) {
        // Read authenticated role from current user session
        let role = 'customer';
        try {
          const stored = typeof window !== 'undefined' ? localStorage.getItem('bg_current_user') : null;
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.role) role = parsed.role;
          }
        } catch {}

        if (role === 'admin') {
          router.push('/admin');
        } else if (role === 'driver') {
          router.push('/driver');
        } else {
          router.push('/portal');
        }
      } else {
        if (result.error === 'invalid_password') {
          setErrorMsg(t('auth.invalidPassword', 'Incorrect password. Please try again.'));
        } else if (result.error === 'account_not_found') {
          setErrorMsg(t('auth.accountNotFound', 'Account not found with this email. Please create an account.'));
        } else {
          setErrorMsg(t('auth.invalidCredentials', 'Invalid email or password. Please try again.'));
        }
      }
    } catch {
      setErrorMsg(t('auth.errorSignIn', 'Unable to sign in. Please check your network and credentials.'));
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
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50/90 p-4 shadow-sm flex items-start gap-3 animate-in fade-in-50 duration-200">
            <div className="h-6 w-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
              <span className="font-black text-xs">!</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-red-950 leading-snug">
                {errorMsg}
              </p>
            </div>
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
      </div>
    </div>
  );
}

