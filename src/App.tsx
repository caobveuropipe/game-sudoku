import React, { useState, useEffect } from 'react';
import { Sparkles, Shield, Gamepad2, Eye, RefreshCw, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { MessageSequence } from './types';
import { SudokuGame } from './components/sudoku/SudokuGame';
import { MessageViewer } from './components/messages/MessageViewer';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { MusicPlayer } from './components/audio/MusicPlayer';
import {
  fetchUnlockedMessages,
  getStoredUnlockToken,
  fetchSequenceFromCloud,
  saveSyncedSequenceLocally,
  setStoredUnlockToken,
} from './services/api';

type AppView = 'game' | 'messages' | 'admin';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('game');
  const [unlockedSequence, setUnlockedSequence] = useState<MessageSequence | null>(null);
  const [hasUnlockedOnce, setHasUnlockedOnce] = useState<boolean>(false);
  const [syncNotification, setSyncNotification] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isManualSyncOpen, setIsManualSyncOpen] = useState<boolean>(false);
  const [manualSyncKey, setManualSyncKey] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Do NOT pre-unlock on load. Player must solve and win the current game!
  useEffect(() => {
    // Check for sync parameter in URL (?sync=KEY or #sync=KEY)
    const urlParams = new URLSearchParams(window.location.search);
    const querySync = urlParams.get('sync');
    let hashSync = '';
    if (window.location.hash.startsWith('#sync=')) {
      hashSync = window.location.hash.replace('#sync=', '');
    }

    const syncKey = (querySync || hashSync || '').trim();
    if (syncKey) {
      setSyncNotification({ text: 'Đang đồng bộ dữ liệu lời nhắn mới...', type: 'info' });
      fetchSequenceFromCloud(syncKey)
        .then(syncedSeq => {
          saveSyncedSequenceLocally(syncedSeq);
          setSyncNotification({
            text: '🎉 Đã đồng bộ thành công chuỗi lời nhắn mới nhất vào máy của bạn!',
            type: 'success',
          });
          // Clean URL without reloading page
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
          setTimeout(() => setSyncNotification(null), 5000);
        })
        .catch(err => {
          console.error('URL sync failed:', err);
          setSyncNotification({
            text: 'Không thể đồng bộ: ' + (err.message || 'Mã không hợp lệ'),
            type: 'error',
          });
          setTimeout(() => setSyncNotification(null), 5000);
        });
    }
  }, []);

  const handleResetGame = () => {
    setHasUnlockedOnce(false);
    setUnlockedSequence(null);
    setStoredUnlockToken(null);
    if (currentView === 'messages') {
      setCurrentView('game');
    }
  };

  const handlePuzzleWon = (sequence: MessageSequence) => {
    setUnlockedSequence(sequence);
    setHasUnlockedOnce(true);
  };

  const handleManualSync = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = manualSyncKey.trim();
    if (!key) return;

    setIsSyncing(true);
    try {
      const syncedSeq = await fetchSequenceFromCloud(key);
      saveSyncedSequenceLocally(syncedSeq);
      setUnlockedSequence(syncedSeq);
      setSyncNotification({
        text: '🎉 Đã đồng bộ thành công chuỗi lời nhắn mới vào thiết bị!',
        type: 'success',
      });
      setIsManualSyncOpen(false);
      setManualSyncKey('');
      setTimeout(() => setSyncNotification(null), 5000);
    } catch (err: any) {
      alert('Đồng bộ thất bại: ' + (err.message || 'Vui lòng kiểm tra lại mã'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUnlockMessages = (messages: MessageSequence) => {
    setUnlockedSequence(messages);
    setHasUnlockedOnce(true);
    setCurrentView('messages');
  };

  return (
    <div className="min-h-screen flex flex-col relative text-slate-800">
      {/* Soft Pink Background Wallpaper with Gentle Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center opacity-45 mix-blend-multiply"
        style={{ backgroundImage: `url('/soft_pink_bg.jpg')` }}
      />
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-rose-50/70 via-pink-50/40 to-rose-100/50" />

      {/* Top Application Header */}
      {/* Top Application Header - hidden in admin to maximize workspace and prevent dual-header overlap */}
      {currentView !== 'admin' && (
        <header className="bg-white/80 backdrop-blur-md border-b border-rose-200/60 sticky top-0 z-40 px-4 sm:px-6 py-2.5 shadow-xs">
          <div className="max-w-6xl mx-auto flex items-center justify-between relative z-10">
            <div
              onClick={() => setCurrentView('game')}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-400 to-pink-500 group-hover:from-rose-500 group-hover:to-pink-600 text-white flex items-center justify-center shadow-sm shadow-rose-400/30 transition-all">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight font-serif-display">
                Sudoku & Lời Nhắn
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Manual sync button (especially useful on mobile) */}
              <button
                type="button"
                onClick={() => setIsManualSyncOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-rose-950 text-xs font-medium transition-colors cursor-pointer border border-rose-200/70 shadow-2xs"
                title="Đồng bộ lời nhắn từ PC hoặc máy khác"
              >
                <RefreshCw className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden sm:inline">Đồng bộ</span>
              </button>

              {/* Background Music Player Controller */}
              <MusicPlayer />

              {/* If player already won & unlocked, show quick link */}
              {hasUnlockedOnce && unlockedSequence && currentView !== 'messages' && (
                <button
                  type="button"
                  onClick={() => setCurrentView('messages')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 text-xs font-semibold transition-colors cursor-pointer border border-rose-200"
                >
                  <Eye className="w-3.5 h-3.5 text-rose-600" />
                  <span>Xem lời nhắn</span>
                </button>
              )}

              {currentView === 'messages' && (
                <button
                  type="button"
                  onClick={() => setCurrentView('game')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-white/90 hover:bg-white text-xs font-semibold text-rose-900 transition-colors cursor-pointer shadow-2xs"
                >
                  <Gamepad2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Về bàn cờ</span>
                </button>
              )}

              {/* Admin navigation button */}
              <button
                type="button"
                onClick={() => setCurrentView('admin')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-rose-950 text-xs font-medium transition-colors cursor-pointer border border-rose-200/70 shadow-2xs"
                title="Quản trị viên"
              >
                <Shield className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden sm:inline">Quản trị</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Cross-device Sync Floating Notification */}
      {syncNotification && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs sm:text-sm font-medium flex items-center gap-2 max-w-md w-[92%] backdrop-blur-md bg-white/95 border-rose-300 text-rose-950">
          {syncNotification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : syncNotification.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          ) : (
            <RefreshCw className="w-5 h-5 text-rose-500 shrink-0 animate-spin" />
          )}
          <span className="flex-1">{syncNotification.text}</span>
          <button
            type="button"
            onClick={() => setSyncNotification(null)}
            className="p-1 rounded-lg hover:bg-rose-100 text-rose-400 hover:text-rose-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Manual Sync Modal */}
      {isManualSyncOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-rose-200 text-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Đồng Bộ Từ PC</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsManualSyncOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Nếu bạn vừa sửa lời nhắn trên máy tính (PC), hãy nhập mã đồng bộ (10 ký tự) hiển thị trên màn hình Admin PC để tải ngay chuỗi lời nhắn mới nhất vào điện thoại này.
            </p>

            <form onSubmit={handleManualSync} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mã đồng bộ (Sync Key):
                </label>
                <input
                  type="text"
                  value={manualSyncKey}
                  onChange={e => setManualSyncKey(e.target.value)}
                  placeholder="Ví dụ: YXc9fPhjQn"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm font-mono text-center tracking-wider placeholder:tracking-normal placeholder:font-sans"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualSyncOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSyncing || !manualSyncKey.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-xs font-semibold text-white shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSyncing ? 'Đang tải...' : 'Tải dữ liệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 flex flex-col relative z-10">
        <div className={currentView === 'game' ? 'block' : 'hidden'}>
          <SudokuGame
            onUnlockMessages={handleUnlockMessages}
            onOpenAdmin={() => setCurrentView('admin')}
            onResetGame={handleResetGame}
            onPuzzleWon={handlePuzzleWon}
          />
        </div>

        {currentView === 'messages' && unlockedSequence && (
          <div className="py-4 sm:py-6 flex-1 flex flex-col items-center justify-center">
            <MessageViewer
              sequence={unlockedSequence}
              onBackToSudoku={() => setCurrentView('game')}
            />
          </div>
        )}

        {currentView === 'admin' && (
          <AdminDashboard onBackToGame={() => setCurrentView('game')} />
        )}
      </main>

      {/* Minimal Footer */}
      {currentView !== 'admin' && (
        <footer className="mt-auto py-3 border-t border-rose-200/40 bg-white/50 backdrop-blur-xs text-center text-xs text-rose-900/60 px-4 relative z-10">
          <span>Sudoku & Chuỗi Lời Nhắn Bí Mật • Tone hồng nhẹ nhàng</span>
        </footer>
      )}
    </div>
  );
}
