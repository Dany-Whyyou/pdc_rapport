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
export async function login(email: string, password: string) {
  return request<{
    token: string;
    user: {
      id: number;
      name: string;
      surname: string;
      email: string;
      photo: string;
      sous_sections: Array<{ id: number; nom: string }>;
      is_admin: boolean;
      admin_rights: string[];
    };
  }>('/api/report/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// Sous-sections
export async function getSousSections() {
  return request<Array<{ id: number; nom: string; section_id: number; section_nom: string }>>(
    '/api/report/sous-sections'
  );
}

// Reports
export async function getReports(params?: { year?: number; status?: string }) {
  return request<
    Array<{
      id: number;
      titre: string;
      annee: number;
      trimestre: number;
      statut: string;
      created_at: string;
      updated_at: string;
    }>
  >('/api/report/list', {
    method: 'POST',
    body: JSON.stringify(params || {}),
  });
}

export async function getReport(id: number) {
  return request<{
    id: number;
    titre: string;
    annee: number;
    trimestre: number;
    statut: string;
    sous_sections: Array<{
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
    }>;
  }>('/api/report/get', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
}

export async function createReport(data: {
  titre: string;
  annee: number;
  trimestre: number;
  type?: string;
}) {
  return request<{ id: number; message: string }>('/api/report/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Bilan entries
export async function saveBilanEntry(data: {
  id?: number;
  report_id: number;
  sous_section_id: number;
  theme: string;
  points_positifs: string;
  points_negatifs: string;
  propositions: string;
}) {
  return request<{ id: number; message: string }>('/api/report/bilan/save', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteBilanEntry(id: number) {
  return request<{ message: string }>('/api/report/bilan/delete', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
}

// Plan d'action entries
export async function savePlanEntry(data: {
  id?: number;
  report_id: number;
  sous_section_id: number;
  defi: string;
  action_a: string;
  action_b: string;
  action_c: string;
  action_d: string;
}) {
  return request<{ id: number; message: string }>('/api/report/plan/save', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deletePlanEntry(id: number) {
  return request<{ message: string }>('/api/report/plan/delete', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
}

// Validation
export async function validateReport(id: number) {
  return request<{ message: string }>('/api/report/validate', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
}

// Sous-section members
export async function getSousSectionMembers(id: number) {
  return request<
    Array<{ id: number; name: string; surname: string; email: string; photo: string }>
  >('/api/report/sous-section/members', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
}

export async function addSousSectionMember(data: {
  sous_section_id: number;
  membre_id: number;
}) {
  return request<{ message: string }>('/api/report/sous-section/add-member', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function removeSousSectionMember(data: {
  sous_section_id: number;
  membre_id: number;
}) {
  return request<{ message: string }>('/api/report/sous-section/remove-member', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Membres actifs
export async function getMembresActifs() {
  return request<
    Array<{ id: number; name: string; surname: string; email: string; photo: string }>
  >('/api/report/membres-actifs');
}

// Admin management
export async function getReportAdmins() {
  return request<
    Array<{ id: number; name: string; surname: string; email: string; photo: string }>
  >('/api/report/admins');
}

export async function setReportAdmin(data: { membre_id: number; is_admin: boolean }) {
  return request<{ message: string }>('/api/report/admins/set', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
