'use client';

import React, { useState } from 'react';
import { X, Plus, Edit2, Check, Phone, Accessibility } from 'lucide-react';
import { ArtisanSummary } from '@/types';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatPhoneNumber, formatICNumber } from '@/lib/formatters';

interface ArtisanDrawerProps {
  artisan: ArtisanSummary;
  onClose: () => void;
}

export const ArtisanDrawer: React.FC<ArtisanDrawerProps> = ({ artisan, onClose }) => {
  const { products, addWorkLog, overrideWorkLog } = useApp();
  const { t } = useLanguage();

  // Manual entry / override state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [newUnits, setNewUnits] = useState(25);

  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editUnitsValue, setEditUnitsValue] = useState(0);

  const handleCreateManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUnits <= 0) return;
    addWorkLog(newUnits, selectedProductId, artisan.profile.id);
    setIsAddingNew(false);
  };

  const handleStartEdit = (logId: string, currentUnits: number) => {
    setEditingLogId(logId);
    setEditUnitsValue(currentUnits);
  };

  const handleSaveEdit = (logId: string) => {
    if (editUnitsValue >= 0) {
      overrideWorkLog(logId, editUnitsValue);
    }
    setEditingLogId(null);
  };

  const profile = artisan.profile;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-xl h-full bg-white shadow-2xl flex flex-col border-l border-neutral-200 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-5 bg-neutral-50/70 sticky top-0 z-10 backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-neutral-900">
                {profile.full_name}
              </h2>
              <span className="rounded-full bg-neutral-200 px-2.5 py-0.5 text-xs font-semibold text-neutral-700">
                {profile.mobility_type}
              </span>
            </div>
            <p className="text-xs font-mono text-neutral-500 mt-0.5">
              OKU: {formatICNumber(profile.ic_or_oku_number)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-200 transition-colors tap-target"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {/* Section 1: Personal & Identification Details */}
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50/50 p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              {t('drawer.personalInfo', 'Artisan Beneficiary Information')}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2.5 text-neutral-700">
                <Accessibility className="h-4 w-4 text-[#F37021] shrink-0" />
                <div>
                  <p className="text-xs text-neutral-400 font-medium">
                    {t('adminTable.mobilityProfile', 'Mobility Profile')}
                  </p>
                  <p className="font-semibold text-neutral-900">
                    {profile.mobility_type || 'Manual Wheelchair'}
                  </p>
                  <p className="font-mono text-xs text-neutral-600">
                    {formatICNumber(profile.ic_or_oku_number)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-neutral-700">
                <Phone className="h-4 w-4 text-neutral-500 shrink-0" />
                <div>
                  <p className="text-xs text-neutral-400 font-medium">
                    {t('drawer.contactPhone', 'Contact Phone')}
                  </p>
                  <p className="font-semibold text-neutral-900 font-mono">{formatPhoneNumber(profile.phone)}</p>
                  <p className="text-xs text-neutral-500">{profile.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Complete Income Breakdown */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
              {t('drawer.incomeBreakdown', 'Income Breakdown & Production')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-neutral-200 p-3.5 bg-white">
                <p className="text-xs text-neutral-500 font-medium">
                  {t('drawer.today', 'Today')}
                </p>
                <p className="text-lg font-bold text-neutral-900 mt-1">
                  RM {artisan.todayEarned.toFixed(2)}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {artisan.todayUnits} {t('drawer.cards', 'cards')}
                </p>
              </div>

              <div className="rounded-xl border border-neutral-200 p-3.5 bg-white">
                <p className="text-xs text-neutral-500 font-medium">
                  {t('drawer.week', 'This Week')}
                </p>
                <p className="text-lg font-bold text-neutral-900 mt-1">
                  RM {artisan.weekEarned.toFixed(2)}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {artisan.weekUnits} {t('drawer.cards', 'cards')}
                </p>
              </div>

              <div className="rounded-xl border-2 border-[#F37021] p-3.5 bg-[#18181B] text-white">
                <p className="text-xs text-orange-300 font-medium">
                  {t('drawer.month', 'This Month')}
                </p>
                <p className="text-lg font-bold text-white mt-1">
                  RM {artisan.monthEarned.toFixed(2)}
                </p>
                <p className="text-xs text-orange-200 mt-0.5">
                  {artisan.monthUnits} {t('drawer.cards', 'cards')}
                </p>
              </div>

              <div className="rounded-xl border border-neutral-200 p-3.5 bg-white">
                <p className="text-xs text-neutral-500 font-medium">
                  {t('drawer.year', 'This Year')}
                </p>
                <p className="text-lg font-bold text-neutral-900 mt-1">
                  RM {artisan.yearEarned.toFixed(2)}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {artisan.yearUnits} {t('drawer.cards', 'cards')}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Manual Work Override / Entry */}
          <div className="rounded-2xl border border-neutral-200 p-5 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                {t('drawer.supervisorOverride', 'Supervisor Override & Entry')}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingNew(!isAddingNew)}
                className="apple-btn-secondary text-xs py-1.5 px-3 min-h-[36px]"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                {isAddingNew ? t('drawer.cancel', 'Cancel') : t('drawer.logOnBehalf', 'Log Cards on Behalf')}
              </button>
            </div>

            {isAddingNew && (
              <form onSubmit={handleCreateManualLog} className="space-y-3 pt-2 border-t border-neutral-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      {t('drawer.cardProduct', 'Card Product')}
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="apple-input w-full text-xs"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (RM {p.piece_rate.toFixed(3)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      {t('drawer.unitsCompleted', 'Units Completed Today')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={newUnits}
                      onChange={(e) => setNewUnits(parseInt(e.target.value) || 0)}
                      className="apple-input w-full text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="apple-btn-primary w-full text-xs py-2 min-h-[40px]"
                >
                  {t('drawer.recordWorkLog', 'Record Work Log')}
                </button>
              </form>
            )}
          </div>

          {/* Section 4: Full Log History */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                {t('drawer.historicalLogs', 'Historical Work Logs')} ({artisan.logs.length})
              </h3>
            </div>

            <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-200 overflow-hidden bg-white">
              {artisan.logs.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-500">
                  {t('drawer.noLogs', 'No logged card production history found.')}
                </div>
              ) : (
                artisan.logs.map((log) => {
                  const isEditing = editingLogId === log.id;

                  return (
                    <div key={log.id} className="p-3.5 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                      <div className="flex-1 pr-3">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-neutral-900">
                            {log.card_name || 'DIY Eco Card'}
                          </p>
                          <span className="text-[10px] font-mono text-neutral-400">
                            RM {log.piece_rate_snapshot.toFixed(3)}/{t('portal.perCard', 'card')}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-neutral-500 mt-0.5">
                          {t('common.date', 'Date')}: {log.logged_date}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              value={editUnitsValue}
                              onChange={(e) => setEditUnitsValue(parseInt(e.target.value) || 0)}
                              className="apple-input w-20 py-1 text-xs"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(log.id)}
                              className="h-8 w-8 rounded-lg bg-black text-white flex items-center justify-center tap-target"
                              title="Save"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-right">
                            <p className="text-sm font-bold text-neutral-900">
                              RM {log.total_earned.toFixed(2)}
                            </p>
                            <p className="text-xs text-neutral-600 font-medium">
                              {log.units_completed} {t('drawer.units', 'units')}
                            </p>
                          </div>
                        )}

                        {!isEditing && (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(log.id, log.units_completed)}
                            className="p-1.5 rounded-md text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors tap-target"
                            title="Adjust quantity"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
