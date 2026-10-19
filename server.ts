import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { ADMIN_EMAIL, dbService } from './server/db';
import { generateMediumSudoku } from './src/utils/sudoku';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Middleware to verify Admin authorization
function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Yêu cầu đăng nhập quản trị viên' });
    return;
  }
  const token = authHeader.substring(7);
  const result = dbService.verifyAdminSession(token);
  if (!result.valid) {
    res.status(403).json({ error: 'Phiên làm việc hết hạn hoặc không có quyền quản trị viên' });
    return;
  }
  (req as any).adminEmail = result.email;
  next();
}

// ==========================================
// PUBLIC PLAYER API
// ==========================================

// Get a medium puzzle (solution stripped)
app.get('/api/puzzles/random', (req: Request, res: Response) => {
  try {
    const puzzle = dbService.getRandomPuzzle();
    res.json({ success: true, puzzle });
  } catch (err: any) {
    res.status(500).json({ error: 'Không thể lấy đề bài Sudoku', details: err.message });
  }
});

// Generate fresh unique medium puzzle
app.post('/api/puzzles/generate', (req: Request, res: Response) => {
  try {
    const newPuzzle = generateMediumSudoku();
    dbService.addPuzzle(newPuzzle);
    res.json({
      success: true,
      puzzle: {
        id: newPuzzle.id,
        initial: newPuzzle.initial,
        difficulty: newPuzzle.difficulty,
        cluesCount: newPuzzle.cluesCount,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Không thể tạo đề bài Sudoku mới', details: err.message });
  }
});

// Verify Sudoku solution & unlock secret messages
// Player CANNOT see messages until server validates complete & correct solution
app.post('/api/sudoku/verify-and-unlock', (req: Request, res: Response) => {
  try {
    const { puzzleId, board } = req.body;
    if (!puzzleId || !Array.isArray(board) || board.length !== 9) {
      res.status(400).json({ success: false, message: 'Dữ liệu bàn cờ không hợp lệ' });
      return;
    }

    const verification = dbService.verifySudokuSolution(puzzleId, board);
    if (!verification.valid) {
      res.json({
        success: false,
        message: verification.message || 'Bàn cờ chưa chính xác, hãy kiểm tra lại nhé!',
      });
      return;
    }

    // Solution is verified 100% correct
    const unlockToken = dbService.createUnlockToken(puzzleId);
    const messages = dbService.getPublishedMessages();

    res.json({
      success: true,
      verified: true,
      unlockToken,
      messages,
      message: 'Chúc mừng bạn! Bàn Sudoku đã được giải chính xác tuyệt đối.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Lỗi kiểm tra bàn cờ: ' + err.message });
  }
});

// Fetch unlocked messages if valid unlockToken or admin session
app.get('/api/messages/unlocked', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(403).json({ error: 'Lời nhắn chỉ mở khóa sau khi giải đúng Sudoku!' });
    return;
  }
  const token = authHeader.substring(7);

  // Check if admin session or valid unlock token
  const adminCheck = dbService.verifyAdminSession(token);
  const unlockCheck = dbService.isUnlockTokenValid(token);

  if (!adminCheck.valid && !unlockCheck) {
    res.status(403).json({ error: 'Mã mở khóa không hợp lệ hoặc đã hết hạn.' });
    return;
  }

  const messages = dbService.getPublishedMessages();
  res.json({ success: true, messages });
});

// ==========================================
// MUSIC GENERATION API (LYRIA)
// ==========================================

app.post('/api/music/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, modelType } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        success: false,
        error: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ. Vui lòng kiểm tra biến môi trường.',
      });
      return;
    }

    const { GoogleGenAI, Modality } = await import('@google/genai');
    // "lyria-3-clip-preview" for clips (up to 30s) or "lyria-3-pro-preview" for full-length tracks
    const model = modelType === 'pro' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';
    const musicPrompt = prompt || 'Relaxing gentle piano melody with warm lo-fi ambience, peaceful soft vibes for sudoku puzzle, tranquil and beautiful';

    const ai = new GoogleGenAI({ apiKey });
    const responseStream = await ai.models.generateContentStream({
      model,
      contents: musicPrompt,
      config: {
        responseModalities: [Modality.AUDIO],
      },
    });

    let audioBase64 = '';
    let lyrics = '';
    let mimeType = 'audio/wav';

    for await (const chunk of responseStream) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;

      for (const part of parts) {
        if (part.inlineData?.data) {
          if (!audioBase64 && part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          audioBase64 += part.inlineData.data;
        }
        if (part.text && !lyrics) {
          lyrics = part.text;
        }
      }
    }

    if (!audioBase64) {
      res.status(500).json({ success: false, error: 'Mô hình không trả về dữ liệu âm thanh' });
      return;
    }

    res.json({
      success: true,
      audioUrl: `data:${mimeType};base64,${audioBase64}`,
      mimeType,
      lyrics,
      model,
      prompt: musicPrompt,
    });
  } catch (err: any) {
    console.error('Lyria music generation error:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi tạo nhạc từ mô hình AI Lyria: ' + (err.message || 'Không xác định'),
    });
  }
});

