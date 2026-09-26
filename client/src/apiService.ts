import axios from 'axios';

export const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE) || 'http://127.0.0.1:8000';

const TOKEN_KEY = 'access_token';
const USER_ID_KEY = 'user_id';
export const LAST_ACTIVITY_KEY = 'last_activity_at';

function safeLocalStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return safeLocalStorageGet(TOKEN_KEY);
}

export function setAuth(token: string, username: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_ID_KEY, username);
  } catch {
    // e.g. Safari private mode or quota
  }
}

export function clearAuth(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  } catch {
    // ignore
  }
}

/** Authenticated axios instance: adds Bearer token and handles 401 */
function createAuthClient() {
  const client = axios.create({ baseURL: API_BASE });
  client.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  client.interceptors.response.use(
    (r) => r,
    (err) => {
      if (err?.response?.status === 401) {
        clearAuth();
        window.location.reload();
      }
      return Promise.reject(err);
    }
  );
  return client;
}

const authClient = createAuthClient();

export interface FolderItem {
  user_id: string;
  folder_id: string;
  name: string;
  color: string;
  symbol: string;
  contract_ids: string[];
}

/** Legacy URL for viewing a contract PDF (used only when no token; prefer getPdfBlobUrl). */
export const getViewPdfUrl = (contractId: string, _userId: string) =>
  `${API_BASE}/view/${contractId}/pdf`;

/** Fetch PDF with JWT and return a blob URL for use in iframe. Caller should revoke object URL when done. */
export async function getPdfBlobUrl(contractId: string): Promise<string> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE}/view/${contractId}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load PDF');
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export const api = {
  getContracts: () => authClient.get<{ contracts: unknown[] }>('/contracts'),
  checkGoogle: () => authClient.get<{ connected: boolean; picture_url?: string }>('/check-google-connection'),
  authenticate: (endpoint: string, data: URLSearchParams) =>
    axios.post(`${API_BASE}/${endpoint}`, data.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  connectGoogle: () => authClient.get<{ url: string }>('/auth/google'),
  upload: (formData: FormData) => authClient.post('/contracts/upload', formData),
  deleteContract: (id: string) => authClient.delete(`/contracts/${id}`),
  updateReminder: (data: { contract_id: string; reminder_setting: string }) =>
    authClient.post('/update-reminder', data),
  getFolders: () => authClient.get<{ folders: FolderItem[] }>('/folders'),
  createFolder: (data: { name: string; color?: string; symbol?: string }) =>
    authClient.post<{ folder: FolderItem }>('/folders', data),
  updateFolder: (folderId: string, data: { name?: string; color?: string; symbol?: string; contract_ids?: string[] }) =>
    authClient.patch<{ folder: FolderItem }>(`/folders/${folderId}`, data),
  deleteFolder: (folderId: string) => authClient.delete(`/folders/${folderId}`),
};
