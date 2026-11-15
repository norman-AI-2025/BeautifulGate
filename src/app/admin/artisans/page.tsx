'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Sparkles, 
  Building2, 
  Edit3, 
  Plus, 
  Trash2, 
  X, 
  Download, 
  Search, 
  ChevronRight 
} from 'lucide-react';
import { CardProduct, ArtisanSummary } from '@/types';
import { formatPhoneNumber, formatICNumber } from '@/lib/formatters';
import { ArtisanDrawer } from '@/components/ArtisanDrawer';

export default function AdminArtisansPage() {
  const { 
    products, 
    profiles, 
    workLogs, 
    getArtisanStats, 
    exportPayrollCSV, 
    addProduct, 
    updateProduct, 
    deleteProduct 
  } = useApp();
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArtisanForDrawer, setSelectedArtisanForDrawer] = useState<ArtisanSummary | null>(null);
  
  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<CardProduct | null>(null);
  const [productFormName, setProductFormName] = useState('');
  const [productFormResort, setProductFormResort] = useState('');
  const [productFormRate, setProductFormRate] = useState('0.001');
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productSaveFeedback, setProductSaveFeedback] = useState<string | null>(null);

  // Registered OKU Artisans summary
  const artisansList: ArtisanSummary[] = useMemo(() => {
    return profiles
      .filter(p => p.role === 'customer')
      .map(profile => getArtisanStats(profile.id));
  }, [profiles, getArtisanStats]);

  const filteredArtisans = useMemo(() => {
    if (!searchQuery.trim()) return artisansList;
    const q = searchQuery.toLowerCase();
    return artisansList.filter(a => 
      a.profile.full_name.toLowerCase().includes(q) ||
      a.profile.ic_or_oku_number.toLowerCase().includes(q) ||
      (a.profile.welfare_number && a.profile.welfare_number.toLowerCase().includes(q))
    );
  }, [artisansList, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900">
            {t('admin.tabArtisans', 'Artisans & Workshop Ledger')}
          </h2>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">
            {t('adminTable.workshopCatalogDesc', 'Manage corporate & resort partners, craft card series, and piece-rate payouts per card.')}
          </p>
        </div>

        {/* Export Payroll CSV */}
        <button
          type="button"
          onClick={exportPayrollCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F37021] hover:bg-[#D9530F] text-white text-xs font-bold shadow-xs tap-target transition-all active:scale-95 self-start sm:self-auto cursor-pointer"
        >
          <Download className="h-4 w-4" />
          <span>{t('admin.exportPayroll', 'Export Payroll CSV')}</span>
        </button>
      </div>

      {/* ================================================================ */}
      {/* 1. WORKSHOP COLLABORATORS & PIECE-RATE CATALOG                   */}
      {/* ================================================================ */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#F37021]" />
              <h3 className="text-base font-bold tracking-tight text-neutral-900">
                {t('adminTable.workshopCatalogTitle', 'Workshop Collaborators & Piece-Rate Catalog')}
              </h3>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Corporate resort clients and individual piece rates per completed unit.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedProductForEdit(null);
              setProductFormName('');
              setProductFormResort('');
              setProductFormRate('0.001');
              setProductSaveFeedback(null);
              setIsProductModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold shadow-xs tap-target transition-all active:scale-95 shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{t('adminTable.addCollaborator', 'Add Collaborator / Card')}</span>
          </button>
        </div>

        {/* Grid of Partner Products */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {products.map((p) => (
            <div
              key={p.id}
              className="group rounded-xl border border-neutral-200 hover:border-orange-300 bg-neutral-50/60 hover:bg-orange-50/30 p-4 transition-all duration-200 shadow-2xs hover:shadow-xs flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-100/80 text-orange-950 font-bold text-[11px] border border-orange-200">
                    <Building2 className="h-3 w-3 text-[#F37021]" />
                    <span className="truncate max-w-[160px]">{p.resort_client}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProductForEdit(p);
                      setProductFormName(p.name);
                      setProductFormResort(p.resort_client);
                      setProductFormRate(p.piece_rate.toString());
                      setProductSaveFeedback(null);
                      setIsProductModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F37021] hover:text-[#D9530F] px-2 py-1 rounded-lg hover:bg-orange-100/60 transition-colors cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>{t('common.edit', 'Edit')}</span>
                  </button>
                </div>

                <h4 className="font-bold text-neutral-900 text-sm tracking-tight leading-snug">
                  {p.name}
                </h4>
              </div>

              <div className="pt-2.5 border-t border-neutral-200/70 flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                  {t('adminTable.pricePerPiece', 'Price / Piece')}
                </span>
                <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg shadow-2xs tabular-nums">
                  RM {p.piece_rate.toFixed(3)} <span className="text-[10px] font-medium text-emerald-700">/ pc</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================================================================ */}
      {/* 2. REGISTERED OKU ARTISANS TABLE                                 */}
      {/* ================================================================ */}
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-neutral-200 gap-4">
          <div>
            <h3 className="text-base font-bold tracking-tight text-neutral-900">
              {t('adminTable.registeredArtisans', 'Registered OKU Artisans')}
            </h3>
            <p className="text-xs text-neutral-500">
              Monthly and year-to-date card production totals and credited payouts.
            </p>
          </div>

          {/* Search Bar */}
          <div className="w-full sm:w-72 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('adminTable.searchArtisans', 'Search by name, OKU ID...')}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-neutral-200/90 bg-neutral-50/70 focus:bg-white text-neutral-900 text-xs focus:outline-none focus:ring-1 focus:ring-[#F37021] transition-all"
            />
          </div>
        </div>

        {/* Artisans Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-600 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-5">{t('adminTable.artisanBeneficiary', 'Artisan Beneficiary')}</th>
                <th className="py-3.5 px-5">{t('adminTable.okuNumber', 'OKU Number')}</th>
                <th className="py-3.5 px-5">{t('adminTable.mobilityProfile', 'Mobility Profile')}</th>
                <th className="py-3.5 px-5">{t('adminTable.cardsMtd', 'Cards (MTD)')}</th>
                <th className="py-3.5 px-5">{t('adminTable.mtdEarnings', 'Month-to-Date Earnings')}</th>
                <th className="py-3.5 px-5">{t('adminTable.ytdEarnings', 'Year-to-Date Earnings')}</th>
                <th className="py-3.5 px-5 text-right">{t('adminTable.actionCol', 'Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {filteredArtisans.map((artisan) => (
                <tr
                  key={artisan.profile.id}
                  onClick={() => setSelectedArtisanForDrawer(artisan)}
                  className="hover:bg-orange-50/40 cursor-pointer transition-colors"
                >
                  <td className="py-4 px-5">
                    <p className="font-bold text-neutral-900 text-sm">
                      {artisan.profile.full_name}
                    </p>
                    <p className="text-[11px] text-neutral-500 font-mono">
                      {formatPhoneNumber(artisan.profile.phone)}
                    </p>
                  </td>

                  <td className="py-4 px-5 font-mono text-neutral-700">
                    <p className="font-bold">{formatICNumber(artisan.profile.ic_or_oku_number)}</p>
                    {artisan.profile.welfare_number && (
                      <p className="text-[10px] text-orange-700 font-semibold mt-0.5">
                        {t('profile.welfareNumber', 'Welfare')}: {artisan.profile.welfare_number}
                      </p>
                    )}
                  </td>

                  <td className="py-4 px-5">
                    <span className="rounded-md bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[11px] font-semibold text-neutral-800">
                      {artisan.profile.mobility_type}
                    </span>
                  </td>

                  <td className="py-4 px-5 font-bold text-neutral-900 text-sm tabular-nums">
                    {artisan.monthUnits} {t('drawer.cards', 'cards')}
                  </td>

                  <td className="py-4 px-5 font-mono font-bold text-sm text-emerald-800 tabular-nums">
                    RM {artisan.monthEarned.toFixed(2)}
                  </td>

                  <td className="py-4 px-5 font-mono text-neutral-600 tabular-nums">
                    RM {artisan.yearEarned.toFixed(2)}
                  </td>

                  <td className="py-4 px-5 text-right">
                    <button
                      type="button"
                      className="inline-flex items-center text-xs font-bold text-[#F37021] hover:text-[#D9530F] gap-1 tap-target"
                    >
                      <span>{t('adminTable.ledgerAndBank', 'Artisan Ledger')}</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================================================================ */}
      {/* EDIT / ADD WORKSHOP COLLABORATOR & PIECE-RATE MODAL             */}
      {/* ================================================================ */}
      {isProductModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in-50"
          onClick={() => setIsProductModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-lg rounded-2xl bg-white border border-neutral-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-neutral-900 text-white p-5 sm:p-6 relative border-b border-neutral-800">
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <span className="h-2 w-2 rounded-full bg-[#F37021]" />
                <span className="font-bold text-[11px] uppercase tracking-wider text-orange-200">
                  {selectedProductForEdit ? t('adminTable.editCollaborator', 'Edit Collaborator & Piece Rate') : t('adminTable.addCollaborator', 'Add Collaborator / Card')}
                </span>
              </div>
              <h3 className="text-lg font-bold tracking-tight text-white">
                {selectedProductForEdit ? selectedProductForEdit.resort_client : t('adminTable.addCollaborator', 'Add Collaborator / Card')}
              </h3>
            </div>

            {/* Modal Body */}
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                if (!productFormName.trim() || !productFormResort.trim() || !productFormRate.trim()) {
                  setProductSaveFeedback(t('common.requiredFields', 'Please fill in all fields.'));
                  return;
                }
                const rateNum = parseFloat(productFormRate);
                if (isNaN(rateNum) || rateNum <= 0) {
                  setProductSaveFeedback('Invalid piece rate amount.');
                  return;
                }

                setIsSavingProduct(true);
                try {
                  if (selectedProductForEdit) {
                    await updateProduct(selectedProductForEdit.id, {
                      name: productFormName.trim(),
                      resort_client: productFormResort.trim(),
                      piece_rate: rateNum,
                    });
                  } else {
                    await addProduct({
                      name: productFormName.trim(),
                      resort_client: productFormResort.trim(),
                      piece_rate: rateNum,
                    });
                  }
                  setIsProductModalOpen(false);
                } catch (err: any) {
                  setProductSaveFeedback(err?.message || 'Error saving changes');
                } finally {
                  setIsSavingProduct(false);
                }
              }}
              className="p-5 sm:p-6 space-y-4 text-xs text-neutral-800"
            >
              {productSaveFeedback && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
                  {productSaveFeedback}
                </div>
              )}

              {/* Collaborator / Resort Client */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  {t('adminTable.collaboratorName', 'Collaborator / Resort Client')}
                </label>
                <input
                  type="text"
                  required
                  value={productFormResort}
                  onChange={(e) => setProductFormResort(e.target.value)}
                  placeholder="e.g. Pangkor Laut Resort, The Datai Langkawi"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-neutral-50 focus:bg-white text-neutral-900 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#F37021] transition-all"
                />
              </div>

              {/* Card Product / Series Name */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  {t('adminTable.cardSeries', 'Card Product / Series')}
                </label>
                <input
                  type="text"
                  required
                  value={productFormName}
                  onChange={(e) => setProductFormName(e.target.value)}
                  placeholder="e.g. Pangkor Hornbill Note Card"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-neutral-50 focus:bg-white text-neutral-900 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#F37021] transition-all"
                />
              </div>

              {/* Price / Piece (MYR) */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  {t('adminTable.pricePerPiece', 'Price / Piece')} (MYR)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  max="100.00"
                  required
                  value={productFormRate}
                  onChange={(e) => setProductFormRate(e.target.value)}
                  placeholder="0.001"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-neutral-50 focus:bg-white text-neutral-900 font-mono font-bold text-xs focus:outline-none focus:ring-1 focus:ring-[#F37021] transition-all"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Payout credited directly to OKU artisan for each finished piece.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-2">
                {selectedProductForEdit ? (
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm(t('adminTable.confirmDeleteProduct', 'Are you sure you want to delete this product collaboration?'))) {
                        await deleteProduct(selectedProductForEdit.id);
                        setIsProductModalOpen(false);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{t('adminTable.deleteProduct', 'Delete Collaborator')}</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 font-semibold text-xs cursor-pointer"
                  >
                    {t('common.cancel', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProduct}
                    className="px-4 py-2 rounded-xl bg-[#F37021] hover:bg-[#D9530F] text-white font-bold text-xs shadow-xs tap-target transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingProduct ? 'Saving...' : t('adminTable.saveProduct', 'Save Changes')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Artisan Ledger Drawer */}
      {selectedArtisanForDrawer && (
        <ArtisanDrawer
          artisan={selectedArtisanForDrawer}
          onClose={() => setSelectedArtisanForDrawer(null)}
        />
      )}
    </div>
  );
}
