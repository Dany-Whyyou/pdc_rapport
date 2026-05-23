'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

type PosterType = {
  id: string;
  href: string;
  title: string;
  description: string;
  icon: string;
  gradient: string;
  available: boolean;
};

const posterTypes: PosterType[] = [
  {
    id: 'action-plan',
    href: '/posters/new',
    title: "Plan d'action mensuel",
    description: 'Calendrier des activités du mois (cultes, répétitions, événements)',
    icon: '📅',
    gradient: 'from-pdc-primary to-pdc-primary-dark',
    available: true,
  },
  // À venir : autres types de posters
];

export default function PosterTypeSelectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-8">
          <button
            onClick={() => router.push('/posters')}
            className="text-pdc-primary text-sm hover:underline mb-2"
          >
            ← Retour aux posters
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Choisir le type de poster</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sélectionnez le modèle qui correspond à votre besoin
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {posterTypes.map((type) =>
            type.available ? (
              <Link
                key={type.id}
                href={type.href}
                className="group bg-white rounded-xl border-2 border-gray-200 hover:border-pdc-primary hover:shadow-lg transition-all p-6 flex flex-col"
              >
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${type.gradient} flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform`}
                >
                  {type.icon}
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">{type.title}</h3>
                <p className="text-sm text-gray-500 flex-1">{type.description}</p>
                <div className="mt-4 flex items-center text-pdc-primary text-sm font-medium">
                  Créer
                  <svg
                    className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            ) : (
              <div
                key={type.id}
                className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-6 flex flex-col opacity-60"
              >
                <div className="w-16 h-16 rounded-2xl bg-gray-200 flex items-center justify-center text-3xl mb-4">
                  {type.icon}
                </div>
                <h3 className="font-bold text-lg text-gray-700 mb-2">{type.title}</h3>
                <p className="text-sm text-gray-500 flex-1">{type.description}</p>
                <div className="mt-4 inline-flex items-center text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded self-start">
                  Bientôt disponible
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
