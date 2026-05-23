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

export default function ReportsPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [filterYear, setFilterYear] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      const params: { year?: number; status?: string } = {};
      if (filterYear) params.year = parseInt(filterYear);
      if (filterStatus) params.status = filterStatus;

      setLoadingReports(true);
      getReports(params)
        .then((data) => setReports(data.reports || []))
        .catch((err) => console.error('Erreur chargement rapports:', err))
        .finally(() => setLoadingReports(false));
    }
  }, [isAuthenticated, filterYear, filterStatus]);

  if (loading || !user) return null;

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
      case 'archive': return 'bg-pdc-cream-dark text-pdc-primary-dark';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
          <p className="text-gray-500 mt-1">Liste de tous les rapports</p>
        </div>
        {user.is_admin && (
          <Link
            href="/reports/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-pdc-primary text-white text-sm font-semibold rounded-lg hover:bg-pdc-primary-dark transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau rapport
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Annee</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pdc-primary focus:border-pdc-primary outline-none"
            >
              <option value="">Toutes</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pdc-primary focus:border-pdc-primary outline-none"
            >
              <option value="">Tous</option>
              <option value="brouillon">Brouillon</option>
              <option value="en_cours">En cours</option>
              <option value="valide">Valide</option>
              <option value="archive">Archive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loadingReports ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucun rapport trouve</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Titre
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Annee
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Trimestre
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/reports/view?id=${report.id}`} className="text-sm font-medium text-gray-900 hover:text-pdc-primary">
                      {report.titre}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{report.annee}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">T{report.trimestre}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(report.statut)}`}>
                      {statusLabel(report.statut)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/reports/view?id=${report.id}`}
                      className="text-sm text-pdc-primary hover:text-pdc-primary-dark font-medium"
                    >
                      Voir / Editer
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