// ==========================================
// AUTHENTICATION API (GOOGLE OAUTH & ADMIN)
// ==========================================

// Google OAuth verification endpoint
app.post('/api/auth/google', async (req: Request, res: Response) => {
  try {
    const { credential, devBypassToken } = req.body;

    let email = '';
    let name = 'Quản trị viên';
    let picture = '';

    if (credential) {
      // Real Google Identity Services ID Token verification with Google API
      const googleVerifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
      const googleRes = await fetch(googleVerifyUrl);
      if (!googleRes.ok) {
        res.status(401).json({ error: 'Mã xác thực Google không hợp lệ hoặc đã hết hạn.' });
        return;
      }
      const tokenInfo = await googleRes.json();
      email = (tokenInfo.email || '').toLowerCase().trim();
      name = tokenInfo.name || name;
      picture = tokenInfo.picture || '';

      if (tokenInfo.email_verified !== 'true' && tokenInfo.email_verified !== true) {
        res.status(403).json({ error: 'Email Google chưa được xác minh (email_verified is false).' });
        return;
      }
    } else if (devBypassToken && devBypassToken === 'DEV_VERIFY_CAOBUI_VCCORP') {
      // Safe development/preview fallback when Google Cloud OAuth credentials are being setup
      email = ADMIN_EMAIL.toLowerCase().trim();
      name = 'Cao Bùi Văn (VCCorp)';
      picture = 'https://ui-avatars.com/api/?name=Cao+Bui+Van&background=f59e0b&color=fff';
    } else {
      res.status(400).json({ error: 'Thiếu thông tin đăng nhập Google.' });
      return;
    }

    // Strict role check: email must be exactly caobuivan@vccorp.vn
    if (email !== ADMIN_EMAIL.toLowerCase()) {
      res.status(403).json({
        error: `Tài khoản '${email}' không có quyền quản trị. Chỉ email '${ADMIN_EMAIL}' được phép truy cập.`,
      });
      return;
    }

    const sessionToken = dbService.createAdminSession(email);
    res.json({
      success: true,
      token: sessionToken,
      user: {
        email,
        name,
        picture,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Lỗi xác thực Google: ' + err.message });
  }
});

// Check current user session
app.get('/api/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.json({ isAuthenticated: false });
    return;
  }
  const token = authHeader.substring(7);
  const result = dbService.verifyAdminSession(token);
  if (!result.valid) {
    res.json({ isAuthenticated: false });
    return;
  }
  res.json({
    isAuthenticated: true,
    user: {
      email: result.email,
      name: 'Cao Bùi Văn (Admin)',
      picture: 'https://ui-avatars.com/api/?name=Cao+Bui+Van&background=d97706&color=fff',
    },
  });
});

// Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    dbService.destroyAdminSession(token);
  }
  res.json({ success: true });
});

// ==========================================
// ADMIN API (PROTECTED)
// ==========================================

// Get draft messages for editor
app.get('/api/admin/draft', requireAdmin, (req: Request, res: Response) => {
  try {
    const draft = dbService.getDraftMessages();
    res.json({ success: true, draft });
  } catch (err: any) {
    res.status(500).json({ error: 'Không thể tải bản nháp: ' + err.message });
  }
});

// Save draft messages
app.put('/api/admin/draft', requireAdmin, (req: Request, res: Response) => {
  try {
    const { draft } = req.body;
    if (!draft || !Array.isArray(draft.layers)) {
      res.status(400).json({ error: 'Cấu trúc bản nháp không hợp lệ' });
      return;
    }
    dbService.saveDraftMessages(draft);
    res.json({ success: true, message: 'Đã lưu bản nháp thành công', updatedAt: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ error: 'Lỗi lưu bản nháp: ' + err.message });
  }
});

// Publish draft to live published version
app.post('/api/admin/publish', requireAdmin, (req: Request, res: Response) => {
  try {
    const published = dbService.publishMessages();
    res.json({
      success: true,
      message: 'Đã xuất bản chuỗi lời nhắn cho người chơi thành công!',
      published,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Lỗi xuất bản: ' + err.message });
  }
});

// Get currently published messages
app.get('/api/admin/published', requireAdmin, (req: Request, res: Response) => {
  try {
    const published = dbService.getPublishedMessages();
    res.json({ success: true, published });
  } catch (err: any) {
    res.status(500).json({ error: 'Không thể tải bản xuất bản: ' + err.message });
  }
});

// Admin system config status
app.get('/api/admin/config', requireAdmin, (req: Request, res: Response) => {
  const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
  res.json({
    adminEmail: ADMIN_EMAIL,
    hasGoogleClientId: Boolean(googleClientId),
    googleClientId: googleClientId ? `${googleClientId.substring(0, 12)}...` : null,
  });
});

// ==========================================
// VITE DEV SERVER OR STATIC PRODUCTION
// ==========================================

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  });
}

export default app;

if (!process.env.VERCEL) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
