import React, { useState, useEffect } from 'react';
import { Sparkles, Shield, Gamepad2, HeartHandshake, Eye, ArrowLeft } from 'lucide-react';
import { MessageSequence } from './types';
import { SudokuGame } from './components/sudoku/SudokuGame';
import { MessageViewer } from './components/messages/MessageViewer';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { MusicPlayer } from './components/audio/MusicPlayer';
import { fetchUnlockedMessages, getStoredUnlockToken } from './services/api';

type AppView = 'game' | 'messages' | 'admin';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('game');
  const [unlockedSequence, setUnlockedSequence] = useState<MessageSequence | null>(null);
  const [hasUnlockedOnce, setHasUnlockedOnce] = useState<boolean>(false);

  // Check if player has already unlocked messages in previous session
  useEffect(() => {
    const token = getStoredUnlockToken();
    if (token) {
      fetchUnlockedMessages()
        .then(seq => {
          if (seq && seq.layers && seq.layers.length > 0) {
            setUnlockedSequence(seq);
            setHasUnlockedOnce(true);
          }
        })
        .catch(() => {
          // Token expired or invalid, keep game view
        });
    }
  }, []);

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
            {currentView !== 'admin' ? (
              <button
                type="button"
                onClick={() => setCurrentView('admin')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-rose-950 text-xs font-medium transition-colors cursor-pointer border border-rose-200/70 shadow-2xs"
                title="Quản trị viên"
              >
                <Shield className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden sm:inline">Quản trị</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentView('game')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Thoát quản trị</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 flex flex-col relative z-10">
        <div className={currentView === 'game' ? 'block' : 'hidden'}>
          <SudokuGame
            onUnlockMessages={handleUnlockMessages}
            onOpenAdmin={() => setCurrentView('admin')}
          />
        </div>

        {currentView === 'messages' && unlockedSequence && (
          <div className="py-6 sm:py-8 flex-1 flex flex-col items-center justify-center">
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
      <footer className="mt-auto py-3 border-t border-rose-200/40 bg-white/50 backdrop-blur-xs text-center text-xs text-rose-900/60 px-4 relative z-10">
        <span>Sudoku & Chuỗi Lời Nhắn Bí Mật • Tone hồng nhẹ nhàng</span>
      </footer>
    </div>
  );
}
