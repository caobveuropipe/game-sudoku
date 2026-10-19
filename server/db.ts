import fs from 'fs';
import path from 'path';
import type { MessageSequence, SudokuPuzzle } from '../src/types';
import { CURATED_MEDIUM_PUZZLES, isBoardCompleteAndValid } from '../src/utils/sudoku';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'app_database.json');

export const ADMIN_EMAIL = 'caobuivan@vccorp.vn';

interface DatabaseSchema {
  adminEmail: string;
  sessions: Record<string, { email: string; createdAt: number; expiresAt: number }>;
  puzzles: SudokuPuzzle[];
  draftMessages: MessageSequence;
  publishedMessages: MessageSequence;
  unlockTokens: Record<string, { puzzleId: string; expiresAt: number }>;
}

import { INITIAL_SAMPLE_MESSAGES } from '../src/utils/defaultMessages';

let memoryDb: DatabaseSchema | null = null;

function getDbFilePath(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join('/tmp', 'app_database.json');
  }
  return DB_FILE;
}

function ensureDb(): DatabaseSchema {
  if (memoryDb) return memoryDb;

  try {
    const targetFile = getDbFilePath();
    for (const f of [targetFile, DB_FILE]) {
      if (f && fs.existsSync(f)) {
        try {
          const raw = fs.readFileSync(f, 'utf-8');
          const parsed = JSON.parse(raw) as DatabaseSchema;
          if (parsed && Array.isArray(parsed.puzzles) && parsed.puzzles.length > 0) {
            memoryDb = parsed;
            return memoryDb;
          }
        } catch (e) {
          console.warn('Error reading db file from', f, e);
        }
      }
    }
  } catch (err) {
    console.warn('Filesystem access failed, falling back to memory DB:', err);
  }

  const defaultDb: DatabaseSchema = {
    adminEmail: ADMIN_EMAIL,
    sessions: {},
    puzzles: CURATED_MEDIUM_PUZZLES || [],
    draftMessages: JSON.parse(JSON.stringify(INITIAL_SAMPLE_MESSAGES)),
    publishedMessages: JSON.parse(JSON.stringify(INITIAL_SAMPLE_MESSAGES)),
    unlockTokens: {},
  };

  memoryDb = defaultDb;
  try {
    saveDb(defaultDb);
  } catch {
    // ignore
  }
  return defaultDb;
}

function saveDb(data: DatabaseSchema): void {
  memoryDb = data;
  try {
    const targetFile = getDbFilePath();
    if (!targetFile) return;
    const dir = path.dirname(targetFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tempFile = `${targetFile}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, targetFile);
  } catch (err) {
    console.warn('Could not persist database to disk (in-memory will be used):', err);
  }
}

export const dbService = {
  getDb(): DatabaseSchema {
    return ensureDb();
  },

  getRandomPuzzle(): SudokuPuzzle {
    const db = ensureDb();
    const index = Math.floor(Math.random() * db.puzzles.length);
    const puzzle = db.puzzles[index];
    // Strip solution before returning to client
    return {
      id: puzzle.id,
      difficulty: puzzle.difficulty,
      cluesCount: puzzle.cluesCount,
      initial: puzzle.initial,
    };
  },

  getPuzzleById(id: string): SudokuPuzzle | undefined {
    const db = ensureDb();
    return db.puzzles.find(p => p.id === id);
  },

  addPuzzle(puzzle: SudokuPuzzle): void {
    const db = ensureDb();
    db.puzzles.push(puzzle);
    saveDb(db);
  },

  verifySudokuSolution(puzzleId: string, board: number[][]): { valid: boolean; message?: string } {
    const db = ensureDb();
    const puzzle = db.puzzles.find(p => p.id === puzzleId);
    if (!puzzle) {
      return { valid: false, message: 'Không tìm thấy thông tin đề bài' };
    }

    // Check given initial cells match
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (puzzle.initial[r][c] !== 0 && puzzle.initial[r][c] !== board[r][c]) {
          return { valid: false, message: 'Bàn cờ không khớp với các ô gợi ý ban đầu' };
        }
      }
    }

    // Check board validity & completeness
    if (!isBoardCompleteAndValid(board)) {
      return { valid: false, message: 'Bàn cờ chưa hoàn chỉnh hoặc có ô không hợp lệ' };
    }

    // Check against expected solution if present
    if (puzzle.solution) {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (puzzle.solution[r][c] !== board[r][c]) {
            return { valid: false, message: 'Lời giải chưa chính xác với đáp án của đề bài' };
          }
        }
      }
    }

    return { valid: true };
  },

  createUnlockToken(puzzleId: string): string {
    const db = ensureDb();
    const token = 'unlock_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    db.unlockTokens[token] = {
      puzzleId,
      expiresAt: Date.now() + 1000 * 60 * 120, // 2 hours
    };
    saveDb(db);
    return token;
  },

  isUnlockTokenValid(token: string): boolean {
    if (!token) return false;
    const db = ensureDb();
    const entry = db.unlockTokens[token];
    if (!entry) return false;
    if (entry.expiresAt < Date.now()) {
      delete db.unlockTokens[token];
      saveDb(db);
      return false;
    }
    return true;
  },

  getPublishedMessages(): MessageSequence {
    const db = ensureDb();
    return db.publishedMessages;
  },

  getDraftMessages(): MessageSequence {
    const db = ensureDb();
    return db.draftMessages;
  },

  saveDraftMessages(seq: MessageSequence): void {
    const db = ensureDb();
    db.draftMessages = {
      ...seq,
      updatedAt: new Date().toISOString(),
    };
    saveDb(db);
  },

  publishMessages(): MessageSequence {
    const db = ensureDb();
    const now = new Date().toISOString();
    db.draftMessages.version = (db.draftMessages.version || 1) + 1;
    db.draftMessages.updatedAt = now;
    db.publishedMessages = {
      ...JSON.parse(JSON.stringify(db.draftMessages)),
      publishedAt: now,
    };
    saveDb(db);
    return db.publishedMessages;
  },

  createAdminSession(email: string): string {
    const db = ensureDb();
    const sessionToken = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    db.sessions[sessionToken] = {
      email,
      createdAt: Date.now(),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    };
    saveDb(db);
    return sessionToken;
  },

  verifyAdminSession(sessionToken: string): { valid: boolean; email?: string } {
    if (!sessionToken) return { valid: false };
    const db = ensureDb();
    const session = db.sessions[sessionToken];
    if (!session) return { valid: false };
    if (session.expiresAt < Date.now()) {
      delete db.sessions[sessionToken];
      saveDb(db);
      return { valid: false };
    }
    return { valid: session.email.toLowerCase() === ADMIN_EMAIL.toLowerCase(), email: session.email };
  },

  destroyAdminSession(sessionToken: string): void {
    const db = ensureDb();
    if (db.sessions[sessionToken]) {
      delete db.sessions[sessionToken];
      saveDb(db);
    }
  },
};
