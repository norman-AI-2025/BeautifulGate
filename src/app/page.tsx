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
  UserPlus,
  Star
} from 'lucide-react';
import { UserRole } from '@/types';

export default function HomePage() {
  const { currentUser, profiles, bookings } = useApp();
  const { t } = useLanguage();

  // Find assigned driver profile and rating from bookings if any
  const driverProfile = profiles.find(p => p.role === 'driver');
  const vehiclePlate = driverProfile?.assigned_vehicle_plate || 'WVV 4108';
  const driverName = driverProfile?.full_name || 'Johan bin Ariffin';
  const driverAvatar = driverProfile?.avatar_url || '/images/driver-johan.jpg';

  const ratedBookings = bookings.filter(b => typeof b.rating === 'number' && b.rating > 0);
  const averageRating = ratedBookings.length > 0 
    ? (ratedBookings.reduce((sum, b) => sum + (b.rating || 0), 0) / ratedBookings.length).toFixed(1)
    : '5.0';

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

      {/* Fleet Physical Layout Specification Callout */}
      <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-neutral-900 bg-neutral-900 text-white p-6 sm:p-8 lg:p-10 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Vehicle & Driver Visual Showcase */}
            <div className="lg:col-span-5 space-y-4">
              {/* Van Image Container with Plate Badge */}
              <div className="relative h-56 sm:h-64 w-full rounded-2xl overflow-hidden border border-neutral-700/80 shadow-md group">
                <Image
                  src="/images/toyota-hiace-van.jpg"
                  alt="Toyota HiAce Commuter Van"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Floating Plate & Vehicle Badge */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm px-3 py-1 rounded-xl bg-white text-neutral-900 shadow-md border border-neutral-300">
                      {vehiclePlate}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-lg bg-orange-500/90 text-white backdrop-blur-xs">
                      Toyota HiAce
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-400 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-lg flex items-center gap-1 border border-emerald-500/30">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    Hydraulic Lift
                  </span>
                </div>
              </div>

              {/* Dedicated Driver Profile Card */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-800/80 p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-14 w-14 rounded-2xl overflow-hidden border-2 border-orange-400 shadow-md shrink-0">
                    <Image
                      src={driverAvatar}
                      alt={driverName}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute bottom-0.5 right-0.5 bg-emerald-600 text-white rounded-full p-0.5 shadow-xs">
                      <CheckCircle2 className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-400">
                        {t('nav.driverRole', 'Dedicated Driver')}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-white truncate">
                      {driverName}
                    </h4>
                    <p className="text-[11px] text-neutral-400 truncate">
                      {driverProfile?.driver_license || 'GDL Certified Transit Operator'}
                    </p>
                  </div>
                </div>

                {/* Driver Rating Badge */}
                <div className="text-right shrink-0 pl-2">
                  <div className="inline-flex items-center gap-1 bg-amber-400/20 border border-amber-400/30 px-2.5 py-1 rounded-xl text-amber-300">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-mono font-black text-xs">{averageRating}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">
                    {ratedBookings.length > 0 ? `${ratedBookings.length} reviews` : 'Top Rated'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Original Vehicle Descriptions & Seating Specs */}
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

              {/* Seating Rows Specification */}
              <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
                <div className="rounded-xl bg-neutral-800 p-3 border border-neutral-700/60">
                  <p className="text-neutral-400 font-medium">{t('home.row1Cab', 'Row 1 Cab')}</p>
                  <p className="font-bold text-white mt-1">{t('home.row1Desc', 'Driver + 1 Pax')}</p>
                </div>
                <div className="rounded-xl bg-neutral-800 p-3 border border-neutral-700/60">
                  <p className="text-neutral-400 font-medium">{t('home.row2Cabin', 'Row 2 Cabin')}</p>
                  <p className="font-bold text-white mt-1">{t('home.row2Desc', '4 Regular Seats')}</p>
                </div>
                <div className="rounded-xl bg-neutral-800 p-3 border border-neutral-700/60">
                  <p className="text-neutral-400 font-medium">{t('home.row3Rear', 'Row 3 Rear')}</p>
                  <p className="font-bold text-white mt-1">{t('home.row3Desc', '2 Wheelchair Bays')}</p>
                </div>
              </div>

              {/* Technical Spec List */}
              <div className="rounded-2xl bg-neutral-800/90 border border-neutral-700 p-4 sm:p-5 space-y-3">
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
        </div>
      </section>
    </div>
  );
}
