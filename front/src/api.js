// Client HTTP : ajoute le JWT, gère les erreurs et la déconnexion automatique.
const TOKEN_KEY = 'sc_token';
const USER_KEY = 'sc_user';

function lire(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function getUser() {
  try { return JSON.parse(lire(USER_KEY)); } catch { return null; }
}

export function saveSession(token, user) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch { /* stockage indisponible */ }
}

export function logout() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem('sc_chat');
  } catch { /* ignore */ }
}

export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  const token = lire(TOKEN_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (form) payload = form; // multipart : le navigateur pose lui-même le Content-Type
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(`/api${path}`, { method, headers, body: payload });

  if (res.status === 401 && path !== '/auth/login') {
    logout();
    window.location.href = '/login';
  }

  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json() : await res.blob();
  if (!res.ok) {
    const err = new Error((isJson && data.error) || `Erreur ${res.status}`);
    err.status = res.status;
    err.data = isJson ? data : null;
    throw err;
  }
  return data;
}

// ─── Libellés ──────────────────────────────────────────────────────────
export const STATUTS = { NOUVEAU: 'Nouveau', EN_COURS: 'En cours', RESOLU: 'Résolu' };
export const PRIORITES = { NORMALE: 'Normale', HAUTE: 'Haute', CRITIQUE: 'Critique' };

export const formatDate = (d) =>
  d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
