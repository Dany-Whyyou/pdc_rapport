'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getPoster, savePoster, type PosterActivity, type PosterData } from '@/lib/api';
import { extractColorsFromImage, fileToDataUrl } from '@/lib/colorExtractor';
import PosterPreview from '@/components/PosterPreview';
import { toPng } from 'html-to-image';

const monthsLabels = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function defaultActivity(): PosterActivity {
  return { jour: 'DIMANCHE', date: '', titre: '', details: '', horaire: '' };
}

function defaultData(): PosterData {
  const now = new Date();
  const moisCourant = monthsLabels[now.getMonth()];
  return {
    brand_name: 'Porte des Cieux',
    brand_subtitle: '1 Pierre 2 v 9',
    program_number: '',
    periode_label: `${moisCourant.toUpperCase()} ${now.getFullYear()}`,
    image_url: '',
    image_data: '',
    color_dark: '#1a2547',
    color_accent: '#c89a3f',
    color_bg: '#f4ede1',
    title_main: 'CALENDRIER',
    title_italic: 'des',
    title_secondary: 'ACTIVITÉS',
    activities: [defaultActivity()],
    footer_tags: '',
  };
}

function defaultTitre(): string {
  const now = new Date();
  return `Plan d'action - ${monthsLabels[now.getMonth()]} ${now.getFullYear()}`;
}

function defaultPeriode(): string {
  const now = new Date();
  return `${monthsLabels[now.getMonth()].toUpperCase()} ${now.getFullYear()}`;
}

function PosterEditorContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get('id');

  const [data, setData] = useState<PosterData>(defaultData());
  const [titre, setTitre] = useState(defaultTitre());
  const [mois, setMois] = useState(new Date().getMonth() + 1);
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [periodeLabel, setPeriodeLabel] = useState(defaultPeriode());
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!editId);
  const [extracting, setExtracting] = useState(false);

  const posterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (editId && user) loadExisting(Number(editId));
  }, [editId, user]);

  async function loadExisting(id: number) {
    try {
      setIsLoading(true);
      const res = await getPoster(id);
      const p = res.poster;
      setTitre(p.titre);
      setMois(p.mois);
      setAnnee(p.annee);
      setPeriodeLabel(p.periode_label || '');
      setData({ ...p.data, periode_label: p.periode_label || p.data.periode_label || '' });
    } catch (e) {
      console.error(e);
      alert((e as Error).message || 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleImageChange(file: File) {
    try {
      setExtracting(true);
      const dataUrl = await fileToDataUrl(file);
      const colors = await extractColorsFromImage(dataUrl);
      setData((d) => ({
        ...d,
        image_data: dataUrl,
        image_url: '',
        color_dark: colors.dark,
        color_accent: colors.accent,
        color_bg: colors.bg,
      }));
    } catch (e) {
      alert('Impossible de traiter l\'image');
    } finally {
      setExtracting(false);
    }
  }

  function updateActivity(idx: number, patch: Partial<PosterActivity>) {
    setData((d) => ({
      ...d,
      activities: d.activities.map((a, i) => (i === idx ? { ...a, ...patch } : a)),
    }));
  }

  function addActivity() {
    setData((d) => ({ ...d, activities: [...d.activities, defaultActivity()] }));
  }

  function removeActivity(idx: number) {
    setData((d) => ({
      ...d,
      activities: d.activities.filter((_, i) => i !== idx),
    }));
  }

  function moveActivity(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= data.activities.length) return;
    const next = [...data.activities];
    [next[idx], next[target]] = [next[target], next[idx]];
    setData((d) => ({ ...d, activities: next }));
  }

  async function handleSave() {
    if (!titre.trim()) {
      alert('Le titre est requis');
      return;
    }
    if (data.activities.length === 0) {
      alert('Ajoutez au moins une activité');
      return;
    }
    try {
      setIsSaving(true);
      const res = await savePoster({
        id: editId ? Number(editId) : undefined,
        titre: titre.trim(),
        mois,
        annee,
        periode_label: periodeLabel.trim() || undefined,
        data,
      });
      if (!editId) {
        router.replace(`/posters/new?id=${res.id}`);
      }
      alert('Poster enregistré ✓');
    } catch (e) {
      alert((e as Error).message || 'Erreur');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleExport() {
    if (!posterRef.current) return;
    try {
      setIsExporting(true);
      const png = await toPng(posterRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: data.color_bg,
      });
      const link = document.createElement('a');
      link.download = `${titre.replace(/\s+/g, '_') || 'poster'}_${monthsLabels[mois - 1]}_${annee}.png`;
      link.href = png;
      link.click();
    } catch (e) {
      console.error(e);
      alert('Erreur export. Vérifiez que l\'image source autorise CORS, ou utilisez une image téléversée.');
    } finally {
      setIsExporting(false);
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
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => router.push('/posters')}
              className="text-pdc-primary text-sm hover:underline mb-1"
            >
              ← Retour aux posters
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {editId ? 'Modifier le poster' : 'Nouveau poster'}
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              {isExporting ? 'Export...' : '⬇ Télécharger PNG'}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-pdc-primary hover:bg-pdc-primary-dark text-white px-5 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              {isSaving ? 'Enregistrement...' : '💾 Enregistrer'}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-gray-500">Chargement du poster...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ============ FORMULAIRE ============ */}
            <div className="space-y-5">
              {/* Métadonnées */}
              <Section title="Informations générales">
                <Field label="Titre du poster (interne)">
                  <input
                    type="text"
                    value={titre}
                    onChange={(e) => setTitre(e.target.value)}
                    placeholder="Plan d'action - Mai 2026"
                    className="input"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Mois">
                    <select value={mois} onChange={(e) => setMois(Number(e.target.value))} className="input">
                      {monthsLabels.map((m, i) => (
                        <option key={i} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Année">
                    <input
                      type="number"
                      value={annee}
                      onChange={(e) => setAnnee(Number(e.target.value))}
                      className="input"
                    />
                  </Field>
                </div>
                <Field label="Période affichée (en haut du poster)">
                  <input
                    type="text"
                    value={periodeLabel}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPeriodeLabel(v);
                      setData((d) => ({ ...d, periode_label: v }));
                    }}
                    placeholder="MAI — JUILLET 2026"
                    className="input"
                  />
                </Field>
              </Section>

              {/* Image */}
              <Section title="Image d'en-tête">
                <Field label="Téléverser une image">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImageChange(f);
                    }}
                    className="block w-full text-sm"
                  />
                </Field>
                <Field label="Ou URL d'une image (depuis /public/)">
                  <input
                    type="text"
                    value={data.image_url || ''}
                    onChange={async (e) => {
                      const url = e.target.value;
                      setData((d) => ({ ...d, image_url: url, image_data: '' }));
                      if (url) {
                        try {
                          setExtracting(true);
                          const colors = await extractColorsFromImage(url);
                          setData((d) => ({
                            ...d,
                            color_dark: colors.dark,
                            color_accent: colors.accent,
                            color_bg: colors.bg,
                          }));
                        } catch {
                          // ignore
                        } finally {
                          setExtracting(false);
                        }
                      }
                    }}
                    placeholder="/poster-mai-2026.jpg"
                    className="input"
                  />
                </Field>
                {extracting && <p className="text-sm text-amber-600 mt-2">Extraction des couleurs...</p>}
                {(data.image_data || data.image_url) && (
                  <p className="text-xs text-gray-500 mt-2">
                    Couleurs extraites :{' '}
                    <span style={{ background: data.color_dark, color: '#fff' }} className="px-2 py-0.5 rounded">{data.color_dark}</span>{' '}
                    <span style={{ background: data.color_accent, color: '#fff' }} className="px-2 py-0.5 rounded">{data.color_accent}</span>{' '}
                    <span style={{ background: data.color_bg, color: '#333' }} className="px-2 py-0.5 rounded">{data.color_bg}</span>
                  </p>
                )}
              </Section>

              {/* Couleurs (ajustement manuel) */}
              <Section title="Couleurs">
                <div className="grid grid-cols-3 gap-3">
                  <ColorField label="Sombre" value={data.color_dark} onChange={(v) => setData((d) => ({ ...d, color_dark: v }))} />
                  <ColorField label="Accent" value={data.color_accent} onChange={(v) => setData((d) => ({ ...d, color_accent: v }))} />
                  <ColorField label="Fond" value={data.color_bg} onChange={(v) => setData((d) => ({ ...d, color_bg: v }))} />
                </div>
              </Section>

              {/* Branding */}
              <Section title="Branding et titre">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nom de la famille">
                    <input type="text" value={data.brand_name} onChange={(e) => setData((d) => ({ ...d, brand_name: e.target.value }))} className="input" />
                  </Field>
                  <Field label="Sous-titre (petit)">
                    <input type="text" value={data.brand_subtitle || ''} onChange={(e) => setData((d) => ({ ...d, brand_subtitle: e.target.value }))} className="input" />
                  </Field>
                </div>
                <Field label="N° de programme (optionnel)">
                  <input type="text" value={data.program_number || ''} onChange={(e) => setData((d) => ({ ...d, program_number: e.target.value }))} placeholder="PROGRAMME N°05" className="input" />
                </Field>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Titre principal">
                    <input type="text" value={data.title_main} onChange={(e) => setData((d) => ({ ...d, title_main: e.target.value }))} className="input" />
                  </Field>
                  <Field label="Italique">
                    <input type="text" value={data.title_italic} onChange={(e) => setData((d) => ({ ...d, title_italic: e.target.value }))} className="input" />
                  </Field>
                  <Field label="Secondaire">
                    <input type="text" value={data.title_secondary} onChange={(e) => setData((d) => ({ ...d, title_secondary: e.target.value }))} className="input" />
                  </Field>
                </div>
                <Field label="Tags pied de page">
                  <input type="text" value={data.footer_tags || ''} onChange={(e) => setData((d) => ({ ...d, footer_tags: e.target.value }))} className="input" />
                </Field>
              </Section>

              {/* Activités */}
              <Section title={`Activités (${data.activities.length})`}>
                <div className="space-y-3">
                  {data.activities.map((act, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-gray-500">Activité #{idx + 1}</span>
                        <div className="flex gap-1">
                          <button onClick={() => moveActivity(idx, -1)} className="text-xs px-2 py-1 hover:bg-gray-200 rounded" disabled={idx === 0}>↑</button>
                          <button onClick={() => moveActivity(idx, 1)} className="text-xs px-2 py-1 hover:bg-gray-200 rounded" disabled={idx === data.activities.length - 1}>↓</button>
                          <button onClick={() => removeActivity(idx)} className="text-xs px-2 py-1 hover:bg-red-100 text-red-600 rounded">✕</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input type="text" placeholder="DIMANCHE" value={act.jour} onChange={(e) => updateActivity(idx, { jour: e.target.value })} className="input text-sm" />
                        <input type="text" placeholder="31 MAI" value={act.date} onChange={(e) => updateActivity(idx, { date: e.target.value })} className="input text-sm" />
                      </div>
                      <input type="text" placeholder="Titre de l'activité" value={act.titre} onChange={(e) => updateActivity(idx, { titre: e.target.value })} className="input text-sm mb-2" />
                      <input type="text" placeholder="Détails (lieu, infos...)" value={act.details || ''} onChange={(e) => updateActivity(idx, { details: e.target.value })} className="input text-sm mb-2" />
                      <input type="text" placeholder="16h00 / 16h - 22h / dès 18h" value={act.horaire} onChange={(e) => updateActivity(idx, { horaire: e.target.value })} className="input text-sm" />
                    </div>
                  ))}
                  <button onClick={addActivity} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-sm font-medium">
                    + Ajouter une activité
                  </button>
                </div>
              </Section>
            </div>

            {/* ============ PREVIEW ============ */}
            <div className="lg:sticky lg:top-6 lg:self-start">
              <div className="bg-gray-100 rounded-xl p-4 overflow-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
                <div className="flex justify-center">
                  <div className="shadow-2xl">
                    <PosterPreview ref={posterRef} data={data} width={500} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          background: white;
        }
        :global(.input:focus) {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-2 py-1.5 bg-white">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-8 h-8 border-0 cursor-pointer" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 text-sm border-0 outline-none" />
      </div>
    </div>
  );
}

export default function PosterEditorPage() {
  return (
    <Suspense fallback={<div className="p-6">Chargement...</div>}>
      <PosterEditorContent />
    </Suspense>
  );
}
