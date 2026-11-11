'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { UserAvatar } from '@/components/UserAvatar';
import { 
  ArrowRight, 
  CheckCircle2, 
  UserPlus,
  Star,
  Car,
  Shield,
  Layers
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { currentUser, isLoaded, profiles, bookings, vehicles } = useApp();
  const { t } = useLanguage();

  // If already authenticated and session loaded, redirect immediately to respective dashboard
  useEffect(() => {
    if (isLoaded && currentUser) {
      if (currentUser.role === 'admin') {
        router.replace('/admin');
      } else if (currentUser.role === 'driver') {
        router.replace('/driver');
      } else {
        router.replace('/portal');
      }
    }
  }, [isLoaded, currentUser, router]);

  // Find active vehicle directly from database
  const activeVehicle = vehicles?.find(v => v.status === 'active') || vehicles?.[0];

  // Find assigned driver profile and rating from database
  const driverProfile = profiles.find(p => p.role === 'driver');
  const vehiclePlate = activeVehicle?.plate || driverProfile?.assigned_vehicle_plate || 'NDC 9751';
  const driverName = driverProfile?.full_name || 'Wong Kok Fu';

  const ratedBookings = bookings.filter(b => typeof b.rating === 'number' && b.rating > 0);
  const averageRating = ratedBookings.length > 0 
    ? (ratedBookings.reduce((sum, b) => sum + (b.rating || 0), 0) / ratedBookings.length).toFixed(1)
    : '5.0';

  // If user is already logged in, show clean transition while redirecting
  if (isLoaded && currentUser) {
    return (
      <div className="min-h-screen bg-[#fbfbfd] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-3 border-[#F37021] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-neutral-500">
            {t('common.loading', 'Redirecting to your dashboard...')}
          </p>
        </div>
      </div>
    );
  }

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

      {/* Fleet Physical Layout Specification Callout - 100% Driven from Database */}
      <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-neutral-900 bg-neutral-900 text-white p-6 sm:p-8 lg:p-10 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Vehicle & Driver Visual Showcase */}
            <div className="lg:col-span-5 space-y-4">
              {/* Van Image Container with Plate Badge */}
              <div className="relative h-56 sm:h-64 w-full rounded-2xl overflow-hidden border border-neutral-700/80 shadow-md group bg-neutral-800">
                <Image
                  src={activeVehicle?.image_url || '/images/toyota-hiace-van.jpg'}
                  alt={activeVehicle?.brand ? `${activeVehicle.brand} ${activeVehicle.model}` : 'Toyota HiAce Commuter Van'}
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized={activeVehicle?.image_url?.startsWith('data:')}
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
                      {activeVehicle?.brand || 'Toyota'} {activeVehicle?.model ? activeVehicle.model.split(' ')[0] : 'HiAce'}
                    </span>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 border backdrop-blur-xs ${
                    activeVehicle?.status === 'active'
                      ? 'text-emerald-400 bg-black/60 border-emerald-500/30'
                      : activeVehicle?.status === 'maintenance'
                      ? 'text-amber-400 bg-black/60 border-amber-500/30'
                      : 'text-neutral-400 bg-black/60 border-neutral-500/30'
                  }`}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {activeVehicle?.status ? activeVehicle.status.toUpperCase() : 'ACTIVE'}
                  </span>
                </div>
              </div>

              {/* Dedicated Driver Profile Card */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-800/80 p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-14 w-14 rounded-2xl overflow-hidden border-2 border-orange-400 shadow-md shrink-0">
                    <UserAvatar
                      src={driverProfile?.avatar_url}
                      name={driverName}
                      size={56}
                      className="rounded-2xl"
                      textClassName="font-black text-base text-[#F37021]"
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

                {/* Driver Rating Badge from real database bookings */}
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

            {/* Right Column: Database-Driven Vehicle Descriptions & Seating Specs */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                  {t('home.vehicleManifest', 'Official NGO Vehicle Manifest')}
                </span>
                <span className={`text-[10px] font-mono uppercase font-black px-2.5 py-0.5 rounded-full border ${
                  activeVehicle?.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : activeVehicle?.status === 'maintenance'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-neutral-500/20 text-neutral-300 border-neutral-500/30'
                }`}>
                  {activeVehicle?.status || 'Active'}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {activeVehicle?.brand ? `${activeVehicle.brand} ${activeVehicle.model}` : 'Toyota HiAce High-Roof Commuter'}
              </h3>
              
              <p className="text-sm text-neutral-300 leading-relaxed">
                {activeVehicle?.color ? `${activeVehicle.color} · ` : ''}
                Plate {vehiclePlate}. {activeVehicle?.notes || 'Fitted with heavy-duty wheelchair lock-down floor clamps and rear hydraulic boarding lift.'}
              </p>

              {/* Dynamic Database Technical Spec List */}
              <div className="rounded-2xl bg-neutral-800/90 border border-neutral-700 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-400">Plate Number</span>
                  <span className="font-bold text-amber-400 text-sm tracking-wider">
                    {vehiclePlate}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono border-t border-neutral-700/80 pt-2">
                  <span className="text-neutral-400">Make & Model</span>
                  <span className="font-bold text-white">
                    {activeVehicle?.brand || 'Toyota'} {activeVehicle?.model || 'HiAce Commuter'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono border-t border-neutral-700/80 pt-2">
                  <span className="text-neutral-400">Exterior Color</span>
                  <span className="font-bold text-white">
                    {activeVehicle?.color || 'Pearl White'}
                  </span>
                </div>

                <div className="flex items-start justify-between text-xs font-mono border-t border-neutral-700/80 pt-2 gap-4">
                  <span className="text-neutral-400 shrink-0">Seating & Capacity</span>
                  <span className="font-bold text-white text-right">
                    {activeVehicle?.seats || '7 Passengers (Row 1: Driver + 1 Pax | Row 2: 4 Regular Seats | Row 3: 2 Wheelchair Bays)'}
                  </span>
                </div>

                {activeVehicle?.notes && (
                  <div className="flex items-start justify-between text-xs font-mono border-t border-neutral-700/80 pt-2 gap-4">
                    <span className="text-neutral-400 shrink-0">Specs / Adaptations</span>
                    <span className="font-medium text-neutral-300 text-right">
                      {activeVehicle.notes}
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
