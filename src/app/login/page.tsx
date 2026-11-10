'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { ArrowRight, UserCheck, Car, Shield } from 'lucide-react';
import { UserRole } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const { login, switchRole } = useApp();

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
    <div className="min-h-screen bg-neutral-100/60 flex flex-col justify-center items-center px-4 py-12">
      {/* Brand Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white shadow-md mb-3">
          <span className="font-bold text-xl tracking-tight">BG</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Beautiful Gate</h1>
        <p className="text-sm text-neutral-500 font-medium mt-1">
          Assisted Mobility & Artisan Workshop Platform
        </p>
      </div>

      {/* Centered Modal Card */}
      <div className="w-full max-w-md rounded-3xl bg-white border border-neutral-200 p-8 shadow-xl">
        <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Sign In</h2>
        <p className="text-xs text-neutral-500 mt-1 mb-6">
          Access your transit bookings and workshop craft earnings.
        </p>

        {errorMsg && (
          <div className="mb-4 rounded-xl border border-neutral-300 bg-neutral-50 p-3 text-xs font-semibold text-neutral-900">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Email Address
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
                Password
              </label>
              <a href="#" className="text-xs font-semibold text-neutral-500 hover:text-black">
                Forgot?
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
              className="apple-btn-primary w-full text-base font-bold"
            >
              Sign In
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-neutral-600">
          <span>Don&apos;t have an account? </span>
          <Link href="/signup" className="font-bold text-black hover:underline">
            Create an account
          </Link>
        </div>

        {/* Dev / Demo Mode Quick Switcher */}
        <div className="mt-8 border-t border-neutral-200 pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Dev / Evaluator Quick Access
            </span>
            <span className="text-[10px] font-medium text-neutral-400">1-Click Auth</span>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleQuickSignIn('customer')}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 hover:border-black transition-all tap-target"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="h-8 w-8 rounded-lg bg-neutral-200 flex items-center justify-center text-neutral-800">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900">Beneficiary / Caregiver</p>
                  <p className="text-[11px] text-neutral-500 font-medium">Siti Nurhaliza (Wheelchair Transit & Workshop)</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-neutral-400" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickSignIn('driver')}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 hover:border-black transition-all tap-target"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="h-8 w-8 rounded-lg bg-neutral-200 flex items-center justify-center text-neutral-800">
                  <Car className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900">Driver (Johan)</p>
                  <p className="text-[11px] text-neutral-500 font-medium">Accessible HiAce Commuter WVV 4108</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-neutral-400" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickSignIn('admin')}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 hover:border-black transition-all tap-target"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="h-8 w-8 rounded-lg bg-neutral-200 flex items-center justify-center text-neutral-800">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900">Administrator (Supervisor)</p>
                  <p className="text-[11px] text-neutral-500 font-medium">Faridah (Transit Dispatch & Workshop Payroll)</p>
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

