/**
 * api.js — shared fetch wrapper for all page scripts.
 * Every page script should import from here instead of store.js.
 * Centralizing this means only ONE file needs to change if the
 * API base path, auth handling, or error format ever changes.
 */

/**
 * GET JSON from a backend endpoint.
 * Automatically redirects to login.php if the session is invalid (401).
 */
export async function apiGet(endpoint, params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${endpoint}?${query}` : endpoint;

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'same-origin', // send the PHP session cookie
    headers: { 'Accept': 'application/json' },
  });

  return handleResponse(res);
}

/**
 * POST JSON to a backend endpoint (create/update actions).
 */
export async function apiPost(endpoint, body = {}) {
  const res = await fetch(endpoint, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return handleResponse(res);
}

/**
 * DELETE to a backend endpoint.
 */
export async function apiDelete(endpoint, params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${endpoint}?${query}` : endpoint;

  const res = await fetch(url, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  return handleResponse(res);
}

async function handleResponse(res) {
  if (res.status === 401) {
    // Session expired or not logged in — send back to login
    window.location.href = 'login.php';
    throw new Error('Unauthorized');
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error('Invalid server response');
  }

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data;
}

/**
 * Show a simple error state inside a container element.
 * Use this in every page's catch block for consistent UX.
 */
export function renderError(container, message = 'Something went wrong. Please try again.') {
  if (!container) return;
  container.innerHTML = `
    <div class="text-center text-slate-500 py-8">
      <i class="fa-solid fa-triangle-exclamation text-amber-500 mb-2 text-xl"></i>
      <p>${message}</p>
    </div>`;
}