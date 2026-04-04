'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  getReport,
  getSousSections,
  addSectionToReport,
  removeSectionFromReport,
  saveBilanEntry,
  savePlanEntry,
  deleteBilanEntry,
  deletePlanEntry,
  validateReport,
} from '@/lib/api';
import BilanTable, { type BilanEntry } from '@/components/BilanTable';
import PlanActionTable, { type PlanEntry } from '@/components/PlanActionTable';
import ExportButtons from '@/components/ExportButtons';

interface SousSection {
  id: number;
  sous_section_id: number;
  nom: string;
  can_edit: boolean;
  bilan: Array<{
    id: number;
    theme: string;
    sous_theme: string;
    points_positifs: string;
    points_negatifs: string;
    propositions: string;
    ordre: number;
  }>;
  plan_action: Array<{
    id: number;
    numero_defi: number;
    defi: string;
    action_a: string;
    action_b: string;
    action_c: string;
    action_d: string;
    ordre: number;
  }>;
}

interface ReportData {
  id: number;
  titre: string;
  annee: number;
  trimestre: number;
  statut: string;
  sous_sections: SousSection[];
}

function ReportDetailContent() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportId = Number(searchParams.get('id'));

  const [report, setReport] = useState<ReportData | null>(null);
  const [loadingReport, setLoadingReport] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const [bilanEdits, setBilanEdits] = useState<Record<number, BilanEntry[]>>({});
  const [planEdits, setPlanEdits] = useState<Record<number, PlanEntry[]>>({});

  // Gestion ajout/retrait sous-sections
  const [showAddSection, setShowAddSection] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [allSousSections, setAllSousSections] = useState<any[]>([]);
  const [confirmRemoveSection, setConfirmRemoveSection] = useState<number | null>(null);
  const [confirmValidate, setConfirmValidate] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, router]);

  const loadReport = useCallback(async () => {
    if (!reportId) return;
    setLoadingReport(true);
    try {
      const response = await getReport(reportId);
      const r = response.report;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedSections: SousSection[] = (r.sections || []).map((s: any) => ({
        id: s.id as number,
        sous_section_id: s.sous_section_id as number,
        nom: (s.sous_section_nom || '') as string,
        can_edit: !!s.can_edit,
        bilan: s.bilan_entries || [],
        plan_action: s.plan_entries || [],
      }));
      const reportData: ReportData = {
        id: r.id as number,
        titre: r.titre as string,
        annee: r.annee as number,
        trimestre: r.trimestre as number,
        statut: r.statut as string,
        sous_sections: mappedSections,
      };
      setReport(reportData);
      const bEdits: Record<number, BilanEntry[]> = {};
      const pEdits: Record<number, PlanEntry[]> = {};
      reportData.sous_sections.forEach((ss: SousSection) => {
        bEdits[ss.id] = ss.bilan.map((b) => ({ ...b }));
        pEdits[ss.id] = ss.plan_action.map((p) => ({ ...p }));
      });
      setBilanEdits(bEdits);
      setPlanEdits(pEdits);
    } catch (err) {
      console.error('Erreur chargement rapport:', err);
    } finally {
      setLoadingReport(false);
    }
  }, [reportId]);

  useEffect(() => {
    if (isAuthenticated) {
      loadReport();
    }
  }, [isAuthenticated, loadReport]);

  if (loading || !user) return null;

  if (!reportId) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Aucun rapport sélectionné</p>
      </div>
    );
  }

  if (loadingReport) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Rapport introuvable</p>
      </div>
    );
  }

  const currentSS = report.sous_sections[activeTab];
  const isEditable = currentSS ? (currentSS.can_edit && report.statut !== 'valide' && report.statut !== 'cloture') || user.is_admin : false;

  const handleSaveBilan = async () => {
    if (!currentSS) return;
    setSaving(true);
    setSaveMessage('');
    try {
      const entries = bilanEdits[currentSS.id] || [];
      const originalIds = currentSS.bilan.map((b) => b.id);
      const currentIds = entries.filter((e) => e.id).map((e) => e.id!);
      const toDelete = originalIds.filter((id) => !currentIds.includes(id));
      for (const id of toDelete) {
        await deleteBilanEntry(id);
      }
      for (const entry of entries) {
        await saveBilanEntry({
          id: entry.id,
          report_section_id: currentSS.id,
          theme: entry.theme,
          sous_theme: entry.sous_theme,
          points_positifs: entry.points_positifs,
          points_negatifs: entry.points_negatifs,
          propositions: entry.propositions,
          ordre: entry.ordre,
        });
      }
      setSaveMessage('Bilan sauvegardé avec succès');
      await loadReport();
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleSavePlan = async () => {
    if (!currentSS) return;
    setSaving(true);
    setSaveMessage('');
    try {
      const entries = planEdits[currentSS.id] || [];
      const originalIds = currentSS.plan_action.map((p) => p.id);
      const currentIds = entries.filter((e) => e.id).map((e) => e.id!);
      const toDelete = originalIds.filter((id) => !currentIds.includes(id));
      for (const id of toDelete) {
        await deletePlanEntry(id);
      }
      for (const entry of entries) {
        await savePlanEntry({
          id: entry.id,
          report_section_id: currentSS.id,
          numero_defi: entry.numero_defi,
          defi: entry.defi,
          action_a: entry.action_a,
          action_b: entry.action_b,
          action_c: entry.action_c,
          action_d: entry.action_d,
          ordre: entry.ordre,
        });
      }
      setSaveMessage('Plan d\'action sauvegardé avec succès');
      await loadReport();
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleValidate = async () => {
    try {
      await validateReport(report.id);
      await loadReport();
      setConfirmValidate(false);
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'Erreur lors de la validation');
      setConfirmValidate(false);
    }
  };

  const handleOpenAddSection = async () => {
    try {
      const data = await getSousSections();
      setAllSousSections(data.sous_sections || data || []);
      setShowAddSection(true);
    } catch (err) {
      console.error('Erreur chargement sous-sections:', err);
    }
  };

  const handleAddSection = async (ssId: number) => {
    try {
      await addSectionToReport({ report_id: report.id, sous_section_id: ssId });
      setShowAddSection(false);
      await loadReport();
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'Erreur');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleRemoveSection = async (ssId: number) => {
    try {
      await removeSectionFromReport({ report_id: report.id, sous_section_id: ssId });
      setConfirmRemoveSection(null);
      setActiveTab(0);
      await loadReport();
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'Erreur');
      setConfirmRemoveSection(null);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  // Sous-sections déjà dans le rapport
  const existingSsIds = report.sous_sections.map((ss) => ss.sous_section_id);

  const statusLabel = (statut: string) => {
    switch (statut) {
      case 'brouillon': return 'Brouillon';
      case 'en_cours': return 'En cours';
      case 'valide': return 'Validé';
      case 'archive': return 'Archivé';
      default: return statut;
    }
  };

  const statusColor = (statut: string) => {
    switch (statut) {
      case 'brouillon': return 'bg-gray-100 text-gray-700';
      case 'en_cours': return 'bg-yellow-100 text-yellow-700';
      case 'valide': return 'bg-green-100 text-green-700';
      case 'archive': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Report Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => router.push('/reports')} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-gray-900">{report.titre}</h1>
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(report.statut)}`}>
                {statusLabel(report.statut)}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Année {report.annee} - Trimestre {report.trimestre}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ExportButtons reportId={report.id} />
            {user.is_admin && report.statut !== 'valide' && report.statut !== 'cloture' && (
              confirmValidate ? (
                <div className="flex items-center gap-2">
                  <button onClick={handleValidate} className="px-3 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700">Confirmer</button>
                  <button onClick={() => setConfirmValidate(false)} className="px-3 py-2 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300">Annuler</button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmValidate(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Valider
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Save message */}
      {saveMessage && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          saveMessage.includes('succès') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {saveMessage}
        </div>
      )}

      {/* Sous-section tabs */}
      {report.sous_sections.length > 0 ? (
        <>
          <div className="flex overflow-x-auto gap-1 mb-6 bg-white rounded-xl border border-gray-200 p-1.5">
            {report.sous_sections.map((ss, index) => (
              <button
                key={ss.id}
                onClick={() => setActiveTab(index)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === index
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {ss.nom}
              </button>
            ))}
            {user.is_admin && report.statut !== 'valide' && report.statut !== 'cloture' && (
              <button
                onClick={handleOpenAddSection}
                className="px-3 py-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors whitespace-nowrap"
                title="Ajouter une sous-section"
              >
                + Ajouter
              </button>
            )}
          </div>

          {/* Bouton retirer la sous-section courante */}
          {user.is_admin && currentSS && report.statut !== 'valide' && report.statut !== 'cloture' && (
            <div className="flex justify-end mb-2">
              {confirmRemoveSection === currentSS.sous_section_id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600">Retirer {currentSS.nom} du rapport ?</span>
                  <button onClick={() => handleRemoveSection(currentSS.sous_section_id)} className="px-2 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700">Confirmer</button>
                  <button onClick={() => setConfirmRemoveSection(null)} className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300">Annuler</button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmRemoveSection(currentSS.sous_section_id)}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                  Retirer cette sous-section
                </button>
              )}
            </div>
          )}

          {/* Content for current tab */}
          {currentSS && (
            <div className="space-y-8">
              {/* BILAN */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">
                    Bilan - {currentSS.nom}
                  </h2>
                  {isEditable && (
                    <button
                      onClick={handleSaveBilan}
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {saving ? 'Sauvegarde...' : 'Sauvegarder le bilan'}
                    </button>
                  )}
                </div>
                <BilanTable
                  entries={bilanEdits[currentSS.id] || []}
                  onChange={(entries) =>
                    setBilanEdits((prev) => ({ ...prev, [currentSS.id]: entries }))
                  }
                  readOnly={!isEditable}
                />
              </div>

              {/* PLAN D'ACTION */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">
                    Plan d&apos;action - {currentSS.nom}
                  </h2>
                  {isEditable && (
                    <button
                      onClick={handleSavePlan}
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {saving ? 'Sauvegarde...' : 'Sauvegarder le plan'}
                    </button>
                  )}
                </div>
                <PlanActionTable
                  entries={planEdits[currentSS.id] || []}
                  onChange={(entries) =>
                    setPlanEdits((prev) => ({ ...prev, [currentSS.id]: entries }))
                  }
                  readOnly={!isEditable}
                />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500 mb-4">Aucune sous-section dans ce rapport</p>
          {user.is_admin && report.statut !== 'valide' && report.statut !== 'cloture' && (
            <button
              onClick={handleOpenAddSection}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter des sous-sections
            </button>
          )}
        </div>
      )}

      {/* Modal ajout sous-section */}
      {showAddSection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Ajouter une sous-section</h3>
              <button onClick={() => setShowAddSection(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
              {allSousSections.filter((ss: { id: number }) => !existingSsIds.includes(ss.id)).length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Toutes les sous-sections sont déjà ajoutées</p>
              ) : (
                allSousSections
                  .filter((ss: { id: number }) => !existingSsIds.includes(ss.id))
                  .map((ss: { id: number; nom: string; couleur: string }) => (
                    <button
                      key={ss.id}
                      onClick={() => handleAddSection(ss.id)}
                      className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ss.couleur || '#007bff' }} />
                      <span className="text-sm font-medium text-gray-900">{ss.nom}</span>
                    </button>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportDetailPage() {
  return (
    <Suspense fallback={
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ReportDetailContent />
    </Suspense>
  );
}
