const BASE = import.meta.env.VITE_API_URL || '/api';
export const TOKEN_KEY = 'foodbridge_token';

export async function api(path, { method = 'GET', body } = {}) {
  const isForm = body instanceof FormData; // file uploads: let the browser set the multipart boundary
  const headers = isForm ? {} : { 'Content-Type': 'application/json' };
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw new Error('Cannot reach server. Is the backend running?');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('auth:logout'));
    }
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}
