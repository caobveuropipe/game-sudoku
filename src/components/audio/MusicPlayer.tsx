import React, { useState, useEffect, useRef } from 'react';
import {
  Music,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Sliders,
  ChevronDown,
  Sparkles,
  Bell,
  X,
} from 'lucide-react';
import { audioManager, MUSIC_TRACKS, MusicTrackId } from '../../utils/audio';

export const MusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(audioManager.getIsPlaying());
  const [volume, setVolume] = useState<number>(audioManager.getVolume());
  const [currentTrack, setCurrentTrack] = useState<MusicTrackId>(audioManager.getCurrentTrack());
  const [isSfxOn, setIsSfxOn] = useState<boolean>(audioManager.isSfxOn());
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showFirstTimeTip, setShowFirstTimeTip] = useState<boolean>(false);

  const panelRef = useRef<HTMLDivElement>(null);

  // Sync state with audioManager
  useEffect(() => {
    const unsubscribe = audioManager.subscribe(() => {
      setIsPlaying(audioManager.getIsPlaying());
      setVolume(audioManager.getVolume());
      setCurrentTrack(audioManager.getCurrentTrack());
      setIsSfxOn(audioManager.isSfxOn());
    });

    // Check if user has interacted before
    const hasSeenTip = sessionStorage.getItem('sudoku_music_tip_seen');
    if (!hasSeenTip) {
      setShowFirstTimeTip(true);
    }

    return () => {
      unsubscribe();
    };
  }, []);

  // Close panel on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const handleTogglePlay = () => {
    setShowFirstTimeTip(false);
    sessionStorage.setItem('sudoku_music_tip_seen', 'true');
    audioManager.togglePlay();
  };

  const handleSelectTrack = (trackId: MusicTrackId) => {
    audioManager.setTrack(trackId);
    if (!isPlaying) {
      audioManager.play();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    audioManager.setVolume(newVol);
  };

  const activeTrackObj = MUSIC_TRACKS.find(t => t.id === currentTrack) || MUSIC_TRACKS[0];

  return (
    <div className="relative" ref={panelRef}>
      {/* Mini Tooltip reminder for first-time visitors */}
      {showFirstTimeTip && !isPlaying && (
        <div className="absolute top-full mt-2 right-0 z-50 animate-bounce duration-1000">
          <div className="bg-rose-900 text-white text-xs px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 whitespace-nowrap border border-rose-700/50">
            <Sparkles className="w-3.5 h-3.5 text-rose-300 animate-pulse" />
            <span>Bấm để bật nhạc thư giãn</span>
            <button
              onClick={e => {
                e.stopPropagation();
                setShowFirstTimeTip(false);
                sessionStorage.setItem('sudoku_music_tip_seen', 'true');
              }}
              className="ml-1 text-rose-300 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="w-2.5 h-2.5 bg-rose-900 rotate-45 absolute -top-1 right-5 border-t border-l border-rose-700/50" />
        </div>
      )}

      {/* Main Pill Controls in Header */}
      <div className="flex items-center gap-1 bg-white/90 border border-rose-200/90 rounded-2xl p-1 shadow-2xs backdrop-blur-md">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={handleTogglePlay}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            isPlaying
              ? 'bg-rose-500 text-white shadow-xs shadow-rose-400/40'
              : 'hover:bg-rose-100 text-rose-900'
          }`}
          title={isPlaying ? 'Tạm dừng nhạc' : 'Phát nhạc thư giãn'}
        >
          {isPlaying ? (
            <>
              {/* Equalizer animation */}
              <div className="flex items-end gap-0.5 h-3.5 w-3.5 justify-center">
                <span className="w-0.5 bg-white rounded-full animate-[bounce_0.8s_ease-in-out_infinite] h-2.5" />
                <span className="w-0.5 bg-white rounded-full animate-[bounce_0.6s_ease-in-out_infinite_0.2s] h-3.5" />
                <span className="w-0.5 bg-white rounded-full animate-[bounce_0.9s_ease-in-out_infinite_0.4s] h-1.5" />
              </div>
              <span className="hidden sm:inline font-semibold">Đang phát</span>
            </>
          ) : (
            <>
              <Music className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Bật nhạc</span>
            </>
          )}
        </button>

        {/* Settings/Track Popover Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`p-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
            isOpen
              ? 'bg-rose-200/80 text-rose-950'
              : 'hover:bg-rose-100 text-rose-700'
          }`}
          title="Tùy chỉnh âm lượng & bản nhạc"
        >
          {volume === 0 ? (
            <VolumeX className="w-3.5 h-3.5 text-rose-400" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-rose-600" />
          )}
        </button>
      </div>

      {/* Popover Music Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white/95 backdrop-blur-xl border border-rose-200 rounded-2xl shadow-xl shadow-rose-900/10 p-3.5 z-50 flex flex-col gap-3 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-rose-100 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-base">{activeTrackObj.icon}</span>
              <span className="text-xs font-bold text-slate-900 font-serif-display">
                Âm Nhạc Thư Giãn
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-rose-100 text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Play & Volume */}
          <div className="flex flex-col gap-2 bg-rose-50/70 p-2.5 rounded-xl border border-rose-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Âm lượng nhạc</span>
              <span className="text-rose-600 font-bold">
                {Math.round(volume * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => audioManager.setVolume(volume > 0 ? 0 : 0.5)}
                className="text-slate-500 hover:text-rose-600 cursor-pointer"
              >
                {volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-rose-600" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full h-1.5 bg-rose-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>
          </div>

          {/* Track Selection */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-rose-900/60">
              Chọn giai điệu
            </span>
            <div className="flex flex-col gap-1">
              {MUSIC_TRACKS.map(track => {
                const isSelected = track.id === currentTrack;
                return (
                  <button
                    key={track.id}
                    onClick={() => handleSelectTrack(track.id)}
                    className={`flex items-start gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-100/90 border border-rose-300 text-rose-950 font-medium'
                        : 'hover:bg-rose-50 text-slate-700 border border-transparent'
                    }`}
                  >
                    <span className="text-lg leading-none mt-0.5">{track.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900">
                          {track.title}
                        </span>
                        {isSelected && isPlaying && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight line-clamp-1 mt-0.5">
                        {track.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sound FX Toggle */}
          <div className="pt-2 border-t border-rose-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-700">
              <Bell className="w-3.5 h-3.5 text-rose-500" />
              <span>Âm thanh thao tác (click, điền số)</span>
            </div>
            <button
              onClick={() => audioManager.toggleSfx()}
              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                isSfxOn ? 'bg-rose-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-transform ${
                  isSfxOn ? 'left-4.5' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
