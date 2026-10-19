import fs from 'fs';
import path from 'path';
import { MessageSequence, SudokuPuzzle } from '../src/types';
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

const INITIAL_SAMPLE_MESSAGES: MessageSequence = {
  id: 'secret-sequence-default',
  version: 1,
  updatedAt: new Date().toISOString(),
  publishedAt: new Date().toISOString(),
  layers: [
    {
      id: 'layer-intro',
      title: 'Màn 1: Chúc mừng chiến thắng',
      theme: 'amber',
      components: [
        {
          id: 'c-title-1',
          type: 'title',
          titleProps: {
            text: 'Chúc Mừng Bạn Đã Thắng Sudoku!',
            align: 'center',
            fontSize: 'xl',
          },
        },
        {
          id: 'c-img-1',
          type: 'image',
          imageProps: {
            url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1000&q=80',
            caption: 'Món quà bí mật dành riêng cho bạn',
            alt: 'Chúc mừng chiến thắng',
          },
        },
        {
          id: 'c-text-1',
          type: 'text',
          textProps: {
            text: 'Bạn đã xuất sắc chinh phục bàn Sudoku mức trung bình bằng sự kiên nhẫn và suy luận nhạy bén. Đây là bức thư được chuẩn bị riêng cho bạn với nhiều tầng cảm xúc.',
            align: 'center',
            style: 'normal',
          },
        },
        {
          id: 'c-btn-1',
          type: 'next_button',
          buttonProps: {
            label: 'Mở bức thư bí mật ✨',
            targetLayerId: 'layer-quiz',
          },
        },
      ],
      defaultNextLayerId: 'layer-quiz',
    },
    {
      id: 'layer-quiz',
      title: 'Màn 2: Trắc nghiệm tâm tình',
      theme: 'rose',
      components: [
        {
          id: 'c-title-2',
          type: 'title',
          titleProps: {
            text: 'Một Câu Hỏi Dành Cho Bạn',
            align: 'center',
            fontSize: 'lg',
          },
        },
        {
          id: 'c-text-2',
          type: 'text',
          textProps: {
            text: 'Trước khi tiếp tục, hãy chia sẻ điều đang dẫn lối cho trái tim bạn:',
            align: 'center',
            style: 'normal',
          },
        },
        {
          id: 'c-quiz-1',
          type: 'quiz',
          quizProps: {
            question: 'Khi đứng trước một hành trình mới, điều gì tiếp thêm cho bạn nhiều năng lượng nhất?',
            options: [
              {
                id: 'opt-resilience',
                label: 'Ý chí kiên định và bản lĩnh tự thân 🌟',
                targetLayerId: 'layer-resilience',
              },
              {
                id: 'opt-connection',
                label: 'Sự yêu thương và kết nối ấm áp từ người đồng hành ☕',
                targetLayerId: 'layer-connection',
              },
            ],
          },
        },
      ],
      defaultNextLayerId: 'layer-resilience',
    },
    {
      id: 'layer-resilience',
      title: 'Màn 3A: Nhánh Bản lĩnh',
      theme: 'indigo',
      components: [
        {
          id: 'c-title-3a',
          type: 'title',
          titleProps: {
            text: 'Ngọn Hải Đăng Của Ý Chí',
            align: 'center',
            fontSize: 'lg',
          },
        },
        {
          id: 'c-img-3a',
          type: 'image',
          imageProps: {
            url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
            caption: 'Vững vàng trước mọi thử thách',
            alt: 'Bình minh và biển rộng',
          },
        },
        {
          id: 'c-text-3a',
          type: 'text',
          textProps: {
            text: 'Nội lực và sự kiên trì của bạn tựa như ánh hải đăng vững chãi trong đêm tối. Dù con đường phía trước có thử thách đến đâu, bạn luôn có đủ trí tuệ để tìm ra lời giải đẹp nhất.',
            align: 'center',
            style: 'normal',
          },
        },
        {
          id: 'c-btn-3a',
          type: 'next_button',
          buttonProps: {
            label: 'Đọc lời chúc kết thúc →',
            targetLayerId: 'layer-final',
          },
        },
      ],
      defaultNextLayerId: 'layer-final',
    },
    {
      id: 'layer-connection',
      title: 'Màn 3B: Nhánh Kết nối',
      theme: 'emerald',
      components: [
        {
          id: 'c-title-3b',
          type: 'title',
          titleProps: {
            text: 'Tách Trà Ấm & Những Yêu Thương',
            align: 'center',
            fontSize: 'lg',
          },
        },
        {
          id: 'c-img-3b',
          type: 'image',
          imageProps: {
            url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1000&q=80',
            caption: 'Ấm áp giữa những khoảnh khắc dịu êm',
            alt: 'Tách trà và cuốn sách',
          },
        },
        {
          id: 'c-text-3b',
          type: 'text',
          textProps: {
            text: 'Những điều ngọt ngào nhất trên thế gian luôn bắt đầu từ sự chân thành và thấu hiểu. Cảm ơn bạn vì đã luôn mang đến nguồn năng lượng dịu dàng, tử tế cho những người xung quanh.',
            align: 'center',
            style: 'normal',
          },
        },
        {
          id: 'c-btn-3b',
          type: 'next_button',
          buttonProps: {
            label: 'Đọc lời chúc kết thúc →',
            targetLayerId: 'layer-final',
          },
        },
      ],
      defaultNextLayerId: 'layer-final',
    },
    {
      id: 'layer-final',
      title: 'Màn 4: Lời chúc bình an',
      theme: 'warm',
      components: [
        {
          id: 'c-title-4',
          type: 'title',
          titleProps: {
            text: 'Chúc Bạn Luôn Rạng Rỡ & Bình An',
            align: 'center',
            fontSize: 'xl',
          },
        },
        {
          id: 'c-img-4',
          type: 'image',
          imageProps: {
            url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1000&q=80',
            caption: 'Nắng ấm ngập tràn lối đi',
            alt: 'Ánh nắng bình yên',
          },
        },
        {
          id: 'c-text-4',
          type: 'text',
          textProps: {
            text: 'Cuộc sống đôi khi cũng giống như một bàn cờ nhiều ô trống: chỉ cần bình tĩnh suy ngẫm, mọi nút thắt đều sẽ tìm thấy câu trả lời hoàn hảo. Chúc bạn mỗi ngày đều đầy ắp nụ cười, hạnh phúc và thành công rực rỡ!',
            align: 'center',
            style: 'normal',
          },
        },
        {
          id: 'c-text-signature',
          type: 'text',
          textProps: {
            text: '— Gửi từ một người luôn ủng hộ và dõi theo bạn 💛',
            align: 'center',
            style: 'italic',
          },
        },
        {
          id: 'c-btn-restart',
          type: 'next_button',
          buttonProps: {
            label: 'Đọc lại từ đầu 🔄',
            targetLayerId: 'layer-intro',
          },
        },
      ],
      defaultNextLayerId: 'layer-intro',
    },
  ],
};

function ensureDb(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(raw) as DatabaseSchema;
      return data;
    } catch (e) {
      console.error('Error reading db file, re-initializing:', e);
    }
  }

  const defaultDb: DatabaseSchema = {
    adminEmail: ADMIN_EMAIL,
    sessions: {},
    puzzles: CURATED_MEDIUM_PUZZLES,
    draftMessages: JSON.parse(JSON.stringify(INITIAL_SAMPLE_MESSAGES)),
    publishedMessages: JSON.parse(JSON.stringify(INITIAL_SAMPLE_MESSAGES)),
    unlockTokens: {},
  };

  saveDb(defaultDb);
  return defaultDb;
}

function saveDb(data: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
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
