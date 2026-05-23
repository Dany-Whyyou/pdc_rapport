'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getPosters, deletePoster, type Poster } from '@/lib/api';

const monthsLabels = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export default function PostersListPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [posters, setPosters] = useState<Array<Omit<Poster, 'data'>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) load();
  }, [user]);

  async function load() {
    try {
      setIsLoading(true);
      const res = await getPosters();
      setPosters(res.posters || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Supprimer ce poster ?')) return;
    try {
      setDeletingId(id);
      await deletePoster(id);
      await load();
    } catch (e) {
      alert((e as Error).message || 'Erreur');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des posters</h1>
            <p className="text-sm text-gray-500 mt-1">
              Générer et regénérer les affiches du programme
            </p>
          </div>
          <Link
            href="/posters/select"
            className="bg-pdc-primary hover:bg-pdc-primary-dark text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau poster
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-100 rounded-xl h-48 animate-pulse" />
            ))}
          </div>
        ) : posters.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Aucun poster</h2>
            <p className="text-gray-500 mb-6">Créez votre premier plan d&apos;action mensuel</p>
            <Link
              href="/posters/select"
              className="inline-block bg-pdc-primary hover:bg-pdc-primary-dark text-white px-5 py-2.5 rounded-lg font-medium"
            >
              Créer un poster
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posters.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{p.titre}</h3>
                    <div className="text-sm text-gray-500">
                      {monthsLabels[p.mois - 1]} {p.annee}
                    </div>
                  </div>
                  <div className="text-2xl">📋</div>
                </div>

                {p.periode_label && (
                  <div className="inline-block px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded font-medium mb-4">
                    {p.periode_label}
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Link
                    href={`/posters/new?id=${p.id}`}
                    className="flex-1 text-center bg-pdc-cream-dark hover:bg-pdc-cream-dark text-pdc-primary-dark px-3 py-2 rounded-lg text-sm font-medium"
                  >
                    Ouvrir
                  </Link>
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                    className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {deletingId === p.id ? '...' : 'Supprimer'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
