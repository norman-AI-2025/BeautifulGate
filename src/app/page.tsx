'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
  HeartHandshake, 
  Car, 
  Shield, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Calendar,
  Layers,
  FileSpreadsheet,
  UserPlus
} from 'lucide-react';
import { UserRole } from '@/types';

export default function HomePage() {
  const { currentUser, switchRole } = useApp();
  const { t } = useLanguage();

  const handleLaunchRole = (role: UserRole) => {
    switchRole(role);
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-neutral-900 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-24 border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Beautiful Gate Official NGO Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative h-24 w-24 sm:h-28 sm:w-28 flex items-center justify-center p-2.5 rounded-3xl bg-white shadow-md border border-neutral-200/80">
              <Image
                src="/images/beautiful-gate-logo.png"
                alt="Beautiful Gate Foundation for the Disabled"
                width={104}
                height={104}
                priority
                className="object-contain"
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1 text-xs font-semibold text-[#D9530F] mb-6">
            <span className="h-2 w-2 rounded-full bg-[#F37021]" />
            {t('home.pill', 'Beautiful Gate Foundation for the Disabled')}
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-neutral-900 leading-[1.1]">
            {t('home.title', 'Assisted Mobility & Artisan Workshop Platform')}
          </h1>

          {/* Quick Call-to-Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="px-8 py-4 rounded-2xl bg-[#F37021] hover:bg-[#D9530F] text-white font-extrabold text-base shadow-lg hover:shadow-xl transition-all flex items-center tap-target active:scale-95"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              {t('home.signUpNow', 'Sign Up Now')}
            </Link>

            <Link
              href="/login"
              className="px-7 py-4 rounded-2xl bg-[#18181B] hover:bg-black text-white font-extrabold text-base shadow-md hover:shadow-lg transition-all flex items-center tap-target active:scale-95"
            >
              <span>{t('auth.signIn', 'Sign In')}</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3 Core Architecture Modules */}
      <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center sm:text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            {t('home.subsystems', 'Engineered Subsystems')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 mt-1">
            {t('home.subsystemsTitle', 'Integrated Mobility & Artisan Workflows')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Beneficiary Portal */}
          <div className="rounded-3xl border border-neutral-200 bg-white p-7 shadow-xs flex flex-col justify-between hover:border-[#F37021] transition-all group">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#F37021] mb-6 group-hover:bg-[#F37021] group-hover:text-white transition-colors">
                <HeartHandshake className="h-6 w-6 stroke-[2]" />
              </div>
              <h3 className="text-xl font-extrabold tracking-tight text-neutral-900">
                {t('nav.portal', 'Beneficiary Portal')}
              </h3>
            </div>

            <div className="pt-6 mt-6 border-t border-neutral-100">
              <Link
                href="/portal"
                className="w-full py-3 px-4 rounded-xl bg-[#F37021] hover:bg-[#D9530F] text-white text-xs font-bold flex items-center justify-between shadow-xs tap-target"
              >
                <span>{t('home.launchPortal', 'Launch Beneficiary Portal')}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: Driver Console */}
          <div className="rounded-3xl border border-neutral-200 bg-white p-7 shadow-xs flex flex-col justify-between hover:border-[#18181B] transition-all group">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-800 mb-6 group-hover:bg-[#18181B] group-hover:text-white transition-colors">
                <Car className="h-6 w-6 stroke-[2]" />
              </div>
              <h3 className="text-xl font-extrabold tracking-tight text-neutral-900">
                {t('nav.driver', 'Driver Console')}
              </h3>
            </div>

            <div className="pt-6 mt-6 border-t border-neutral-100">
              <Link
                href="/driver"
                className="w-full py-3 px-4 rounded-xl bg-[#18181B] hover:bg-black text-white text-xs font-bold flex items-center justify-between shadow-xs tap-target"
              >
                <span>{t('home.launchDriver', 'Driver Console')}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Card 3: Control Tower */}
          <div className="rounded-3xl border border-neutral-200 bg-white p-7 shadow-xs flex flex-col justify-between hover:border-neutral-900 transition-all group">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-800 mb-6 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                <Shield className="h-6 w-6 stroke-[2]" />
              </div>
              <h3 className="text-xl font-extrabold tracking-tight text-neutral-900">
                {t('nav.admin', 'Supervisor Control Tower')}
              </h3>
            </div>

            <div className="pt-6 mt-6 border-t border-neutral-100">
              <Link
                href="/admin"
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-300 text-xs font-bold flex items-center justify-between shadow-xs tap-target"
              >
                <span>{t('home.launchAdmin', 'Supervisor Control Tower')}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Fleet Physical Layout Specification Callout */}
      <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-neutral-900 bg-neutral-900 text-white p-8 sm:p-10 shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                {t('home.vehicleManifest', 'Official NGO Vehicle Manifest')}
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {t('home.vehicleModel', 'Toyota HiAce High-Roof Commuter')}
              </h3>
              <p className="text-sm text-neutral-300 leading-relaxed">
                {t('home.vehiclePlate', 'White Pearl · Plate WVV 4108. Fitted with heavy-duty wheelchair lock-down floor clamps and rear hydraulic boarding lift.')}
              </p>

              <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
                <div className="rounded-xl bg-neutral-800 p-3">
                  <p className="text-neutral-400 font-medium">{t('home.row1Cab', 'Row 1 Cab')}</p>
                  <p className="font-bold text-white mt-1">{t('home.row1Desc', 'Driver + 1 Pax')}</p>
                </div>
                <div className="rounded-xl bg-neutral-800 p-3">
                  <p className="text-neutral-400 font-medium">{t('home.row2Cabin', 'Row 2 Cabin')}</p>
                  <p className="font-bold text-white mt-1">{t('home.row2Desc', '4 Regular Seats')}</p>
                </div>
                <div className="rounded-xl bg-neutral-800 p-3">
                  <p className="text-neutral-400 font-medium">{t('home.row3Rear', 'Row 3 Rear')}</p>
                  <p className="font-bold text-white mt-1">{t('home.row3Desc', '2 Wheelchair Bays')}</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl bg-neutral-800/90 border border-neutral-700 p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400">{t('home.totalCapacity', 'Total Seating Capacity')}</span>
                <span className="font-bold text-white">{t('home.totalCapacityVal', '7 Passengers')}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono border-t border-neutral-700/80 pt-2">
                <span className="text-neutral-400">{t('home.accessGear', 'Accessibility Gear')}</span>
                <span className="font-bold text-white">{t('home.accessGearVal', 'Hydraulic Lift')}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono border-t border-neutral-700/80 pt-2">
                <span className="text-neutral-400">{t('home.operatingRoute', 'Operating Route')}</span>
                <span className="font-bold text-white">{t('home.operatingRouteVal', "Hospital Tuanku Ja'afar")}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono border-t border-neutral-700/80 pt-2">
                <span className="text-neutral-400">{t('home.resorts', 'Partner Resorts')}</span>
                <span className="font-bold text-white">{t('home.resortsVal', 'The Datai, Desaru, Pangkor')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
