'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { getReports } from '@/lib/api';

interface Report {
  id: number;
  titre: string;
  annee: number;
  trimestre: number;
  statut: string;
  created_at: string;
  updated_at?: string;
}

export default function DashboardPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      getReports()
        .then((data) => setReports(data.reports || []))
        .catch((err) => console.error('Erreur chargement rapports:', err))
        .finally(() => setLoadingReports(false));
    }
  }, [isAuthenticated]);

  if (loading || !user) return null;

  const pendingReports = reports.filter((r) => r.statut === 'en_cours' || r.statut === 'brouillon');
  const validatedReports = reports.filter((r) => r.statut === 'valide');
  const recentReports = [...reports].sort((a, b) => b.id - a.id).slice(0, 5);

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
    <div className="p-8 max-w-6xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {user.name} {user.surname}
        </h1>
        <p className="text-gray-500 mt-1">
          Bienvenue sur la plateforme de rapports Porte des Cieux
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Total rapports</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">
            {loadingReports ? '-' : reports.length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-sm font-medium text-gray-500">En attente</div>
          <div className="text-3xl font-bold text-yellow-600 mt-1">
            {loadingReports ? '-' : pendingReports.length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Valides</div>
          <div className="text-3xl font-bold text-green-600 mt-1">
            {loadingReports ? '-' : validatedReports.length}
          </div>
        </div>
      </div>

      {/* Actions + Sous-sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Action rapide */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
            <div className="space-y-3">
              {user.is_admin && (
                <Link
                  href="/reports/new"
                  className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm font-medium">Nouveau rapport</span>
                </Link>
              )}
              <Link
                href="/reports"
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium">Voir tous les rapports</span>
              </Link>
            </div>

            {/* Sous-sections */}
            {user.sous_sections && user.sous_sections.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Mes sous-sections</h3>
                <div className="space-y-2">
                  {user.sous_sections.map((ss) => (
                    <div
                      key={ss.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 text-blue-700"
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-sm">{ss.nom}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent reports */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Rapports recents</h2>
              <Link href="/reports" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Voir tout
              </Link>
            </div>
            {loadingReports ? (
              <div className="p-8 text-center text-gray-500">Chargement...</div>
            ) : recentReports.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Aucun rapport disponible</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {recentReports.map((report) => (
                  <Link
                    key={report.id}
                    href={`/reports/view?id=${report.id}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{report.titre}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {report.annee} - T{report.trimestre}
                      </p>
                    </div>
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(report.statut)}`}>
                      {statusLabel(report.statut)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
