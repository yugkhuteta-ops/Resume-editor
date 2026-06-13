const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const FILE_NAME = 'resume-editor-data.json';
const MIME_TYPE = 'application/json';

export function getStoredToken(): string | null {
  try {
    return sessionStorage.getItem('google_drive_token');
  } catch {
    return null;
  }
}

export function storeToken(token: string): void {
  try {
    sessionStorage.setItem('google_drive_token', token);
  } catch {}
}

export function clearToken(): void {
  try {
    sessionStorage.removeItem('google_drive_token');
  } catch {}
}

async function driveFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers as Record<string, string> || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    clearToken();
    throw new Error('Token expired');
  }

  return res;
}

async function request(method: string, url: string, body?: BodyInit | null, extraHeaders?: Record<string, string>) {
  const res = await driveFetch(url, {
    method,
    body,
    headers: {
      ...(extraHeaders || {}),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive API error ${res.status}: ${err}`);
  }
  return res.status === 204 ? null : res.json();
}

export async function findFile(): Promise<string | null> {
  const data = await request(
    'GET',
    `${DRIVE_API}/files?q=name='${FILE_NAME}' and trashed=false&fields=files(id,name)`
  );
  if (data?.files?.length > 0) return data.files[0].id;
  return null;
}

export async function readFile(fileId: string): Promise<unknown> {
  const res = await driveFetch(`${DRIVE_API}/files/${fileId}?alt=media`);
  if (!res.ok) throw new Error('Failed to read Drive file');
  return res.json();
}

export async function createFile(content: unknown): Promise<string> {
  const metadata = JSON.stringify({ name: FILE_NAME, mimeType: MIME_TYPE });
  const form = new FormData();
  form.append('metadata', new Blob([metadata], { type: 'application/json' }));
  form.append('file', new Blob([JSON.stringify(content)], { type: MIME_TYPE }));
  const data = await request('POST', `${DRIVE_API}/files?uploadType=multipart&fields=id`, form);
  return data.id;
}

export async function updateFile(fileId: string, content: unknown): Promise<void> {
  const form = new FormData();
  form.append('file', new Blob([JSON.stringify(content)], { type: MIME_TYPE }));
  await request(
    'PATCH',
    `${DRIVE_API}/files/${fileId}?uploadType=multipart`,
    form
  );
}

export function getAuthUrl(clientId: string): string {
  const redirectUri = window.location.origin;
  const scope = 'https://www.googleapis.com/auth/drive.file';
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope,
    include_granted_scopes: 'true',
    state: 'resume-editor',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export function handleRedirectCallback(): string | null {
  const hash = window.location.hash;
  if (!hash) return null;

  const params = new URLSearchParams(hash.replace('#', '?'));
  const token = params.get('access_token');
  const state = params.get('state');

  if (token && state === 'resume-editor') {
    storeToken(token);
    window.location.hash = '';
    return token;
  }

  return null;
}
