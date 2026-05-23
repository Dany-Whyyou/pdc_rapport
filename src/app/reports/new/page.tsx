'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { createReport } from '@/lib/api';

export default function NewReportPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [titre, setTitre] = useState('');
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [trimestre, setTrimestre] = useState(1);
  const [type, setType] = useState('trimestriel');
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

  // Auto-generate title
  useEffect(() => {
    const typeLabel = type === 'trimestriel' ? 'Trimestriel' : type === 'annuel' ? 'Annuel' : 'Semestriel';
    setTitre(`Rapport ${typeLabel} T${trimestre} - ${annee}`);
  }, [annee, trimestre, type]);

  if (loading || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = await createReport({ titre, annee, trimestre, type });
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
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <button onClick={() => router.push('/reports')} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour aux rapports
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Nouveau rapport</h1>
        <p className="text-gray-500 mt-1">Creer un nouveau rapport trimestriel</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Type de rapport
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pdc-primary focus:border-pdc-primary outline-none"
            >
              <option value="trimestriel">Trimestriel</option>
              <option value="semestriel">Semestriel</option>
              <option value="annuel">Annuel</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Annee
              </label>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Trimestre
              </label>
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
          </div>

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
    </div>
  );
}
