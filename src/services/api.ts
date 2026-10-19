import { MessageSequence, SudokuPuzzle } from '../types';
import {
  generateMediumSudoku,
  getRandomMediumPuzzle,
  isBoardCompleteAndValid,
} from '../utils/sudoku';
import { INITIAL_SAMPLE_MESSAGES } from '../utils/defaultMessages';

const ADMIN_TOKEN_KEY = 'sudoku_admin_token';
const PLAYER_UNLOCK_TOKEN_KEY = 'sudoku_player_unlock_token';
const LOCAL_STORAGE_DRAFT_KEY = 'sudoku_admin_draft_v1';
const LOCAL_STORAGE_PUBLISHED_KEY = 'sudoku_published_messages_v1';

export function getStoredAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setStoredAdminToken(token: string | null): void {
  if (token) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }
}

export function getStoredUnlockToken(): string | null {
  return localStorage.getItem(PLAYER_UNLOCK_TOKEN_KEY);
}

export function setStoredUnlockToken(token: string | null): void {
  if (token) {
    localStorage.setItem(PLAYER_UNLOCK_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(PLAYER_UNLOCK_TOKEN_KEY);
  }
}

// Local storage helpers for published messages and drafts (Fallback for static hosting / Vercel without active backend)
export function getLocalPublishedMessages(): MessageSequence {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_PUBLISHED_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.layers) && parsed.layers.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading local published messages:', e);
  }
  return JSON.parse(JSON.stringify(INITIAL_SAMPLE_MESSAGES));
}

export function getLocalDraftMessages(): MessageSequence {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.layers) && parsed.layers.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading local draft messages:', e);
  }
  return getLocalPublishedMessages();
}

export function saveLocalDraftMessages(draft: MessageSequence): void {
  const updated: MessageSequence = {
    ...draft,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, JSON.stringify(updated));
}

export function publishLocalDraftMessages(): MessageSequence {
  const draft = getLocalDraftMessages();
  const now = new Date().toISOString();
  draft.version = (draft.version || 1) + 1;
  draft.updatedAt = now;
  draft.publishedAt = now;
  localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, JSON.stringify(draft));
  localStorage.setItem(LOCAL_STORAGE_PUBLISHED_KEY, JSON.stringify(draft));
  return draft;
}

// Safe fetch wrapper that checks if response is valid JSON
async function safeFetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, init);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      return (await res.json()) as T;
    }
  } catch (err) {
    console.warn(`API call failed for ${url}, fallback will be used:`, err);
  }
  return null;
}

export async function fetchRandomPuzzle(): Promise<SudokuPuzzle> {
  const data = await safeFetchJson<{ success: boolean; puzzle: SudokuPuzzle }>('/api/puzzles/random');
  if (data && data.puzzle) {
    return data.puzzle;
  }
  return getRandomMediumPuzzle();
}

export async function generateNewPuzzle(): Promise<SudokuPuzzle> {
  const data = await safeFetchJson<{ success: boolean; puzzle: SudokuPuzzle }>('/api/puzzles/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (data && data.puzzle) {
    return data.puzzle;
  }
  return generateMediumSudoku();
}

export async function verifySudokuAndUnlock(puzzleId: string, board: number[][]): Promise<{
  success: boolean;
  message?: string;
  unlockToken?: string;
  messages?: MessageSequence;
}> {
  const data = await safeFetchJson<{
    success: boolean;
    message?: string;
    unlockToken?: string;
    messages?: MessageSequence;
  }>('/api/sudoku/verify-and-unlock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ puzzleId, board }),
  });

  if (data) {
    if (data.success && data.unlockToken) {
      setStoredUnlockToken(data.unlockToken);
    }
    return data;
  }

  // Client-side fallback: works 100% on Vercel static deployments
  const isValid = isBoardCompleteAndValid(board);
  if (!isValid) {
    return {
      success: false,
      message: 'Bàn cờ chưa hoàn chỉnh hoặc có ô trùng lặp theo quy tắc Sudoku!',
    };
  }

  const token = 'unlock_local_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  setStoredUnlockToken(token);
  const messages = getLocalPublishedMessages();

  return {
    success: true,
    message: 'Chúc mừng bạn! Bàn Sudoku đã được giải chính xác tuyệt đối.',
    unlockToken: token,
    messages,
  };
}

