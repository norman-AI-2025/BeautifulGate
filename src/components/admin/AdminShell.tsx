'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { UserAvatar } from '@/components/UserAvatar';
import { ProfileModal } from '@/components/ProfileModal';
import { 
  LayoutDashboard, 
  Car, 
  Sparkles, 
  HeartHandshake, 
  Users, 
  Bell, 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X, 
  LogOut, 
  ShieldCheck, 
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    isLoaded, 
    currentUser, 
    bookings, 
    driverLeaves, 
    logout 
  } = useApp();
  const { t, language, setLanguage } = useLanguage();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('month');

  const notifRef = useRef<HTMLDivElement>(null);

  // Close notifications dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Auth gate check
  useEffect(() => {
    if (isLoaded) {
      if (!currentUser || currentUser.role !== 'admin') {
        router.replace('/login');
      }
    }
  }, [isLoaded, currentUser, router]);

  // Pending counters
  const pendingBookingsCount = bookings.filter(b => b.status === 'pending').length;
  const pendingLeavesCount = driverLeaves.filter(l => l.status === 'pending').length;
  const pendingDonationsCount = bookings.filter(
    b => b.donation && b.donation.method === 'cash' && b.donation.status === 'pledged'
  ).length;
  const totalAlertsCount = pendingBookingsCount + pendingLeavesCount + pendingDonationsCount;

  if (!isLoaded || !currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#18181B] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-[#F37021] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-neutral-400">Loading Beautiful Gate System...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      group: t('adminNav.general', 'GENERAL'),
      items: [
        {
          name: t('adminNav.dashboard', 'Dashboard'),
          href: '/admin',
          icon: LayoutDashboard,
          badge: null,
          isActive: pathname === '/admin',
        },
        {
          name: t('adminNav.dispatch', 'Transit Dispatch'),
          href: '/admin/dispatch',
          icon: Car,
          badge: pendingBookingsCount > 0 ? pendingBookingsCount : null,
          badgeColor: 'bg-[#F37021] text-white',
          isActive: pathname === '/admin/dispatch',
        },
        {
          name: t('adminNav.workshop', 'Workshop & Artisans'),
          href: '/admin/artisans',
          icon: Sparkles,
          badge: null,
          isActive: pathname === '/admin/artisans',
        },
      ]
    },
    {
      group: t('adminNav.finance', 'FINANCE & AUDIT'),
      items: [
        {
          name: t('adminNav.donations', 'Donation Tracker'),
          href: '/admin/donations',
          icon: HeartHandshake,
          badge: pendingDonationsCount > 0 ? pendingDonationsCount : null,
          badgeColor: 'bg-amber-500 text-white',
          isActive: pathname === '/admin/donations',
        },
      ]
    },
    {
      group: t('adminNav.management', 'MANAGEMENT'),
      items: [
        {
          name: t('adminNav.directory', 'User Directory & Fleet'),
          href: '/admin/directory',
          icon: Users,
          badge: pendingLeavesCount > 0 ? pendingLeavesCount : null,
          badgeColor: 'bg-amber-500 text-white',
          isActive: pathname === '/admin/directory',
        },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-neutral-900 flex flex-col md:flex-row antialiased">
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* ================================================================ */}
      {/* LEFT NAVIGATION SIDEBAR (Revello SaaS Style)                     */}
      {/* ================================================================ */}
      <aside 
        className={`fixed md:sticky top-0 bottom-0 left-0 z-50 flex flex-col justify-between bg-white border-r border-neutral-200/90 transition-all duration-300 ease-in-out shrink-0 h-screen overflow-y-auto ${
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        <div className={`flex flex-col space-y-6 ${isCollapsed ? 'p-3 items-center' : 'p-4 sm:p-5'}`}>
          {/* Brand Header */}
          <div className={`flex w-full ${isCollapsed ? 'flex-col items-center gap-2.5' : 'items-center justify-between gap-3'}`}>
            <Link 
              href="/admin" 
              className="flex items-center justify-center focus:outline-none shrink-0 group"
            >
              <div className="h-10 w-10 rounded-xl bg-orange-50 border border-orange-200/80 p-1 flex items-center justify-center shrink-0 shadow-xs">
                <Image
                  src="/images/beautiful-gate-logo.png"
                  alt="Beautiful Gate Foundation"
                  width={34}
                  height={34}
                  className="object-contain"
                />
              </div>
              {!isCollapsed && (
                <div className="min-w-0 ml-3">
                  <h1 className="text-sm font-black tracking-tight text-neutral-900 truncate leading-none">
                    {t('brand.name', 'Beautiful Gate')}
                  </h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#F37021] block mt-1">
                    {t('adminNav.controlTower', 'Control Tower')}
                  </span>
                </div>
              )}
            </Link>

            {/* Collapse / Expand Toggle on Desktop */}
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer shrink-0"
              aria-label={isCollapsed ? t('adminNav.expandSidebar', 'Expand Sidebar') : t('adminNav.collapseSidebar', 'Collapse Sidebar')}
              title={isCollapsed ? t('adminNav.expandSidebar', 'Expand Sidebar') : t('adminNav.collapseSidebar', 'Collapse Sidebar')}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>

            {/* Close on Mobile */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation Groups */}
          <nav className="space-y-6 w-full">
            {navItems.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1 w-full">
                {!isCollapsed && (
                  <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                    {group.group}
                  </p>
                )}
                <div className="space-y-1 w-full">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={isCollapsed ? item.name : undefined}
                        className={`group relative flex items-center ${
                          isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
                        } rounded-xl text-xs font-semibold transition-all duration-150 ${
                          item.isActive
                            ? 'bg-[#F37021] text-white shadow-xs font-bold'
                            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80'
                        }`}
                      >
                        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 min-w-0'}`}>
                          <Icon className={`h-4 w-4 shrink-0 transition-colors ${
                            item.isActive ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-800'
                          }`} />
                          {!isCollapsed && (
                            <span className="truncate">{item.name}</span>
                          )}
                        </div>

                        {item.badge !== null && !isCollapsed && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold leading-none ${
                            item.isActive ? 'bg-white text-[#F37021]' : item.badgeColor || 'bg-neutral-200 text-neutral-700'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                        {item.badge !== null && isCollapsed && (
                          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#F37021] ring-2 ring-white" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Profile & Logout Card */}
        <div className="p-3 sm:p-4 border-t border-neutral-200/80 bg-neutral-50/60">
          {!isCollapsed ? (
            <div className="rounded-xl border border-neutral-200/80 bg-white p-3 shadow-2xs space-y-2.5">
              <div 
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition-opacity"
              >
                <UserAvatar
                  src={currentUser.avatar_url}
                  name={currentUser.full_name}
                  size={36}
                  className="rounded-xl border border-neutral-200"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-neutral-900 truncate">
                    {currentUser.full_name}
                  </p>
                  <p className="text-[10px] text-neutral-500 font-medium truncate">
                    {t('nav.supervisorRole', 'Supervisor')}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="text-neutral-500 hover:text-neutral-900 font-medium transition-colors"
                >
                  {t('profile.edit', 'Edit Profile')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    router.push('/login');
                  }}
                  className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 transition-colors"
                >
                  <LogOut className="h-3 w-3" />
                  <span>{t('auth.signOut', 'Sign Out')}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-2">
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                title={currentUser.full_name}
              >
                <UserAvatar
                  src={currentUser.avatar_url}
                  name={currentUser.full_name}
                  size={32}
                  className="rounded-xl"
                />
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                className="text-neutral-400 hover:text-rose-600 transition-colors"
                title={t('auth.signOut', 'Sign Out')}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ================================================================ */}
      {/* MAIN CONTENT AREA WITH TOP CONTROL BAR                           */}
      {/* ================================================================ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar (Revello style) */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200/90 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100"
              aria-label="Open Navigation Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Right Controls: Date Range, Notifications, Language */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
            {/* Date Range Selector Pill */}
            <div className="hidden lg:flex items-center rounded-xl bg-neutral-100 p-1 border border-neutral-200/80 text-xs">
              {(['today', 'week', 'month', 'year'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setDateRange(r)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all ${
                    dateRange === r
                      ? 'bg-white text-neutral-900 shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  {r === 'today' ? t('common.today', 'Today') : r === 'week' ? t('common.week', 'Week') : r === 'month' ? t('common.month', 'Month') : t('common.year', 'Year')}
                </button>
              ))}
            </div>

            {/* Language Switcher Pill */}
            <div className="flex items-center rounded-xl border border-neutral-200 bg-white p-0.5 shadow-2xs">
              {(['en', 'zh', 'ms'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                    language === lang
                      ? 'bg-[#F37021] text-white shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  {lang === 'zh' ? '中' : lang.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Notification Bell Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors shadow-2xs"
                aria-label="View notifications"
              >
                <Bell className="h-4 w-4" />
                {totalAlertsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#F37021] text-[9px] font-bold text-white shadow-2xs">
                    {totalAlertsCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-neutral-200 bg-white p-3 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                    <span className="text-xs font-bold text-neutral-900">
                      {t('adminNav.actionItems', 'Action Items')}
                    </span>
                    <span className="text-[10px] font-mono text-[#F37021] font-bold">
                      {totalAlertsCount} {t('adminNav.pendingAlert', 'Pending')}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs max-h-60 overflow-y-auto">
                    {pendingBookingsCount > 0 && (
                      <Link
                        href="/admin/dispatch"
                        onClick={() => setIsNotificationsOpen(false)}
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-orange-50/60 transition-colors"
                      >
                        <Car className="h-4 w-4 text-[#F37021] shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold text-neutral-900">
                            {pendingBookingsCount} {t('admin.pendingBookingsAlert', 'Pending Transit Bookings')}
                          </p>
                          <p className="text-[10px] text-neutral-500">
                            {t('admin.requiresAssignment', 'Requires supervisor assignment')}
                          </p>
                        </div>
                      </Link>
                    )}

                    {pendingLeavesCount > 0 && (
                      <Link
                        href="/admin/directory"
                        onClick={() => setIsNotificationsOpen(false)}
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-amber-50/60 transition-colors"
                      >
                        <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold text-neutral-900">
                            {pendingLeavesCount} {t('admin.pendingLeavesAlert', 'Driver Leave Requests')}
                          </p>
                          <p className="text-[10px] text-neutral-500">
                            {t('admin.requiresReview', 'Requires review before scheduling')}
                          </p>
                        </div>
                      </Link>
                    )}

                    {pendingDonationsCount > 0 && (
                      <Link
                        href="/admin/donations"
                        onClick={() => setIsNotificationsOpen(false)}
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-emerald-50/60 transition-colors"
                      >
                        <HeartHandshake className="h-4 w-4 text-emerald-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold text-neutral-900">
                            {pendingDonationsCount} {t('admin.pendingDonationsAlert', 'Driver Cash Collections')}
                          </p>
                          <p className="text-[10px] text-neutral-500">
                            {t('admin.awaitingConfirmation', 'Awaiting supervisor receipt confirmation')}
                          </p>
                        </div>
                      </Link>
                    )}

                    {totalAlertsCount === 0 && (
                      <div className="py-6 text-center text-neutral-400 text-xs">
                        <CheckCircle2 className="h-5 w-5 mx-auto text-emerald-500 mb-1" />
                        <span>{t('adminNav.allCaughtUp', 'All operational items are up to date!')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Canvas Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {children}
        </main>
      </div>

      {/* Admin Profile Modal */}
      {isProfileModalOpen && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          targetProfile={currentUser}
          mode="edit_self"
        />
      )}
    </div>
  );
}
