import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  Pencil,
  Eraser,
  Undo2,
  Sparkles,
  Trophy,
  AlertCircle,
  Shuffle,
  HelpCircle,
  Eye,
  Wand2,
} from 'lucide-react';
import { MessageSequence, SudokuNotes, SudokuPuzzle } from '../../types';
import {
  cloneBoard,
  cloneNotes,
  createEmptyNotes,
  findBoardConflicts,
  getRandomMediumPuzzle,
  solveSudoku,
  isBoardCompleteAndValid,
} from '../../utils/sudoku';
import {
  fetchRandomPuzzle,
  generateNewPuzzle,
  verifySudokuAndUnlock,
  getLocalPublishedMessages,
} from '../../services/api';
import { audioManager } from '../../utils/audio';

const LOCAL_STORAGE_GAME_KEY = 'sudoku_saved_session_v1';

interface SavedGameState {
  puzzle: SudokuPuzzle;
  currentBoard: number[][];
  notes: SudokuNotes;
  timeSeconds: number;
  movesCount?: number;
  hasWon?: boolean;
}

interface SudokuGameProps {
  onUnlockMessages: (messages: MessageSequence) => void;
  onOpenAdmin: () => void;
}

export const SudokuGame: React.FC<SudokuGameProps> = ({
  onUnlockMessages,
  onOpenAdmin,
}) => {
  const [puzzle, setPuzzle] = useState<SudokuPuzzle | null>(null);
  const [currentBoard, setCurrentBoard] = useState<number[][]>([]);
  const [notes, setNotes] = useState<SudokuNotes>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [history, setHistory] = useState<Array<{ board: number[][]; notes: SudokuNotes }>>([]);
  const [isNoteMode, setIsNoteMode] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [movesCount, setMovesCount] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [errorCells, setErrorCells] = useState<boolean[][]>([]);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState<boolean>(false);
  const [hasWonCurrentPuzzle, setHasWonCurrentPuzzle] = useState<boolean>(false);
  const [unlockedMessages, setUnlockedMessages] = useState<MessageSequence | null>(null);
  const [isRestartModalOpen, setIsRestartModalOpen] = useState<boolean>(false);
  const [isLoadingPuzzle, setIsLoadingPuzzle] = useState<boolean>(false);

  const boardRef = useRef<HTMLDivElement>(null);

  // Show temporary toast notification
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(prev => (prev?.text === text ? null : prev));
    }, 3800);
  };

  // Initialize or restore game
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_GAME_KEY);
    if (saved) {
      try {
        const parsed: SavedGameState = JSON.parse(saved);
        if (parsed.puzzle && parsed.currentBoard) {
          setPuzzle(parsed.puzzle);
          setCurrentBoard(parsed.currentBoard);
          setNotes(parsed.notes || createEmptyNotes());
          setTimerSeconds(parsed.timeSeconds || 0);
          setMovesCount(parsed.movesCount || 0);

          // If game was already completed, mark as won with modal closed!
          const alreadyWon = Boolean(parsed.hasWon || isBoardCompleteAndValid(parsed.currentBoard));
          if (alreadyWon) {
            setHasWonCurrentPuzzle(true);
            setIsTimerRunning(false);
            setIsVictoryModalOpen(false);
            setUnlockedMessages(getLocalPublishedMessages());
          }
          return;
        }
      } catch (e) {
        console.error('Error loading saved game:', e);
      }
    }

    // Otherwise load fresh puzzle from server or curated set
    loadNewPuzzle();
  }, []);

  // Timer effect
  useEffect(() => {
    if (!isTimerRunning || isVictoryModalOpen) return;
    const interval = setInterval(() => {
      setTimerSeconds(sec => sec + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, isVictoryModalOpen]);

  // Autosave to localStorage
  useEffect(() => {
    if (!puzzle || currentBoard.length === 0) return;
    const saveState: SavedGameState = {
      puzzle,
      currentBoard,
      notes,
      timeSeconds: timerSeconds,
      movesCount,
      hasWon: hasWonCurrentPuzzle,
    };
    localStorage.setItem(LOCAL_STORAGE_GAME_KEY, JSON.stringify(saveState));
  }, [puzzle, currentBoard, notes, timerSeconds, movesCount, hasWonCurrentPuzzle]);

  // Load new puzzle
  const loadNewPuzzle = async () => {
    setIsLoadingPuzzle(true);
    setSelectedCell(null);
    setHistory([]);
    setErrorCells([]);
    try {
      let p: SudokuPuzzle;
      try {
        p = await fetchRandomPuzzle();
      } catch {
        p = getRandomMediumPuzzle();
      }
      setPuzzle(p);
      setCurrentBoard(cloneBoard(p.initial));
      setNotes(createEmptyNotes());
      setTimerSeconds(0);
      setMovesCount(0);
      setIsTimerRunning(true);
      setIsVictoryModalOpen(false);
      setHasWonCurrentPuzzle(false);
      setUnlockedMessages(null);
    } catch (err: any) {
      showToast('Không thể tải bàn cờ mới: ' + err.message, 'error');
    } finally {
      setIsLoadingPuzzle(false);
    }
  };

  // Reset current puzzle
  const resetCurrentPuzzle = () => {
    if (!puzzle) return;
    setSelectedCell(null);
    setHistory([]);
    setErrorCells([]);
    setCurrentBoard(cloneBoard(puzzle.initial));
    setNotes(createEmptyNotes());
    setTimerSeconds(0);
    setMovesCount(0);
    setIsTimerRunning(true);
    setIsVictoryModalOpen(false);
    setHasWonCurrentPuzzle(false);
    setIsRestartModalOpen(false);
    showToast('Đã đặt lại ván cờ về trạng thái ban đầu', 'info');
  };

  // Push board change to history
  const pushHistory = useCallback(() => {
    setHistory(prev => [
      ...prev.slice(-30),
      {
        board: cloneBoard(currentBoard),
        notes: cloneNotes(notes),
      },
    ]);
  }, [currentBoard, notes]);

  // Undo last action
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setCurrentBoard(previous.board);
    setNotes(previous.notes);
    setErrorCells([]);
    setHasWonCurrentPuzzle(false);
    setMovesCount(m => m + 1);
    audioManager.playClick(0.85);
  }, [history]);

  // Fill number or candidate
  const handleInputNumber = useCallback(
    (num: number) => {
      if (!puzzle || !selectedCell) return;
      const [r, c] = selectedCell;

      // Cannot modify initial clue cells
      if (puzzle.initial[r][c] !== 0) return;

      pushHistory();
      setErrorCells([]);
      setHasWonCurrentPuzzle(false);
      setMovesCount(m => m + 1);
      audioManager.playClick(0.95 + num * 0.05);

      if (isNoteMode) {
        // Toggle note
        setNotes(prevNotes => {
          const newNotes = cloneNotes(prevNotes);
          const cellNotes = newNotes[r][c];
          const exists = cellNotes.includes(num);
          if (exists) {
            newNotes[r][c] = cellNotes.filter(n => n !== num);
          } else {
            newNotes[r][c] = [...cellNotes, num].sort((a, b) => a - b);
          }
          return newNotes;
        });
      } else {
        // Place number
        setCurrentBoard(prevBoard => {
          const newBoard = cloneBoard(prevBoard);
          // If already this number, clear it
          if (newBoard[r][c] === num) {
            newBoard[r][c] = 0;
          } else {
            newBoard[r][c] = num;
          }
          return newBoard;
        });

        // Clear notes in this cell and remove this number from row, col, box notes
        setNotes(prevNotes => {
          const newNotes = cloneNotes(prevNotes);
          newNotes[r][c] = [];
          for (let i = 0; i < 9; i++) {
            newNotes[r][i] = newNotes[r][i].filter(n => n !== num);
            newNotes[i][c] = newNotes[i][c].filter(n => n !== num);
          }
          const startR = Math.floor(r / 3) * 3;
          const startC = Math.floor(c / 3) * 3;
          for (let ro = 0; ro < 3; ro++) {
            for (let co = 0; co < 3; co++) {
              newNotes[startR + ro][startC + co] = newNotes[startR + ro][startC + co].filter(n => n !== num);
            }
          }
          return newNotes;
        });
      }
    },
    [puzzle, selectedCell, isNoteMode, pushHistory]
  );

  // Erase cell content
  const handleErase = useCallback(() => {
    if (!puzzle || !selectedCell) return;
    const [r, c] = selectedCell;
    if (puzzle.initial[r][c] !== 0) return;

    if (currentBoard[r][c] !== 0 || notes[r][c].length > 0) {
      pushHistory();
      setHasWonCurrentPuzzle(false);
      setCurrentBoard(prev => {
        const next = cloneBoard(prev);
        next[r][c] = 0;
        return next;
      });
      setNotes(prev => {
        const next = cloneNotes(prev);
        next[r][c] = [];
        return next;
      });
      setErrorCells([]);
      setMovesCount(m => m + 1);
      audioManager.playClick(0.7);
    }
  }, [puzzle, selectedCell, currentBoard, notes, pushHistory]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        handleInputNumber(parseInt(e.key, 10));
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        e.preventDefault();
        handleErase();
      } else if (e.key === 'n' || e.key === 'N') {
        setIsNoteMode(prev => !prev);
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleUndo();
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        setSelectedCell(prev => {
          if (!prev) return [0, 0];
          let [r, c] = prev;
          if (e.key === 'ArrowUp') r = (r + 8) % 9;
          if (e.key === 'ArrowDown') r = (r + 1) % 9;
          if (e.key === 'ArrowLeft') c = (c + 8) % 9;
          if (e.key === 'ArrowRight') c = (c + 1) % 9;
          return [r, c];
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInputNumber, handleErase, handleUndo]);

  // Immediately celebrate and show victory modal without waiting
  const triggerVictory = async (boardToVerify: number[][]) => {
    if (!puzzle) return;
    setHasWonCurrentPuzzle(true);
    setIsTimerRunning(false);
    setErrorCells([]);
    audioManager.playVictoryFanfare();

    // Immediately load unlocked messages and open victory modal
    const immediateMessages = getLocalPublishedMessages();
    setUnlockedMessages(immediateMessages);
    setIsVictoryModalOpen(true);

    // Confetti celebration
    try {
      confetti({
        particleCount: 130,
        spread: 85,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 250);
    } catch {
      // ignore confetti errors
    }

    // Background verify and token sync
    try {
      const result = await verifySudokuAndUnlock(puzzle.id, boardToVerify);
      if (result.success && result.messages) {
        setUnlockedMessages(result.messages);
      }
    } catch (err) {
      console.warn('Background sync error, local unlocked messages used:', err);
    }
  };

  // Automatically trigger victory whenever the board reaches winning state
  useEffect(() => {
    if (!puzzle || currentBoard.length === 0) return;

    let hasEmpty = false;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (currentBoard[r][c] === 0) {
          hasEmpty = true;
          break;
        }
      }
      if (hasEmpty) break;
    }

    // If board has empty cells, user is editing/unsolved -> reset won flag
    if (hasEmpty) {
      if (hasWonCurrentPuzzle) {
        setHasWonCurrentPuzzle(false);
      }
      return;
    }

    // If board is fully filled, check validity
    if (isBoardCompleteAndValid(currentBoard)) {
      if (!hasWonCurrentPuzzle) {
        triggerVictory(currentBoard);
      }
    } else {
      if (hasWonCurrentPuzzle) {
        setHasWonCurrentPuzzle(false);
      }
    }
  }, [currentBoard, puzzle, hasWonCurrentPuzzle]);

  // Verify board completion (manual fallback)
  const handleVerify = async () => {
    if (!puzzle) return;
    setIsVerifying(true);

    // Check if board is complete
    let isComplete = true;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (currentBoard[r][c] === 0) {
          isComplete = false;
          break;
        }
      }
      if (!isComplete) break;
    }

    if (!isComplete) {
      const conflicts = findBoardConflicts(currentBoard);
      setErrorCells(conflicts);
      showToast('Bàn cờ chưa điền hết các ô trống. Hãy tiếp tục giải nhé!', 'info');
      setIsVerifying(false);
      return;
    }

    if (isBoardCompleteAndValid(currentBoard)) {
      await triggerVictory(currentBoard);
      setIsVerifying(false);
      return;
    }

    const conflicts = findBoardConflicts(currentBoard);
    setErrorCells(conflicts);
    showToast('Có một số ô chưa chính xác theo quy tắc Sudoku, hãy kiểm tra lại nhé!', 'error');
    setIsVerifying(false);
  };

  // Quick fill solution for testing: triggers instant victory modal!
  const handleDevQuickSolve = () => {
    if (!puzzle) return;
    const boardCopy = cloneBoard(puzzle.initial);
    if (solveSudoku(boardCopy)) {
      setCurrentBoard(boardCopy);
      setNotes(createEmptyNotes());
      setErrorCells(Array.from({ length: 9 }, () => Array(9).fill(false)));
      audioManager.playClick(1.2);
      triggerVictory(boardCopy);
    } else {
      showToast('Không thể giải bàn cờ này', 'error');
    }
  };

  // Format timer MM:SS
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helpers for highlighting with soft pink tones
  const getCellHighlightClass = (r: number, c: number) => {
    if (!selectedCell) return '';
    const [selR, selC] = selectedCell;
    const isSelected = selR === r && selC === c;
    if (isSelected) {
      return 'bg-rose-200/90 ring-2 ring-rose-500 ring-inset z-10 font-bold';
    }

    const isSameBox = Math.floor(selR / 3) === Math.floor(r / 3) && Math.floor(selC / 3) === Math.floor(c / 3);
    const isSameRowOrCol = selR === r || selC === c;
    const selVal = currentBoard[selR]?.[selC];
    const cellVal = currentBoard[r]?.[c];
    const isSameNumber = selVal && cellVal && selVal === cellVal;

    if (isSameNumber) {
      return 'bg-pink-100 text-rose-950 font-bold';
    }
    if (isSameRowOrCol || isSameBox) {
      return 'bg-rose-50/60';
    }
    return '';
  };

  // Count remaining counts for numbers 1-9
  const numberCounts = React.useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = currentBoard[r]?.[c];
        if (val >= 1 && val <= 9) {
          counts[val] = (counts[val] || 0) + 1;
        }
      }
    }
    return counts;
  }, [currentBoard]);

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-16 sm:top-18 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl shadow-xl border text-xs sm:text-sm font-medium transition-all duration-300 flex items-center gap-2 max-w-[90vw] backdrop-blur-md ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50/95 border-emerald-300 text-emerald-900 shadow-emerald-950/10'
              : toastMessage.type === 'error'
              ? 'bg-rose-50/95 border-rose-300 text-rose-900 shadow-rose-950/10'
              : 'bg-white/95 border-rose-200 text-rose-950 shadow-rose-950/10'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          ) : (
            <Sparkles className="w-4 h-4 shrink-0 text-rose-500" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Minimalist Top Bar */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 font-serif-display tracking-tight">
          Sudoku
        </h1>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Timer */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-rose-200 shadow-2xs font-mono text-xs sm:text-sm font-semibold text-rose-900" title="Thời gian">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>{formatTimer(timerSeconds)}</span>
          </div>

          {/* User Moves Counter */}
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/90 border border-rose-200 shadow-2xs text-xs sm:text-sm font-semibold text-rose-900" title="Số thao tác">
            <span className="text-rose-500 font-bold">#</span>
            <span>{movesCount} thao tác</span>
          </div>

          {/* Quick Restart Action */}
          <button
            type="button"
            onClick={() => setIsRestartModalOpen(true)}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/90 hover:bg-white border border-rose-200/80 text-xs font-medium text-slate-700 shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
            title="Tùy chọn chơi lại"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Chơi lại</span>
          </button>
        </div>
      </div>

      {/* Main Game Card */}
      <div className="bg-white/85 backdrop-blur-md rounded-2xl shadow-sm border border-rose-200/80 p-3 sm:p-6 mb-6 shadow-rose-900/5">
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
          {/* Sudoku 9x9 Board */}
          <div className="w-full max-w-[420px] sm:max-w-[460px] aspect-square flex flex-col justify-center">
            <div
              ref={boardRef}
              className="grid grid-cols-9 grid-rows-9 w-full h-full border-2 border-slate-800 bg-white rounded-lg overflow-hidden shadow-xs select-none touch-manipulation"
            >
              {currentBoard.map((row, r) =>
                row.map((val, c) => {
                  const isInitial = puzzle?.initial[r]?.[c] !== 0;
                  const isError = errorCells[r]?.[c];
                  const highlightClass = getCellHighlightClass(r, c);
                  const cellNotes = notes[r]?.[c] || [];

                  // Border styles for 3x3 blocks
                  const borderRight = (c + 1) % 3 === 0 && c !== 8 ? 'border-r-2 border-r-slate-800' : 'border-r border-slate-200';
                  const borderBottom = (r + 1) % 3 === 0 && r !== 8 ? 'border-b-2 border-b-slate-800' : 'border-b border-slate-200';

                  return (
                    <div
                      key={`cell-${r}-${c}`}
                      onClick={() => {
                        setSelectedCell([r, c]);
                        audioManager.playClick(0.9);
                      }}
                      className={`relative flex items-center justify-center cursor-pointer transition-colors duration-100 ${borderRight} ${borderBottom} ${
                        isError
                          ? 'bg-rose-100 text-rose-700 font-bold'
                          : highlightClass || (isInitial ? 'bg-rose-50/40' : 'bg-white')
                      }`}
                    >
                      {val !== 0 ? (
                        <span
                          className={`text-lg sm:text-2xl select-none ${
                            isInitial
                              ? 'font-bold text-slate-900'
                              : 'font-semibold text-rose-600'
                          }`}
                        >
                          {val}
                        </span>
                      ) : cellNotes.length > 0 ? (
                        <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-0.5 pointer-events-none">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                            <div
                              key={`note-${r}-${c}-${n}`}
                              className="flex items-center justify-center text-[9px] sm:text-[11px] leading-none font-semibold text-rose-400"
                            >
                              {cellNotes.includes(n) ? n : ''}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Controls & Numpad */}
          <div className="w-full max-w-[420px] lg:max-w-[280px] flex flex-col justify-between">
            {/* Action Tools */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                type="button"
                onClick={handleUndo}
                disabled={history.length === 0}
                className="flex flex-col items-center justify-center py-2 px-2 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 disabled:opacity-40 disabled:hover:bg-white text-xs font-medium text-slate-700 transition-colors shadow-2xs cursor-pointer"
              >
                <Undo2 className="w-4 h-4 mb-0.5 text-slate-600" />
                <span>Hoàn tác</span>
              </button>

              <button
                type="button"
                onClick={handleErase}
                disabled={!selectedCell || puzzle?.initial[selectedCell[0]][selectedCell[1]] !== 0}
                className="flex flex-col items-center justify-center py-2 px-2 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 disabled:opacity-40 disabled:hover:bg-white text-xs font-medium text-slate-700 transition-colors shadow-2xs cursor-pointer"
              >
                <Eraser className="w-4 h-4 mb-0.5 text-slate-600" />
                <span>Xóa ô</span>
              </button>

              <button
                type="button"
                onClick={() => setIsNoteMode(prev => !prev)}
                className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl border text-xs font-medium transition-colors shadow-2xs cursor-pointer ${
                  isNoteMode
                    ? 'bg-rose-500 border-rose-600 text-white font-semibold'
                    : 'bg-white border-rose-200 hover:bg-rose-50 text-slate-700'
                }`}
              >
                <Pencil className="w-4 h-4 mb-0.5" />
                <span>{isNoteMode ? 'Ghi chú (Bật)' : 'Ghi chú (Tắt)'}</span>
              </button>
            </div>

            {/* Numeric Keypad (Clean 1 - 9 without cluttered sublabels) */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
                const isFull = numberCounts[num] >= 9;
                return (
                  <button
                    key={`numpad-${num}`}
                    type="button"
                    onClick={() => handleInputNumber(num)}
                    disabled={isFull}
                    className={`flex items-center justify-center h-12 sm:h-14 rounded-xl text-xl sm:text-2xl font-bold border transition-all active:scale-95 shadow-2xs cursor-pointer ${
                      isFull
                        ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'
                        : 'bg-white hover:bg-rose-50 hover:border-rose-300 border-rose-200/90 text-slate-800'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>

            {/* Action Buttons: Switch smoothly between Gameplay mode and Won mode */}
            {hasWonCurrentPuzzle ? (
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (unlockedMessages) {
                      onUnlockMessages(unlockedMessages);
                    } else {
                      setIsVictoryModalOpen(true);
                    }
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 active:scale-98 text-white font-bold shadow-md shadow-rose-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Eye className="w-5 h-5" />
                  <span>Xem Lời Nhắn Bí Mật ✨</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsVictoryModalOpen(true)}
                  className="w-full py-2.5 px-4 rounded-xl border border-rose-200 bg-rose-50/80 hover:bg-rose-100 text-rose-800 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Trophy className="w-4 h-4 text-rose-500" />
                  <span>Mở lại bảng mừng chiến thắng 🏆</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsRestartModalOpen(true)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Chơi lại hoặc đổi ván mới</span>
                </button>
              </div>
            ) : (
              <>
                {/* Check / Verify Button */}
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={isVerifying}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 active:scale-98 text-white font-semibold shadow-md shadow-rose-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isVerifying ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Đang kiểm tra...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Kiểm Tra Lời Giải</span>
                    </>
                  )}
                </button>

                {/* Quick Solve Helper for Dev Testing */}
                <button
                  type="button"
                  onClick={handleDevQuickSolve}
                  className="w-full mt-2 py-2 px-3 rounded-xl border border-dashed border-rose-300 hover:border-rose-400 bg-rose-50/60 hover:bg-rose-100/70 text-rose-700 hover:text-rose-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
                  title="Dành cho kiểm thử cục bộ: Tự động điền đầy đủ đáp án chính xác để kiểm tra luồng chiến thắng & mở thư"
                >
                  <Wand2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>⚡ Điền nhanh đáp án (Test Mode)</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Restart Options Modal */}
      {isRestartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-rose-100">
            <h3 className="text-lg font-bold text-slate-900 mb-2 font-serif-display">Tùy Chọn Chơi Lại</h3>
            <p className="text-sm text-slate-600 mb-6">
              Bạn muốn xóa sạch nước đi để chơi lại ván này, hay đổi sang một ván Sudoku mức trung bình hoàn toàn mới?
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={resetCurrentPuzzle}
                className="w-full py-2.5 px-4 rounded-xl border border-rose-200 hover:bg-rose-50/50 font-medium text-slate-800 text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-rose-500" />
                <span>Chơi lại ván hiện tại</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRestartModalOpen(false);
                  loadNewPuzzle();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
              >
                <Shuffle className="w-4 h-4" />
                <span>Tạo ván Sudoku mới</span>
              </button>
              <button
                type="button"
                onClick={() => setIsRestartModalOpen(false)}
                className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Victory Celebration Modal */}
      {isVictoryModalOpen && unlockedMessages && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-rose-200 text-center relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-rose-100 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-pink-100 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 mb-4 shadow-inner">
                <Trophy className="w-8 h-8 animate-bounce text-rose-500" />
              </div>

              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 mb-2">
                Hoàn Thành Xuất Sắc!
              </span>

              <h2 className="text-2xl font-bold text-slate-900 mb-2 font-serif-display">
                Xin Chúc Mừng Bạn!
              </h2>

              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                Bạn đã hoàn thành bàn cờ Sudoku trong thời gian{' '}
                <strong className="text-rose-800">{formatTimer(timerSeconds)}</strong> với{' '}
                <strong className="text-rose-800">{movesCount} thao tác</strong>.
                Bức thư bí mật đa lớp hiện đã chính thức được mở khóa!
              </p>

              <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 mb-6 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-rose-600" />
                  <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                    Chuỗi Lời Nhắn Đã Mở Khóa
                  </span>
                </div>
                <p className="text-xs text-rose-800">
                  Gồm {unlockedMessages.layers.length} màn thông điệp đặc biệt được chuẩn bị riêng với các câu hỏi và nhánh cảm xúc.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => onUnlockMessages(unlockedMessages)}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-base shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <Eye className="w-5 h-5" />
                  <span>Xem Lời Nhắn Bí Mật ✨</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsVictoryModalOpen(false)}
                  className="w-full py-2.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Để sau, xem lại bàn cờ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
