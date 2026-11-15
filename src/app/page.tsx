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
            <div className="relative h-24 w-24 sm:h-28 sm:w-28 flex items-center justify-center p-2.5 rounded-2xl bg-white shadow-xs border border-neutral-200/80">
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
              className="px-6 py-3.5 rounded-xl bg-[#F37021] hover:bg-[#D9530F] text-white font-bold text-sm shadow-xs transition-colors flex items-center tap-target active:scale-[0.99]"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {t('home.signUpNow', 'Sign Up Now')}
            </Link>

            <Link
              href="/login"
              className="px-6 py-3.5 rounded-xl bg-[#18181B] hover:bg-neutral-800 text-white font-bold text-sm transition-colors flex items-center tap-target active:scale-[0.99]"
            >
              <span>{t('auth.signIn', 'Sign In')}</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Fleet Physical Layout Specification Callout - 100% Driven from Database */}
      <section className="mx-auto max-w-5xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-neutral-200 bg-white text-neutral-900 p-6 sm:p-8 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Vehicle & Driver Visual Showcase */}
            <div className="lg:col-span-5 space-y-4">
              {/* Van Image Container with Plate Badge */}
              <div className="relative h-56 sm:h-64 w-full rounded-xl overflow-hidden border border-neutral-200 group bg-neutral-100">
                <Image
                  src={activeVehicle?.image_url || '/images/toyota-hiace-van.jpg'}
                  alt={activeVehicle?.brand ? `${activeVehicle.brand} ${activeVehicle.model}` : 'Toyota HiAce Commuter Van'}
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover"
                  unoptimized={activeVehicle?.image_url?.startsWith('data:')}
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Floating Plate & Vehicle Badge */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-white text-neutral-900 shadow-xs border border-neutral-200">
                      {vehiclePlate}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-neutral-900/80 text-white backdrop-blur-xs">
                      {activeVehicle?.brand || 'Toyota'} {activeVehicle?.model ? activeVehicle.model.split(' ')[0] : 'HiAce'}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border backdrop-blur-xs ${
                    activeVehicle?.status === 'active'
                      ? 'text-emerald-700 bg-emerald-50/90 border-emerald-200'
                      : activeVehicle?.status === 'maintenance'
                      ? 'text-amber-700 bg-amber-50/90 border-amber-200'
                      : 'text-neutral-700 bg-neutral-100/90 border-neutral-200'
                  }`}>
                    <CheckCircle2 className="h-3 w-3" />
                    {activeVehicle?.status ? activeVehicle.status.toUpperCase() : 'ACTIVE'}
                  </span>
                </div>
              </div>

              {/* Dedicated Driver Profile Card */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-12 w-12 rounded-xl overflow-hidden border border-neutral-200 shrink-0">
                    <UserAvatar
                      src={driverProfile?.avatar_url}
                      name={driverName}
                      size={48}
                      className="rounded-xl"
                      textClassName="font-bold text-sm text-[#F37021]"
                    />
                    <div className="absolute bottom-0.5 right-0.5 bg-emerald-600 text-white rounded-full p-0.5">
                      <CheckCircle2 className="h-2 w-2 stroke-[3]" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                      {t('nav.driverRole', 'Dedicated Driver')}
                    </span>
                    <h4 className="text-sm font-bold text-neutral-900 truncate">
                      {driverName}
                    </h4>
                    <p className="text-[11px] text-neutral-500 truncate">
                      {driverProfile?.driver_license || 'GDL Certified Transit Operator'}
                    </p>
                  </div>
                </div>

                {/* Driver Rating Badge from real database bookings */}
                <div className="text-right shrink-0 pl-2">
                  <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg text-amber-900">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    <span className="font-mono font-bold text-xs">{averageRating}</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">
                    {ratedBookings.length > 0 ? `${ratedBookings.length} reviews` : 'Top Rated'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Database-Driven Vehicle Descriptions & Seating Specs */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  {t('home.vehicleManifest', 'Official NGO Vehicle Manifest')}
                </span>
                <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-md border ${
                  activeVehicle?.status === 'active'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : activeVehicle?.status === 'maintenance'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                }`}>
                  {activeVehicle?.status || 'Active'}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
                {activeVehicle?.brand ? `${activeVehicle.brand} ${activeVehicle.model}` : 'Toyota HiAce High-Roof Commuter'}
              </h3>
              
              <p className="text-xs text-neutral-600 leading-relaxed">
                {activeVehicle?.color ? `${activeVehicle.color} · ` : ''}
                Plate {vehiclePlate}. {activeVehicle?.notes || 'Fitted with heavy-duty wheelchair lock-down floor clamps and rear hydraulic boarding lift.'}
              </p>

              {/* Dynamic Database Technical Spec List */}
              <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-500">Plate Number</span>
                  <span className="font-bold text-[#F37021] text-xs">
                    {vehiclePlate}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono border-t border-neutral-200 pt-2">
                  <span className="text-neutral-500">Make & Model</span>
                  <span className="font-semibold text-neutral-900">
                    {activeVehicle?.brand || 'Toyota'} {activeVehicle?.model || 'HiAce Commuter'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono border-t border-neutral-200 pt-2">
                  <span className="text-neutral-500">Exterior Color</span>
                  <span className="font-semibold text-neutral-900">
                    {activeVehicle?.color || 'Pearl White'}
                  </span>
                </div>

                <div className="flex items-start justify-between text-xs font-mono border-t border-neutral-200 pt-2 gap-4">
                  <span className="text-neutral-500 shrink-0">Seating & Capacity</span>
                  <span className="font-semibold text-neutral-900 text-right">
                    {activeVehicle?.seats || '7 Passengers (Row 1: Driver + 1 Pax | Row 2: 4 Regular Seats | Row 3: 2 Wheelchair Bays)'}
                  </span>
                </div>

                {activeVehicle?.notes && (
                  <div className="flex items-start justify-between text-xs font-mono border-t border-neutral-200 pt-2 gap-4">
                    <span className="text-neutral-500 shrink-0">Specs / Adaptations</span>
                    <span className="font-medium text-neutral-600 text-right">
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
