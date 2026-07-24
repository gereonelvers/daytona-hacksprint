'use client';

// Hackathon-grade session: the account id doubles as the bearer token, kept in
// localStorage. Enough to make the UI real for the browser-agent hero.
export const getToken = () => (typeof window === 'undefined' ? null : localStorage.getItem('lumen_token'));
export const setToken = (t) => localStorage.setItem('lumen_token', t);
export const clearToken = () => localStorage.removeItem('lumen_token');

export async function api(path, { method = 'GET', body } = {}) {
  const token = getToken();
  const res = await fetch(path, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}
