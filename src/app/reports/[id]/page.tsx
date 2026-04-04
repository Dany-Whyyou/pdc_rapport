'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  getReport,
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
  nom: string;
  bilan: Array<{
    id: number;
    theme: string;
    points_positifs: string;
    points_negatifs: string;
    propositions: string;
  }>;
  plan_action: Array<{
    id: number;
    defi: string;
    action_a: string;
    action_b: string;
    action_c: string;
    action_d: string;
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

export default function ReportDetailPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const reportId = Number(params.id);

  const [report, setReport] = useState<ReportData | null>(null);
  const [loadingReport, setLoadingReport] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Track local edits per sous-section
  const [bilanEdits, setBilanEdits] = useState<Record<number, BilanEntry[]>>({});
  const [planEdits, setPlanEdits] = useState<Record<number, PlanEntry[]>>({});

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, router]);

  const loadReport = useCallback(async () => {
    if (!reportId) return;
    setLoadingReport(true);
    try {
      const data = await getReport(reportId);
      setReport(data);
      // Initialize edits from fetched data
      const bEdits: Record<number, BilanEntry[]> = {};
      const pEdits: Record<number, PlanEntry[]> = {};
      data.sous_sections.forEach((ss) => {
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

  const canEdit = (sousSection: SousSection) => {
    if (report.statut === 'valide' || report.statut === 'archive') return false;
    if (user.is_admin) return true;
    return user.sous_sections?.some((ss) => ss.id === sousSection.id) || false;
  };

  const currentSS = report.sous_sections[activeTab];
  const isEditable = currentSS ? canEdit(currentSS) : false;

  const handleSaveBilan = async () => {
    if (!currentSS) return;
    setSaving(true);
    setSaveMessage('');
    try {
      const entries = bilanEdits[currentSS.id] || [];
      // Delete removed entries
      const originalIds = currentSS.bilan.map((b) => b.id);
      const currentIds = entries.filter((e) => e.id).map((e) => e.id!);
      const toDelete = originalIds.filter((id) => !currentIds.includes(id));
      for (const id of toDelete) {
        await deleteBilanEntry(id);
      }
      // Save/update entries
      for (const entry of entries) {
        await saveBilanEntry({
          id: entry.id,
          report_id: report.id,
          sous_section_id: currentSS.id,
          theme: entry.theme,
          points_positifs: entry.points_positifs,
          points_negatifs: entry.points_negatifs,
          propositions: entry.propositions,
        });
      }
      setSaveMessage('Bilan sauvegarde avec succes');
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
      // Delete removed entries
      const originalIds = currentSS.plan_action.map((p) => p.id);
      const currentIds = entries.filter((e) => e.id).map((e) => e.id!);
      const toDelete = originalIds.filter((id) => !currentIds.includes(id));
      for (const id of toDelete) {
        await deletePlanEntry(id);
      }
      // Save/update entries
      for (const entry of entries) {
        await savePlanEntry({
          id: entry.id,
          report_id: report.id,
          sous_section_id: currentSS.id,
          defi: entry.defi,
          action_a: entry.action_a,
          action_b: entry.action_b,
          action_c: entry.action_c,
          action_d: entry.action_d,
        });
      }
      setSaveMessage('Plan d\'action sauvegarde avec succes');
      await loadReport();
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleValidate = async () => {
    if (!confirm('Etes-vous sur de vouloir valider ce rapport ? Cette action est irreversible.')) return;
    try {
      await validateReport(report.id);
      await loadReport();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la validation');
    }
  };

  const statusLabel = (statut: string) => {
    switch (statut) {
      case 'brouillon': return 'Brouillon';
      case 'en_cours': return 'En cours';
      case 'valide': return 'Valide';
      case 'archive': return 'Archive';
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
              Annee {report.annee} - Trimestre {report.trimestre}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ExportButtons reportId={report.id} />
            {user.is_admin && report.statut !== 'valide' && report.statut !== 'archive' && (
              <button
                onClick={handleValidate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Valider
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Save message */}
      {saveMessage && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          saveMessage.includes('succes') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
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
          </div>

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
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
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
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
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
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          Aucune sous-section dans ce rapport
        </div>
      )}
    </div>
  );
}
