'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { createReport, getSousSections } from '@/lib/api';

type ReportFamily = 'bilan' | 'libre' | 'activite';
type BilanKind = 'trimestriel' | 'semestriel' | 'annuel';

interface SousSection {
  id: number;
  nom: string;
  couleur: string;
}

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function NewReportPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [family, setFamily] = useState<ReportFamily | null>(null);
  const [bilanKind, setBilanKind] = useState<BilanKind>('trimestriel');
  const [titre, setTitre] = useState('');
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [trimestre, setTrimestre] = useState(1);
  const [dateRapport, setDateRapport] = useState(todayIso());
  const [sousSectionId, setSousSectionId] = useState<number | null>(null);
  const [sousSections, setSousSections] = useState<SousSection[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
    if (!loading && user && !user.is_admin) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, loading, user, router]);

  // Charge les sous-sections quand l'utilisateur passe sur "Rapport d'activite"
  useEffect(() => {
    if (family === 'activite' && sousSections.length === 0) {
      getSousSections()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((data: any) => {
          const list: SousSection[] = data.sous_sections || data || [];
          setSousSections(list);
          if (list.length > 0 && sousSectionId === null) {
            setSousSectionId(list[0].id);
          }
        })
        .catch((err) => console.error('Erreur chargement sous-sections:', err));
    }
  }, [family, sousSections.length, sousSectionId]);

  const formatDateFr = (iso: string): string => {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  // Auto-generate title
  useEffect(() => {
    if (family === 'bilan') {
      const typeLabel = bilanKind === 'trimestriel' ? 'Trimestriel' : bilanKind === 'annuel' ? 'Annuel' : 'Semestriel';
      const suffix = bilanKind === 'trimestriel' ? ` T${trimestre} - ${annee}` : ` - ${annee}`;
      setTitre(`Rapport ${typeLabel}${suffix}`);
    } else if (family === 'libre') {
      setTitre(`Rapport libre - ${formatDateFr(dateRapport)}`);
    } else if (family === 'activite') {
      const ss = sousSections.find((s) => s.id === sousSectionId);
      const ssLabel = ss ? ` ${ss.nom}` : '';
      setTitre(`Rapport d'activite${ssLabel} - ${formatDateFr(dateRapport)}`);
    }
  }, [family, annee, trimestre, bilanKind, dateRapport, sousSectionId, sousSections]);

  if (loading || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family) return;
    if (family === 'activite' && !sousSectionId) {
      setError('Choisis la sous-section concernee par ce rapport d\'activite.');
      return;
    }
    setError('');
    setSubmitting(true);

    const apiType = family === 'libre' ? 'libre' : family === 'activite' ? 'activite' : bilanKind;
    const payloadTrimestre = family === 'bilan' && bilanKind === 'trimestriel' ? trimestre : 0;
    const payloadAnnee = family === 'bilan' ? annee : new Date(dateRapport).getFullYear();

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = await createReport({
        titre,
        annee: payloadAnnee,
        trimestre: payloadTrimestre,
        type: apiType,
        date_rapport: family === 'bilan' ? undefined : dateRapport,
        sous_section_id: family === 'activite' ? sousSectionId! : undefined,
      });
      const newId = result.id || result.report_id;
      if (newId) {
        router.push(`/reports/view?id=${newId}`);
      } else {
        router.push('/reports');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la creation');
    } finally {
      setSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + 1 - i);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <button onClick={() => router.push('/reports')} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour aux rapports
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Nouveau rapport</h1>
        <p className="text-gray-500 mt-1">Choisissez le type de rapport a creer</p>
      </div>

      {/* Etape 1 : choix du type */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          type="button"
          onClick={() => setFamily('bilan')}
          className={`text-left p-4 border-2 rounded-xl transition-all ${
            family === 'bilan'
              ? 'border-pdc-primary bg-pdc-primary/5 shadow-sm'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="font-semibold text-sm text-gray-900 leading-tight">Rapport bilan</h3>
          </div>
          <p className="text-xs text-gray-600 leading-snug">
            Structure trimestrielle, semestrielle ou annuelle par sous-section.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFamily('libre')}
          className={`text-left p-4 border-2 rounded-xl transition-all ${
            family === 'libre'
              ? 'border-pdc-primary bg-pdc-primary/5 shadow-sm'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="font-semibold text-sm text-gray-900 leading-tight">Rapport libre</h3>
          </div>
          <p className="text-xs text-gray-600 leading-snug">
            Editeur libre (titres, gras, listes). Exportable PDF/Word.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFamily('activite')}
          className={`text-left p-4 border-2 rounded-xl transition-all ${
            family === 'activite'
              ? 'border-pdc-primary bg-pdc-primary/5 shadow-sm'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="font-semibold text-sm text-gray-900 leading-tight">Rapport d&apos;activite</h3>
          </div>
          <p className="text-xs text-gray-600 leading-snug">
            Contenu libre attache a une sous-section (Communication, Finance...).
          </p>
        </button>
      </div>

      {/* Etape 2 : formulaire (visible apres choix du type) */}
      {family && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {family === 'activite' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Sous-section concernee
                </label>
                <select
                  value={sousSectionId ?? ''}
                  onChange={(e) => setSousSectionId(parseInt(e.target.value))}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pdc-primary focus:border-pdc-primary outline-none"
                >
                  {sousSections.length === 0 && (
                    <option value="" disabled>Chargement...</option>
                  )}
                  {sousSections.map((ss) => (
                    <option key={ss.id} value={ss.id}>{ss.nom}</option>
                  ))}
                </select>
              </div>
            )}

            {family === 'bilan' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Periodicite du bilan
                </label>
                <select
                  value={bilanKind}
                  onChange={(e) => setBilanKind(e.target.value as BilanKind)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pdc-primary focus:border-pdc-primary outline-none"
                >
                  <option value="trimestriel">Trimestriel</option>
                  <option value="semestriel">Semestriel</option>
                  <option value="annuel">Annuel</option>
                </select>
              </div>
            )}

            {/* Bilan : annee + trimestre eventuel — Libre/activite : date precise */}
            {family === 'bilan' ? (
              <div className={bilanKind === 'trimestriel' ? 'grid grid-cols-2 gap-4' : ''}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Annee</label>
                  <select
                    value={annee}
                    onChange={(e) => setAnnee(parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pdc-primary focus:border-pdc-primary outline-none"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                {bilanKind === 'trimestriel' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Trimestre</label>
                    <select
                      value={trimestre}
                      onChange={(e) => setTrimestre(parseInt(e.target.value))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pdc-primary focus:border-pdc-primary outline-none"
                    >
                      <option value={1}>T1 (Janvier - Mars)</option>
                      <option value={2}>T2 (Avril - Juin)</option>
                      <option value={3}>T3 (Juillet - Septembre)</option>
                      <option value={4}>T4 (Octobre - Decembre)</option>
                    </select>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Date du rapport
                </label>
                <input
                  type="date"
                  value={dateRapport}
                  onChange={(e) => setDateRapport(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pdc-primary focus:border-pdc-primary outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Titre du rapport
              </label>
              <input
                type="text"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pdc-primary focus:border-pdc-primary outline-none"
                placeholder="Titre du rapport"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push('/reports')}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-pdc-primary text-white text-sm font-semibold rounded-lg hover:bg-pdc-primary-dark disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Creation...' : 'Creer le rapport'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