export async function fetchUnlockedMessages(): Promise<MessageSequence> {
  const unlockToken = getStoredUnlockToken();
  const adminToken = getStoredAdminToken();
  const token = unlockToken || adminToken;

  if (token) {
    const data = await safeFetchJson<{ success: boolean; messages: MessageSequence }>('/api/messages/unlocked', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (data && data.messages) {
      return data.messages;
    }
  }

  return getLocalPublishedMessages();
}

export async function loginWithGoogleCredential(
  credential?: string,
  devBypassToken?: string
): Promise<{ success: boolean; token: string; user: { email: string; name?: string; picture?: string } }> {
  const data = await safeFetchJson<{
    success: boolean;
    token: string;
    user: { email: string; name?: string; picture?: string };
    error?: string;
  }>('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential, devBypassToken }),
  });

  if (data && data.success) {
    setStoredAdminToken(data.token);
    return data;
  }

  // Fallback for dev bypass or local/static admin
  if (devBypassToken === 'DEV_VERIFY_CAOBUI_VCCORP') {
    const localToken = 'admin_local_' + Math.random().toString(36).substring(2);
    setStoredAdminToken(localToken);
    return {
      success: true,
      token: localToken,
      user: {
        email: 'caobuivan@vccorp.vn',
        name: 'Cao Bùi Văn (VCCorp)',
        picture: 'https://ui-avatars.com/api/?name=Cao+Bui+Van&background=f59e0b&color=fff',
      },
    };
  }

  throw new Error('Đăng nhập Google thất bại');
}

export async function checkAdminAuth(): Promise<{ isAuthenticated: boolean; user?: { email: string; name?: string; picture?: string } }> {
  const token = getStoredAdminToken();
  if (!token) return { isAuthenticated: false };

  const data = await safeFetchJson<{ isAuthenticated: boolean; user?: { email: string; name?: string; picture?: string } }>('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (data) {
    if (!data.isAuthenticated) {
      setStoredAdminToken(null);
    }
    return data;
  }

  // If local admin token exists
  if (token.startsWith('admin_local_') || token.startsWith('sess_')) {
    return {
      isAuthenticated: true,
      user: {
        email: 'caobuivan@vccorp.vn',
        name: 'Cao Bùi Văn (VCCorp)',
        picture: 'https://ui-avatars.com/api/?name=Cao+Bui+Van&background=f59e0b&color=fff',
      },
    };
  }

  return { isAuthenticated: false };
}

export async function logoutAdmin(): Promise<void> {
  const token = getStoredAdminToken();
  if (token) {
    await safeFetchJson('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  setStoredAdminToken(null);
}

export async function fetchAdminDraft(): Promise<MessageSequence> {
  const token = getStoredAdminToken();
  if (token) {
    const data = await safeFetchJson<{ success: boolean; draft: MessageSequence }>('/api/admin/draft', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (data && data.draft) {
      return data.draft;
    }
  }
  return getLocalDraftMessages();
}

export async function saveAdminDraft(draft: MessageSequence): Promise<void> {
  saveLocalDraftMessages(draft);
  const token = getStoredAdminToken();
  if (token) {
    await safeFetchJson('/api/admin/draft', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ draft }),
    });
  }
}

export async function publishAdminDraft(): Promise<MessageSequence> {
  const localPublished = publishLocalDraftMessages();
  const token = getStoredAdminToken();
  if (token) {
    const data = await safeFetchJson<{ success: boolean; published: MessageSequence }>('/api/admin/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (data && data.published) {
      return data.published;
    }
  }
  return localPublished;
}

export async function fetchAdminConfig(): Promise<{ adminEmail: string; hasGoogleClientId: boolean; googleClientId: string | null }> {
  const token = getStoredAdminToken();
  if (token) {
    const data = await safeFetchJson<{ adminEmail: string; hasGoogleClientId: boolean; googleClientId: string | null }>('/api/admin/config', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (data) {
      return data;
    }
  }
  return {
    adminEmail: 'caobuivan@vccorp.vn',
    hasGoogleClientId: false,
    googleClientId: null,
  };
}
