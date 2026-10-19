import { MessageSequence, SudokuPuzzle } from '../types';

const ADMIN_TOKEN_KEY = 'sudoku_admin_token';
const PLAYER_UNLOCK_TOKEN_KEY = 'sudoku_player_unlock_token';

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

export async function fetchRandomPuzzle(): Promise<SudokuPuzzle> {
  const res = await fetch('/api/puzzles/random');
  if (!res.ok) {
    throw new Error('Không thể tải ván Sudoku');
  }
  const data = await res.json();
  return data.puzzle;
}

export async function generateNewPuzzle(): Promise<SudokuPuzzle> {
  const res = await fetch('/api/puzzles/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error('Không thể tạo ván Sudoku mới');
  }
  const data = await res.json();
  return data.puzzle;
}

export async function verifySudokuAndUnlock(puzzleId: string, board: number[][]): Promise<{
  success: boolean;
  message?: string;
  unlockToken?: string;
  messages?: MessageSequence;
}> {
  const res = await fetch('/api/sudoku/verify-and-unlock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ puzzleId, board }),
  });
  const data = await res.json();
  if (data.success && data.unlockToken) {
    setStoredUnlockToken(data.unlockToken);
  }
  return data;
}

export async function fetchUnlockedMessages(): Promise<MessageSequence> {
  const unlockToken = getStoredUnlockToken();
  const adminToken = getStoredAdminToken();
  const token = unlockToken || adminToken;

  const res = await fetch('/api/messages/unlocked', {
    headers: {
      Authorization: `Bearer ${token || ''}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Chưa mở khóa được lời nhắn bí mật');
  }

  const data = await res.json();
  return data.messages;
}

export async function loginWithGoogleCredential(
  credential?: string,
  devBypassToken?: string
): Promise<{ success: boolean; token: string; user: { email: string; name?: string; picture?: string } }> {
  const res = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential, devBypassToken }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Đăng nhập Google thất bại');
  }

  setStoredAdminToken(data.token);
  return data;
}

export async function checkAdminAuth(): Promise<{ isAuthenticated: boolean; user?: { email: string; name?: string; picture?: string } }> {
  const token = getStoredAdminToken();
  if (!token) return { isAuthenticated: false };

  try {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setStoredAdminToken(null);
      return { isAuthenticated: false };
    }
    const data = await res.json();
    if (!data.isAuthenticated) {
      setStoredAdminToken(null);
    }
    return data;
  } catch {
    return { isAuthenticated: false };
  }
}

export async function logoutAdmin(): Promise<void> {
  const token = getStoredAdminToken();
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token || ''}` },
    });
  } finally {
    setStoredAdminToken(null);
  }
}

export async function fetchAdminDraft(): Promise<MessageSequence> {
  const token = getStoredAdminToken();
  const res = await fetch('/api/admin/draft', {
    headers: { Authorization: `Bearer ${token || ''}` },
  });
  if (!res.ok) {
    throw new Error('Không thể tải bản nháp');
  }
  const data = await res.json();
  return data.draft;
}

export async function saveAdminDraft(draft: MessageSequence): Promise<void> {
  const token = getStoredAdminToken();
  const res = await fetch('/api/admin/draft', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
    },
    body: JSON.stringify({ draft }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Lỗi lưu bản nháp');
  }
}

export async function publishAdminDraft(): Promise<MessageSequence> {
  const token = getStoredAdminToken();
  const res = await fetch('/api/admin/publish', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Lỗi xuất bản');
  }
  const data = await res.json();
  return data.published;
}

export async function fetchAdminConfig(): Promise<{ adminEmail: string; hasGoogleClientId: boolean; googleClientId: string | null }> {
  const token = getStoredAdminToken();
  const res = await fetch('/api/admin/config', {
    headers: { Authorization: `Bearer ${token || ''}` },
  });
  if (!res.ok) {
    throw new Error('Lỗi lấy cấu hình');
  }
  return res.json();
}
