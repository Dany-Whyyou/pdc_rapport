'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  getSousSections,
  getSousSectionMembers,
  addSousSectionMember,
  removeSousSectionMember,
  getMembresActifs,
  getReportAdmins,
  setReportAdmin,
  getReportLogs,
} from '@/lib/api';

interface SousSection {
  id: number;
  nom: string;
  slug: string;
  couleur: string;
}

interface Membre {
  id: number;
  user_id?: number;
  name: string;
  surname: string;
  email: string;
  photo: string;
}

export default function AdminPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'sous-sections' | 'admins' | 'logs'>('sous-sections');

  // Logs state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Sous-sections state
  const [sousSections, setSousSections] = useState<SousSection[]>([]);
  const [selectedSS, setSelectedSS] = useState<number | null>(null);
  const [ssMembers, setSSMembers] = useState<Membre[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Admin state
  const [admins, setAdmins] = useState<Membre[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  // All members for add modal
  const [allMembers, setAllMembers] = useState<Membre[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addTarget, setAddTarget] = useState<'member' | 'admin'>('member');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
    if (!loading && user && !user.is_admin) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, loading, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.is_admin) {
      getSousSections()
        .then((data) => setSousSections(data.sous_sections || data || []))
        .catch((err) => console.error('Erreur chargement sous-sections:', err));
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (selectedSS) {
      setLoadingMembers(true);
      getSousSectionMembers(selectedSS)
        .then((data) => setSSMembers(data.membres || []))
        .catch((err) => console.error('Erreur chargement membres:', err))
        .finally(() => setLoadingMembers(false));
    }
  }, [selectedSS]);

  useEffect(() => {
    if (activeTab === 'admins' && isAuthenticated) {
      setLoadingAdmins(true);
      getReportAdmins()
        .then((data) => setAdmins(data.admins || []))
        .catch((err) => console.error('Erreur chargement admins:', err))
        .finally(() => setLoadingAdmins(false));
    }
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    if (activeTab === 'logs' && isAuthenticated) {
      setLoadingLogs(true);
      getReportLogs({ limit: 200 })
        .then((data: { logs: unknown[] }) => setLogs(data.logs || []))
        .catch((err: unknown) => console.error('Erreur chargement logs:', err))
        .finally(() => setLoadingLogs(false));
    }
  }, [activeTab, isAuthenticated]);

  const openAddModal = async (target: 'member' | 'admin') => {
    setAddTarget(target);
    setSearchQuery('');
    setShowAddModal(true);
    try {
      const data = await getMembresActifs();
      setAllMembers(data.membres || []);
    } catch (err) {
      console.error('Erreur chargement membres actifs:', err);
    }
  };

  const handleAddMember = async (membreId: number) => {
    if (addTarget === 'member' && selectedSS) {
      try {
        await addSousSectionMember({ sous_section_id: selectedSS, user_id: membreId });
        const data = await getSousSectionMembers(selectedSS);
        setSSMembers(data.membres || []);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erreur');
      }
    } else if (addTarget === 'admin') {
      try {
        await setReportAdmin({ user_id: membreId, can_edit_all: true, can_validate: true, can_export: true });
        const data = await getReportAdmins();
        setAdmins(data.admins || []);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erreur');
      }
    }
    setShowAddModal(false);
  };

  const [confirmDeleteMember, setConfirmDeleteMember] = useState<number | null>(null);

  const handleRemoveMember = async (membreId: number) => {
    if (!selectedSS) return;
    try {
      await removeSousSectionMember({ sous_section_id: selectedSS, user_id: membreId });
      const data = await getSousSectionMembers(selectedSS);
      setSSMembers(data.membres || []);
      setConfirmDeleteMember(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur');
      setConfirmDeleteMember(null);
    }
  };

  const [confirmDeleteAdmin, setConfirmDeleteAdmin] = useState<number | null>(null);

  const handleRemoveAdmin = async (membreId: number) => {
    try {
      await setReportAdmin({ user_id: membreId, can_edit_all: false, can_validate: false, can_export: false });
      const data = await getReportAdmins();
      setAdmins(data.admins || []);
      setConfirmDeleteAdmin(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur');
      setConfirmDeleteAdmin(null);
    }
  };

  if (loading || !user) return null;

  const filteredMembers = allMembers.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.surname.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
        <p className="text-gray-500 mt-1">Gestion des sous-sections et des administrateurs</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl border border-gray-200 p-1.5 w-fit">
        <button
          onClick={() => setActiveTab('sous-sections')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'sous-sections' ? 'bg-pdc-primary text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Sous-sections
        </button>
        <button
          onClick={() => setActiveTab('admins')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'admins' ? 'bg-pdc-primary text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Administrateurs
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'logs' ? 'bg-pdc-primary text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Journal d&apos;activité
        </button>
      </div>

      {/* Sous-sections Tab */}
      {activeTab === 'sous-sections' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sous-section list */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-700">Sous-sections</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
              {sousSections.map((ss) => (
                <button
                  key={ss.id}
                  onClick={() => setSelectedSS(ss.id)}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                    selectedSS === ss.id ? 'bg-pdc-cream-dark text-pdc-primary-dark' : 'text-gray-700'
                  }`}
                >
                  <p className="font-medium">{ss.nom}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{ss.slug}</p>
                </button>
              ))}
              {sousSections.length === 0 && (
                <div className="p-4 text-sm text-gray-500 text-center">Chargement...</div>
              )}
            </div>
          </div>

          {/* Members of selected sous-section */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">
                {selectedSS
                  ? `Membres - ${sousSections.find((s) => s.id === selectedSS)?.nom || ''}`
                  : 'Selectionnez une sous-section'}
              </h2>
              {selectedSS && (
                <button
                  onClick={() => openAddModal('member')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-pdc-primary text-white text-xs font-semibold rounded-lg hover:bg-pdc-primary-dark transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter
                </button>
              )}
            </div>
            {!selectedSS ? (
              <div className="p-8 text-sm text-gray-500 text-center">
                Cliquez sur une sous-section pour voir ses membres
              </div>
            ) : loadingMembers ? (
              <div className="p-8 text-sm text-gray-500 text-center">Chargement...</div>
            ) : ssMembers.length === 0 ? (
              <div className="p-8 text-sm text-gray-500 text-center">Aucun membre</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {ssMembers.map((m) => (
                  <div key={m.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      {m.photo ? (
                        <img src={m.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-pdc-cream-dark flex items-center justify-center">
                          <span className="text-pdc-primary-dark text-xs font-semibold">
                            {m.name.charAt(0)}{m.surname.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{m.name} {m.surname}</p>
                        <p className="text-xs text-gray-500">{m.email}</p>
                      </div>
                    </div>
                    {confirmDeleteMember === m.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRemoveMember(m.id)}
                          className="px-2 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700"
                        >
                          Confirmer
                        </button>
                        <button
                          onClick={() => setConfirmDeleteMember(null)}
                          className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteMember(m.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Retirer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admins Tab */}
      {activeTab === 'admins' && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Administrateurs des rapports</h2>
            <button
              onClick={() => openAddModal('admin')}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-pdc-primary text-white text-xs font-semibold rounded-lg hover:bg-pdc-primary-dark transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter un administrateur
            </button>
          </div>
          {loadingAdmins ? (
            <div className="p-8 text-sm text-gray-500 text-center">Chargement...</div>
          ) : admins.length === 0 ? (
            <div className="p-8 text-sm text-gray-500 text-center">Aucun administrateur configure</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {admins.map((m) => (
                <div key={m.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    {m.photo ? (
                      <img src={m.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-pdc-cream-dark flex items-center justify-center">
                        <span className="text-pdc-primary-dark text-xs font-semibold">
                          {m.name.charAt(0)}{m.surname.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{m.name} {m.surname}</p>
                      <p className="text-xs text-gray-500">{m.email}</p>
                    </div>
                  </div>
                  {confirmDeleteAdmin === (m.user_id || m.id) ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRemoveAdmin(m.user_id || m.id)}
                        className="px-2 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700"
                      >
                        Confirmer
                      </button>
                      <button
                        onClick={() => setConfirmDeleteAdmin(null)}
                        className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300"
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteAdmin(m.user_id || m.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Retirer les droits admin"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700">Journal d&apos;activité</h2>
          </div>
          {loadingLogs ? (
            <div className="p-8 text-sm text-gray-500 text-center">Chargement...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-sm text-gray-500 text-center">Aucune activité enregistrée</div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {logs.map((log) => {
                const actionLabels: Record<string, string> = {
                  create_report: 'a créé un rapport',
                  add_section: 'a ajouté une sous-section',
                  remove_section: 'a retiré une sous-section',
                  save_bilan: 'a modifié le bilan',
                  save_plan: 'a modifié le plan d\'action',
                  delete_bilan: 'a supprimé une entrée bilan',
                  delete_plan: 'a supprimé une entrée plan',
                  validate: 'a validé le rapport',
                  add_member: 'a ajouté un membre',
                  remove_member: 'a retiré un membre',
                };
                const actionColors: Record<string, string> = {
                  create_report: 'bg-pdc-cream-dark text-pdc-primary-dark',
                  add_section: 'bg-green-100 text-green-700',
                  remove_section: 'bg-red-100 text-red-700',
                  save_bilan: 'bg-yellow-100 text-yellow-700',
                  save_plan: 'bg-purple-100 text-purple-700',
                  delete_bilan: 'bg-red-100 text-red-700',
                  delete_plan: 'bg-red-100 text-red-700',
                  validate: 'bg-green-100 text-green-700',
                  add_member: 'bg-pdc-cream-dark text-pdc-primary-dark',
                  remove_member: 'bg-orange-100 text-orange-700',
                };
                const details = log.details_parsed || {};
                const date = new Date(log.created_at);
                const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                    {log.photo ? (
                      <img src={log.photo} alt="" className="w-8 h-8 rounded-full object-cover mt-0.5" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-pdc-cream-dark flex items-center justify-center mt-0.5">
                        <span className="text-pdc-primary-dark text-xs font-semibold">
                          {(log.name || '?').charAt(0)}{(log.surname || '').charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900">{log.name} {log.surname}</span>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${actionColors[log.action] || 'bg-gray-100 text-gray-700'}`}>
                          {actionLabels[log.action] || log.action}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                        {log.report_titre && <span>📄 {log.report_titre}</span>}
                        {details.sous_section && <span>• {details.sous_section}</span>}
                        {details.theme && <span>• {details.theme}</span>}
                        {details.membre && <span>• {details.membre}</span>}
                        {details.role && <span>({details.role})</span>}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">{dateStr}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Member/Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {addTarget === 'member' ? 'Ajouter un membre' : 'Ajouter un administrateur'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un membre..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pdc-primary focus:border-pdc-primary outline-none"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-200 px-2 pb-4">
              {filteredMembers.length === 0 ? (
                <div className="p-4 text-sm text-gray-500 text-center">Aucun resultat</div>
              ) : (
                filteredMembers.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleAddMember(m.id)}
                    className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    {m.photo ? (
                      <img src={m.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-pdc-cream-dark flex items-center justify-center">
                        <span className="text-pdc-primary-dark text-xs font-semibold">
                          {m.name.charAt(0)}{m.surname.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">{m.name} {m.surname}</p>
                      <p className="text-xs text-gray-500">{m.email}</p>
                    </div>
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
