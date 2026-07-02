const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://www.portedescieux.ovh';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pdc_report_token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Erreur ${res.status}`);
  }

  return res.json();
}

// Auth
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function login(email: string, password: string): Promise<any> {
  return request<Record<string, unknown>>('/api/report/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// Sous-sections
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getSousSections(): Promise<any> {
  return request<Record<string, unknown>>('/api/report/sous-sections');
}

// Reports
export async function getReports(params?: { year?: number; status?: string }) {
  const query = new URLSearchParams();
  if (params?.year) query.set('annee', String(params.year));
  if (params?.status) query.set('statut', params.status);
  const qs = query.toString();
  return request<{
    success: boolean;
    reports: Array<{
      id: number;
      titre: string;
      annee: number;
      trimestre: number;
      statut: string;
      created_at: string;
      type_slug?: string;
      sections_total?: number;
      sections_remplies?: number;
    }>;
  }>(`/api/report/reports${qs ? '?' + qs : ''}`);
}

export async function getReport(id: number) {
  return request<{
    success: boolean;
    report: {
      id: number;
      titre: string;
      annee: number;
      trimestre: number;
      statut: string;
      sections: Array<{
        id: number;
        sous_section_id: number;
        sous_section_nom: string;
        statut: string;
        can_edit: boolean;
        bilan_entries: Array<{
          id: number;
          theme: string;
          sous_theme: string;
          points_positifs: string;
          points_negatifs: string;
          propositions: string;
          ordre: number;
        }>;
        plan_entries: Array<{
          id: number;
          numero_defi: number;
          defi: string;
          action_a: string;
          action_b: string;
          action_c: string;
          action_d: string;
          ordre: number;
        }>;
      }>;
    };
  }>(`/api/report/reports/${id}`);
}

export async function createReport(data: {
  titre: string;
  annee: number;
  trimestre: number;
  type?: string;
}) {
  return request<{ success: boolean; id: number; message: string }>('/api/report/reports/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteReport(id: number) {
  return request<{ success: boolean; message: string }>('/api/report/reports/delete', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
}

export async function saveReportContent(reportId: number, contenuLibre: string) {
  return request<{ success: boolean; message: string; statut: string }>(
    '/api/report/reports/save-content',
    {
      method: 'POST',
      body: JSON.stringify({ report_id: reportId, contenu_libre: contenuLibre }),
    }
  );
}

// Report sections management
export async function addSectionToReport(data: { report_id: number; sous_section_id: number }) {
  return request<{ success: boolean; message: string }>('/api/report/reports/add-section', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function removeSectionFromReport(data: { report_id: number; sous_section_id: number }) {
  return request<{ success: boolean; message: string }>('/api/report/reports/remove-section', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Activity logs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getReportLogs(params?: { report_id?: number; limit?: number }): Promise<any> {
  const query = new URLSearchParams();
  if (params?.report_id) query.set('report_id', String(params.report_id));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return request<Record<string, unknown>>(`/api/report/logs${qs ? '?' + qs : ''}`);
}

// Bilan entries
export async function saveBilanEntry(data: {
  id?: number;
  report_section_id?: number;
  report_id?: number;
  sous_section_id?: number;
  theme: string;
  sous_theme?: string;
  points_positifs: string;
  points_negatifs: string;
  propositions: string;
  ordre?: number;
}) {
  return request<{ success: boolean; id: number; message: string }>('/api/report/bilan/save', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteBilanEntry(id: number) {
  return request<{ success: boolean; message: string }>('/api/report/bilan/delete', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
}

// Plan d'action entries
export async function savePlanEntry(data: {
  id?: number;
  report_section_id?: number;
  report_id?: number;
  sous_section_id?: number;
  numero_defi?: number;
  defi: string;
  action_a: string;
  action_b: string;
  action_c: string;
  action_d: string;
  ordre?: number;
}) {
  return request<{ success: boolean; id: number; message: string }>('/api/report/plan/save', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deletePlanEntry(id: number) {
  return request<{ success: boolean; message: string }>('/api/report/plan/delete', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
}

// Validation
export async function validateReport(id: number) {
  return request<{ success: boolean; message: string }>('/api/report/validate', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
}

// Sous-section members
export async function getSousSectionMembers(id: number) {
  return request<{
    success: boolean;
    membres: Array<{ id: number; name: string; surname: string; email: string; photo: string; role: string }>;
  }>(`/api/report/sous-sections/${id}/members`);
}

export async function addSousSectionMember(data: {
  sous_section_id: number;
  user_id: number;
  role?: string;
}) {
  return request<{ success: boolean; message: string }>('/api/report/sous-sections/add-member', {
    method: 'POST',
    body: JSON.stringify({ ...data, role: data.role || 'editeur' }),
  });
}

export async function removeSousSectionMember(data: {
  sous_section_id: number;
  user_id: number;
}) {
  return request<{ success: boolean; message: string }>('/api/report/sous-sections/remove-member', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Membres actifs
export async function getMembresActifs() {
  return request<{
    success: boolean;
    membres: Array<{ id: number; name: string; surname: string; email: string; photo: string }>;
  }>('/api/report/membres-actifs');
}

// Admin management
export async function getReportAdmins() {
  return request<{
    success: boolean;
    admins: Array<{ id: number; user_id: number; name: string; surname: string; email: string; photo: string; can_edit_all: boolean; can_validate: boolean; can_export: boolean }>;
  }>('/api/report/admins');
}

export async function setReportAdmin(data: { user_id: number; can_edit_all?: boolean; can_validate?: boolean; can_export?: boolean }) {
  return request<{ success: boolean; message: string }>('/api/report/admins/set', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ==================== POSTERS / PLANS D'ACTION ====================

export type PosterActivity = {
  jour: string;        // ex: "DIMANCHE"
  date: string;        // ex: "31 MAI"
  titre: string;       // ex: "Priere en famille"
  details?: string;    // ex: "Reception : les ALTI - lieu a confirmer ASAP"
  horaire: string;     // ex: "16h00" / "16h - 22h" / "des 18h" / "Soiree"
  highlight?: boolean; // mise en avant
};

export type PosterData = {
  brand_name: string;          // ex: "New Praise Family"
  brand_subtitle?: string;     // ex: "FAMILY"
  program_number?: string;     // ex: "PROGRAMME N°05"
  periode_label?: string;      // ex: "MAI - JUILLET 2026"
  image_url?: string;          // URL de la photo top
  image_data?: string;         // base64 alternative
  color_dark: string;          // ex: "#1a2547"
  color_accent: string;        // ex: "#c89a3f"
  color_bg: string;            // ex: "#f4ede1"
  title_main: string;          // ex: "CALENDRIER"
  title_italic: string;        // ex: "des"
  title_secondary: string;     // ex: "ACTIVITES"
  activities: PosterActivity[];
  footer_tags?: string;        // ex: "WORSHIP - SERVICE - FAMILLE"
};

export type Poster = {
  id: number;
  titre: string;
  mois: number;
  annee: number;
  periode_label: string | null;
  data: PosterData;
  created_at?: string;
  updated_at?: string;
};

export async function getPosters() {
  return request<{ success: boolean; posters: Array<Omit<Poster, 'data'>> }>('/api/report/posters');
}

export async function getPoster(id: number) {
  return request<{ success: boolean; poster: Poster }>(`/api/report/posters/${id}`);
}

export async function savePoster(data: {
  id?: number;
  titre: string;
  mois: number;
  annee: number;
  periode_label?: string;
  data: PosterData;
}) {
  return request<{ success: boolean; id: number; message: string }>('/api/report/posters/save', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deletePoster(id: number) {
  return request<{ success: boolean; message: string }>('/api/report/posters/delete', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
}
