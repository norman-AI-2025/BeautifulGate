'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Users, 
  Car, 
  Calendar, 
  Search, 
  X, 
  Check, 
  Phone, 
  Mail, 
  Lock, 
  Eye, 
  Edit3, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  Accessibility, 
  User, 
  AlertCircle
} from 'lucide-react';
import Image from 'next/image';
import { ProfileModal } from '@/components/ProfileModal';
import { VehicleModal } from '@/components/VehicleModal';
import { UserAvatar } from '@/components/UserAvatar';
import { Profile } from '@/types';
import { formatPhoneNumber, formatICNumber } from '@/lib/formatters';

export default function AdminDirectoryPage() {
  const { 
    currentUser,
    profiles, 
    vehicles, 
    driverLeaves, 
    approveDriverLeave, 
    rejectDriverLeave, 
    approveDriverAccount, 
    deleteProfile 
  } = useApp();
  const { t } = useLanguage();

  // User Directory & Driver Management states
  const [directorySearchQuery, setDirectorySearchQuery] = useState('');
  const [directoryRoleFilter, setDirectoryRoleFilter] = useState<'all' | 'customer' | 'driver' | 'admin' | 'pending_approval'>('all');
  const [selectedProfileForModal, setSelectedProfileForModal] = useState<Profile | null>(null);
  const [profileModalMode, setProfileModalMode] = useState<'admin_manage_driver' | 'admin_view' | 'edit_self'>('admin_view');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<Profile | null>(null);
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);

  const handleConfirmDelete = async () => {
    if (!profileToDelete) return;
    setIsDeletingProfile(true);
    await deleteProfile(profileToDelete.id);
    setIsDeletingProfile(false);
    setProfileToDelete(null);
  };

  // Helper to localize mobility requirement types across languages
  const getLocalizedMobility = (mobility: string | undefined): string => {
    switch (mobility) {
      case 'Manual Wheelchair':
        return t('profile.mobilityManualWheelchair', 'Manual Wheelchair');
      case 'Motorized Wheelchair':
        return t('profile.mobilityMotorizedWheelchair', 'Motorized Wheelchair');
      case 'Assisted Walk':
        return t('profile.mobilityAssistedWalk', 'Assisted Walk');
      case 'None':
        return t('profile.mobilityNone', 'None');
      case 'None / Escort':
        return t('profile.mobilityNoneEscort', 'None / Escort');
      default:
        return mobility || t('profile.mobilityNone', 'None');
    }
  };

  // Helper to localize driver leave reasons across languages
  const getLocalizedLeaveReason = (reason: string | undefined): string => {
    if (!reason) return '';
    const r = reason.toLowerCase();
    if (r.includes('annual')) return t('admin.leaveAnnual', 'Annual Leave');
    if (r.includes('medical') || r.includes('mc') || r.includes('sick')) return t('admin.leaveMedical', 'Medical Leave (MC)');
    if (r.includes('emergency')) return t('admin.leaveEmergency', 'Personal Emergency');
    if (r.includes('hospital')) return t('admin.leaveHospital', 'Hospital Follow-up');
    return reason;
  };

  // Helper to localize vehicle color across languages
  const getLocalizedVehicleColor = (color: string | undefined): string => {
    if (!color) return '';
    if (color.toLowerCase().includes('pearl white')) return t('admin.colorPearlWhite', 'Pearl White');
    if (color.toLowerCase().includes('white')) return t('admin.colorWhite', 'White');
    return color;
  };

  // Helper to localize vehicle seating description across languages
  const getLocalizedVehicleSeats = (seats: string | undefined): string => {
    if (!seats) return '';
    if (seats.includes('7 Passengers') || seats.includes('Wheelchair Bays')) {
      return t('admin.vehicleSeatsDesc', '7 Passengers (Row 1: Driver + 1 Pax | Row 2: 4 Regular Seats | Row 3: 2 Wheelchair Bays)');
    }
    return seats;
  };

  // Helper to localize vehicle notes across languages
  const getLocalizedVehicleNotes = (notes: string | undefined): string => {
    if (!notes) return t('admin.fleetAssetNotes', 'Fleet vehicle managed by Beautiful Gate Foundation');
    if (notes.includes('hydraulic boarding lift') || notes.includes('rear hydraulic')) {
      return t('admin.vehicleNotesDesc', 'Fitted with rear hydraulic boarding lift and floor clamps');
    }
    return notes;
  };

  // User Directory filtering
  const pendingStaffCount = useMemo(() => {
    return profiles.filter(p => (p.role === 'driver' || p.role === 'admin') && p.is_approved === false).length;
  }, [profiles]);

  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      if (directoryRoleFilter === 'pending_approval') {
        return (p.role === 'driver' || p.role === 'admin') && p.is_approved === false;
      }
      if (directoryRoleFilter !== 'all' && p.role !== directoryRoleFilter) return false;
      if (!directorySearchQuery.trim()) return true;
      const q = directorySearchQuery.toLowerCase();
      return (
        p.full_name.toLowerCase().includes(q) ||
        (p.chinese_name && p.chinese_name.toLowerCase().includes(q)) ||
        (p.epf_number && p.epf_number.toLowerCase().includes(q)) ||
        (p.welfare_number && p.welfare_number.toLowerCase().includes(q)) ||
        p.ic_or_oku_number.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q) ||
        (p.address && p.address.toLowerCase().includes(q))
      );
    });
  }, [profiles, directoryRoleFilter, directorySearchQuery]);

  const handleManageDriver = (driverProf: Profile) => {
    setSelectedProfileForModal(driverProf);
    setProfileModalMode('admin_manage_driver');
    setIsProfileModalOpen(true);
  };

  const handleViewProfile = (userProf: Profile) => {
    setSelectedProfileForModal(userProf);
    setProfileModalMode('admin_view');
    setIsProfileModalOpen(true);
  };

  const activeVehicle = vehicles?.[0] || {
    id: 'veh-hiace-ndc9751',
    plate: 'NDC 9751',
    brand: 'Toyota',
    model: 'HiAce High-Roof Commuter',
    color: 'Pearl White',
    seats: '7 Passengers (Row 1: Driver + 1 Pax | Row 2: 4 Regular Seats | Row 3: 2 Wheelchair Bays)',
    image_url: '/images/toyota-hiace-van.jpg',
    status: 'active' as const,
    notes: 'Fitted with rear hydraulic boarding lift and floor clamps',
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
          {t('admin.directoryTitle', 'User Directory & Driver Management')}
        </h1>
        <p className="text-sm text-neutral-500 font-medium mt-0.5">
          {t('admin.directorySubtitle', 'Oversee foundation community profiles, fleet vehicles, and staff operations')}
        </p>
      </div>

      {/* Fleet Asset Card */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
              <Car className="h-4 w-4 text-[#F37021]" />
            </div>
            <div>
              <h3 className="text-base font-black text-neutral-900">
                {activeVehicle.brand} {activeVehicle.model}
              </h3>
              <p className="text-xs text-neutral-500 font-medium">
                {getLocalizedVehicleNotes(activeVehicle.notes)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="font-mono font-black text-xs px-3 py-1 rounded-xl bg-orange-50 text-[#F37021] border border-orange-200 shadow-xs">
              {activeVehicle.plate}
            </span>
            <button
              type="button"
              onClick={() => setIsVehicleModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#F37021] hover:bg-[#D9530F] text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>{t('admin.editVehicle', 'Edit Vehicle')}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Vehicle Image */}
          <div className="md:col-span-4 relative h-48 w-full rounded-2xl overflow-hidden border border-neutral-200 shadow-xs group bg-neutral-100">
            <Image
              src={activeVehicle.image_url || '/images/toyota-hiace-van.jpg'}
              alt={`${activeVehicle.brand} ${activeVehicle.model}`}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              unoptimized={activeVehicle.image_url?.startsWith('data:')}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2">
              <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-lg bg-white text-neutral-900 shadow-xs">
                {activeVehicle.plate}
              </span>
              <span className="text-[10px] font-bold text-white bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-lg">
                {activeVehicle.brand} {activeVehicle.model}
              </span>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl bg-neutral-50/70 p-4 border border-neutral-200/80">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                {t('admin.carPlateLabel', 'Car Plate')}
              </span>
              <span className="font-mono font-black text-base text-neutral-900 mt-1 block">
                {activeVehicle.plate}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md mt-1.5 inline-block ${
                activeVehicle.status === 'active' 
                  ? 'text-emerald-700 bg-emerald-100'
                  : activeVehicle.status === 'maintenance'
                  ? 'text-rose-700 bg-rose-100'
                  : 'text-amber-700 bg-amber-100'
              }`}>
                {activeVehicle.status === 'active' ? t('admin.activeOperation', 'Active Operation') : activeVehicle.status === 'maintenance' ? t('admin.underMaintenance', 'Under Maintenance') : t('admin.standbyReserve', 'Standby Reserve')}
              </span>
            </div>

            <div className="rounded-2xl bg-neutral-50/70 p-4 border border-neutral-200/80">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                {t('admin.colourLabel', 'Colour')}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="h-3.5 w-3.5 rounded-full bg-white border-2 border-neutral-400 shadow-xs shrink-0" />
                <span className="font-bold text-sm text-neutral-900 truncate">
                  {getLocalizedVehicleColor(activeVehicle.color)}
                </span>
              </div>
              <span className="text-[10px] text-neutral-500 font-medium block mt-1.5 truncate">
                {t('admin.factoryExteriorFinish', 'Factory Exterior Finish')}
              </span>
            </div>

            <div className="rounded-2xl bg-neutral-50/70 p-4 border border-neutral-200/80">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                {t('admin.seatingsLabel', 'Seatings')}
              </span>
              <span className="font-black text-sm text-neutral-900 mt-1 block">
                {t('admin.accessibleLayout', 'Accessible Layout')}
              </span>
              <p className="text-[10px] text-neutral-600 mt-1 font-medium leading-relaxed line-clamp-3">
                {getLocalizedVehicleSeats(activeVehicle.seats)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Leave Management Section */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-neutral-900">
                {t('admin.leaveRequestsTitle', 'Driver Leave Requests & Approvals')}
              </h3>
              <p className="text-xs text-neutral-500 font-medium">
                {t('admin.leaveRequestsDesc', 'Approved leave blocks beneficiary transport bookings and marks driver as on leave')}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 self-start sm:self-auto font-mono">
            {driverLeaves.filter(l => l.status === 'pending').length} {t('admin.pendingReview', 'Pending Review')}
          </span>
        </div>

        {driverLeaves.length === 0 ? (
          <div className="text-center py-6 text-neutral-400 text-xs font-medium">
            {t('admin.noLeaveRequests', 'No driver leave requests recorded.')}
          </div>
        ) : (
          <div className="space-y-2.5">
            {driverLeaves.map(leave => (
              <div key={leave.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-neutral-200/80 bg-neutral-50/60">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-sm text-neutral-900">{leave.driver_name}</span>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white border border-neutral-200 text-neutral-700">
                      {leave.date}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      leave.status === 'approved' 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : leave.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {leave.status === 'approved' ? t('admin.statusApprovedBlocked', 'Approved · Bookings Blocked') : leave.status === 'rejected' ? t('admin.statusRejected', 'Rejected') : t('admin.statusPendingApproval', 'Pending Approval')}
                    </span>
                  </div>
                  {leave.reason && (
                    <p className="text-xs text-neutral-600 font-medium">
                      {t('admin.leaveReasonLabel', 'Reason')}: {getLocalizedLeaveReason(leave.reason)}
                    </p>
                  )}
                  {leave.approved_by && (
                    <p className="text-[10px] text-neutral-400 font-medium">
                      {t('admin.reviewedByLabel', 'Reviewed by')}: {leave.approved_by}
                    </p>
                  )}
                </div>

                {leave.status === 'pending' && (
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => approveDriverLeave(leave.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1 shadow-xs transition-all active:scale-95"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>{t('admin.approve', 'Approve')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectDriverLeave(leave.id)}
                      className="px-3 py-1.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 text-rose-600 font-bold text-xs flex items-center gap-1 shadow-xs transition-all active:scale-95"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>{t('admin.reject', 'Reject')}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Metric KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
            {t('admin.totalUsers', 'Total Users')}
          </span>
          <span className="text-2xl font-black text-neutral-900 font-mono mt-0.5 block tabular-nums">
            {profiles.length}
          </span>
        </div>
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
            {t('admin.totalBeneficiaries', 'Beneficiaries')}
          </span>
          <span className="text-2xl font-black text-emerald-800 font-mono mt-0.5 block tabular-nums">
            {profiles.filter(p => p.role === 'customer').length}
          </span>
        </div>
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-bold text-[#F37021] uppercase tracking-wider block">
            {t('admin.totalDrivers', 'Active Drivers')}
          </span>
          <span className="text-2xl font-black text-[#D9530F] font-mono mt-0.5 block tabular-nums">
            {profiles.filter(p => p.role === 'driver').length}
          </span>
        </div>
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
            {t('admin.filterAdmins', 'Administrators')}
          </span>
          <span className="text-2xl font-black text-purple-900 font-mono mt-0.5 block tabular-nums">
            {profiles.filter(p => p.role === 'admin').length}
          </span>
        </div>
      </div>

      {/* Filter Pills & Search Bar */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Role Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-neutral-100 rounded-xl">
            <button
              type="button"
              onClick={() => setDirectoryRoleFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                directoryRoleFilter === 'all'
                  ? 'bg-[#F37021] text-white shadow-xs font-black'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              {t('admin.filterAll', 'All Profiles')} ({profiles.length})
            </button>
            <button
              type="button"
              onClick={() => setDirectoryRoleFilter('customer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                directoryRoleFilter === 'customer'
                  ? 'bg-[#F37021] text-white shadow-xs font-black'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              {t('admin.filterBeneficiaries', 'Beneficiaries')} ({profiles.filter(p => p.role === 'customer').length})
            </button>
            <button
              type="button"
              onClick={() => setDirectoryRoleFilter('driver')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                directoryRoleFilter === 'driver'
                  ? 'bg-[#F37021] text-white shadow-xs font-black'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              {t('admin.filterDrivers', 'Drivers')} ({profiles.filter(p => p.role === 'driver').length})
            </button>
            <button
              type="button"
              onClick={() => setDirectoryRoleFilter('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                directoryRoleFilter === 'admin'
                  ? 'bg-[#F37021] text-white shadow-xs font-black'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              {t('admin.filterAdmins', 'Administrators')} ({profiles.filter(p => p.role === 'admin').length})
            </button>
            <button
              type="button"
              onClick={() => setDirectoryRoleFilter('pending_approval')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                directoryRoleFilter === 'pending_approval'
                  ? 'bg-amber-500 text-white shadow-xs font-black'
                  : pendingStaffCount > 0
                  ? 'bg-amber-100 text-amber-900 font-extrabold hover:bg-amber-200'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <span>{t('admin.pendingApprovalTab', 'Pending Staff Approval')}</span>
              {pendingStaffCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                  directoryRoleFilter === 'pending_approval' ? 'bg-white text-amber-900' : 'bg-amber-500 text-white'
                }`}>
                  {pendingStaffCount}
                </span>
              )}
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={directorySearchQuery}
              onChange={(e) => setDirectorySearchQuery(e.target.value)}
              placeholder={t('admin.searchDirectoryPlaceholder', 'Search by name, IC/OKU, phone...')}
              className="w-full pl-8 pr-8 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#F37021]/30 focus:border-[#F37021]"
            />
            <Search className="h-3.5 w-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            {directorySearchQuery && (
              <button
                type="button"
                onClick={() => setDirectorySearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Profiles Table */}
        <div className="overflow-x-auto rounded-xl border border-neutral-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50/80 text-neutral-500 font-bold uppercase tracking-wider text-[10px] border-b border-neutral-200">
              <tr>
                <th className="py-3 px-4">{t('admin.tableUser', 'User')}</th>
                <th className="py-3 px-4">{t('admin.tableRole', 'Role & ID')}</th>
                <th className="py-3 px-4">{t('admin.tableContact', 'Contact')}</th>
                <th className="py-3 px-4">{t('admin.tableDetails', 'Details / Assignment')}</th>
                <th className="py-3 px-4 text-right">{t('admin.tableAction', 'Access & Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {filteredProfiles.map((p) => {
                const isDriver = p.role === 'driver';

                return (
                  <tr 
                    key={p.id}
                    className="hover:bg-neutral-50/80 transition-colors"
                  >
                    {/* User Photo & Name */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          src={p.avatar_url}
                          name={p.full_name}
                          size={40}
                          className="rounded-xl border border-neutral-200"
                        />
                        <div>
                          <p className="font-extrabold text-neutral-900 text-sm flex items-center gap-1.5">
                            <span>{p.full_name}</span>
                            {p.chinese_name && (
                              <span className="text-xs font-semibold text-neutral-500">
                                ({p.chinese_name})
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-neutral-400 font-mono">
                            {p.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role & ID */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isDriver
                              ? 'bg-[#F37021] text-white'
                              : p.role === 'admin'
                              ? 'bg-purple-100 text-purple-900 border border-purple-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}>
                            {isDriver ? <Car className="h-3 w-3" /> : <User className="h-3 w-3" />}
                            {p.role === 'customer' 
                              ? t('auth.beneficiaryRole', 'Beneficiary')
                              : isDriver 
                              ? t('auth.driverStaffRole', 'Driver')
                              : t('nav.supervisorRole', 'Supervisor')}
                          </span>
                          {p.role === 'customer' && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              p.beneficiary_type === 'daycare'
                                ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                : p.beneficiary_type === 'non_resident'
                                ? 'bg-neutral-100 text-neutral-700 border border-neutral-300'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            }`}>
                              {p.beneficiary_type === 'daycare' 
                                ? t('profile.beneficiaryDaycareBadge', 'Daycare')
                                : p.beneficiary_type === 'non_resident'
                                ? t('profile.beneficiaryNonResidentBadge', 'Non-Resident')
                                : t('profile.beneficiaryResidentBadge', 'Resident')}
                            </span>
                          )}
                          {(isDriver || p.role === 'admin') && (
                            p.is_approved === false ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200">
                                <Clock className="h-2.5 w-2.5 text-amber-700" />
                                {t('admin.pendingApprovalBadge', 'Pending Admin Approval')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-900 border border-emerald-200">
                                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-700" />
                                {t('admin.approvedBadge', 'Approved')}
                              </span>
                            )
                          )}
                        </div>
                        <p className="font-mono text-xs text-neutral-700 font-semibold">
                          {formatICNumber(p.ic_or_oku_number)}
                        </p>
                        {p.welfare_number && (
                          <p className="font-mono text-[10px] text-orange-700 font-semibold">
                            {t('profile.welfareNumber', 'Welfare')}: {p.welfare_number}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-0.5 text-xs">
                        <p className="font-medium text-neutral-800 flex items-center gap-1.5 font-mono">
                          <Phone className="h-3 w-3 text-neutral-400" />
                          {formatPhoneNumber(p.phone)}
                        </p>
                        <p className="text-neutral-500 font-mono text-[11px] flex items-center gap-1.5">
                          <Mail className="h-3 w-3 text-neutral-400" />
                          {p.email}
                        </p>
                      </div>
                    </td>

                    {/* Details / Assignment */}
                    <td className="py-3.5 px-4">
                      {isDriver ? (
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-950 border border-orange-200">
                              {p.assigned_vehicle_plate || t('common.unassigned', 'Unassigned')}
                            </span>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              p.driver_status === 'on_leave'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : p.driver_status === 'standby'
                                ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            }`}>
                              {p.driver_status === 'on_leave' 
                                ? t('admin.onLeaveStatus', 'On Leave')
                                : p.driver_status === 'standby'
                                ? t('admin.standbyStatus', 'Standby')
                                : t('admin.activeStatus', 'Active')}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-500 font-medium truncate max-w-xs">
                            {p.driver_license && !p.driver_license.toLowerCase().includes('gdl')
                              ? p.driver_license
                              : t('admin.gdlCertified', 'GDL Certified Transit Operator')}
                          </p>
                        </div>
                      ) : p.role === 'customer' ? (
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded-md">
                              <Accessibility className="h-3 w-3 text-[#F37021]" />
                              {getLocalizedMobility(p.mobility_type)}
                            </span>
                            <span className="text-[10px] font-bold text-neutral-500">
                              {p.beneficiary_type === 'non_resident'
                                ? t('profile.vanTransitOnly', 'Van Transit Only')
                                : t('profile.workshopAndTransit', 'Workshop & Transit')}
                            </span>
                          </div>
                          {p.address && (
                            <p className="text-[11px] text-neutral-500 truncate max-w-xs">
                              {p.address}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-neutral-500 text-xs font-medium">
                          {t('admin.hqOperations', 'Headquarters Operations')}
                        </span>
                      )}
                    </td>

                    {/* Action Column */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {isDriver ? (
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="flex items-center gap-1.5">
                            {p.is_approved === false ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => approveDriverAccount(p.id)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1 shadow-xs transition-all active:scale-95"
                                  title={t('admin.approveStaffDriverTooltip', 'Approve driver for dispatch assignment')}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>{t('admin.approveStaff', 'Approve Driver')}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleManageDriver(p)}
                                  className="px-2.5 py-1.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 font-bold text-xs flex items-center gap-1"
                                >
                                  <Edit3 className="h-3 w-3" />
                                  <span>{t('admin.reviewStaff', 'Review')}</span>
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleManageDriver(p)}
                                className="px-3.5 py-1.5 rounded-xl bg-[#F37021] hover:bg-[#D9530F] text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                                <span>{t('admin.manageDriver', 'Manage Driver')}</span>
                              </button>
                            )}

                            {p.id !== currentUser?.id && (
                              <button
                                type="button"
                                onClick={() => setProfileToDelete(p)}
                                className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 transition-all shadow-xs"
                                title={t('admin.deleteDriverTitle', 'Delete Driver Account')}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                          <span className="text-[9px] font-bold text-orange-700 bg-orange-50 px-1.5 py-0.2 rounded">
                            {t('admin.manageableBadge', 'Administrator Managed')}
                          </span>
                        </div>
                      ) : p.role === 'admin' ? (
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="flex items-center gap-1.5">
                            {p.is_approved === false && (
                              <button
                                type="button"
                                onClick={() => approveDriverAccount(p.id)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1 shadow-xs transition-all active:scale-95"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>{t('admin.approveSupervisor', 'Approve Admin')}</span>
                              </button>
                            )}
                            {(p.id === currentUser?.id || p.email === currentUser?.email || currentUser?.role === 'admin') ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProfileForModal(p);
                                  setProfileModalMode('edit_self');
                                  setIsProfileModalOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-[#F37021] text-[#F37021] hover:text-white border border-orange-200 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                              >
                                <User className="h-3.5 w-3.5" />
                                <span>{t('profile.edit', 'Edit Profile')}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleViewProfile(p)}
                                className="px-3 py-1.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                              >
                                <Eye className="h-3.5 w-3.5 text-neutral-500" />
                                <span>{t('admin.viewProfile', 'View Profile')}</span>
                              </button>
                            )}

                            {p.id !== currentUser?.id && (
                              <button
                                type="button"
                                onClick={() => setProfileToDelete(p)}
                                className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 transition-all shadow-xs"
                                title={t('admin.deleteAccount', 'Delete Account')}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1.5">
                            {(p.id === currentUser?.id || p.email === currentUser?.email || currentUser?.role === 'admin') ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProfileForModal(p);
                                  setProfileModalMode('edit_self');
                                  setIsProfileModalOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-[#F37021] text-[#F37021] hover:text-white border border-orange-200 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                              >
                                <User className="h-3.5 w-3.5" />
                                <span>{t('profile.edit', 'Edit Profile')}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleViewProfile(p)}
                                className="px-3 py-1.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                              >
                                <Eye className="h-3.5 w-3.5 text-neutral-500" />
                                <span>{t('admin.viewProfile', 'View Profile')}</span>
                              </button>
                            )}

                            {p.id !== currentUser?.id && (
                              <button
                                type="button"
                                onClick={() => setProfileToDelete(p)}
                                className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 transition-all shadow-xs"
                                title={t('admin.deleteUserTitle', 'Delete User Account')}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                          <span className="text-[9px] font-medium text-neutral-400 flex items-center gap-0.5">
                            <Lock className="h-2.5 w-2.5" />
                            {t('admin.readOnlyBadge', 'Read-Only · User Managed')}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredProfiles.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-400">
                    <Users className="mx-auto h-8 w-8 text-neutral-300 mb-2" />
                    <p className="text-sm font-bold text-neutral-700">
                      {t('admin.noProfilesFound', 'No user profiles found matching your search.')}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile Modal for Viewing or Managing */}
      {isProfileModalOpen && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          profile={selectedProfileForModal}
          mode={profileModalMode}
        />
      )}

      {/* Vehicle Modal for Fleet Maintenance */}
      {isVehicleModalOpen && (
        <VehicleModal
          isOpen={isVehicleModalOpen}
          onClose={() => setIsVehicleModalOpen(false)}
          targetVehicle={activeVehicle}
        />
      )}

      {/* Delete Profile Confirmation Dialog */}
      {profileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-neutral-900">
                  {t('admin.deleteUserConfirmTitle', 'Delete Profile & Account')}
                </h3>
                <p className="text-xs text-neutral-500">
                  {t('admin.actionCannotBeUndone', 'This action cannot be undone.')}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-neutral-50 p-3.5 border border-neutral-200 text-xs space-y-1">
              <p className="font-extrabold text-neutral-900">{profileToDelete.full_name}</p>
              <p className="text-neutral-500 font-mono text-[11px]">{profileToDelete.email}</p>
              <p className="text-neutral-500 font-mono text-[11px]">{profileToDelete.ic_or_oku_number}</p>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              {t('admin.deleteUserWarning', 'Are you sure you want to permanently delete this user account from the Beautiful Gate database? All linked permissions will be revoked.')}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setProfileToDelete(null)}
                disabled={isDeletingProfile}
                className="px-4 py-2 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeletingProfile}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeletingProfile ? (
                  <span>{t('admin.deleting', 'Deleting...')}</span>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{t('admin.confirmDelete', 'Confirm Delete')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
