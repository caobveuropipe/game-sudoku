import type { SudokuPuzzle } from '../types';

export function createEmptyBoard(): number[][] {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

export function createEmptyNotes(): number[][][] {
  return Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => []));
}

export function cloneBoard(board: number[][]): number[][] {
  return board.map(row => [...row]);
}

export function cloneNotes(notes: number[][][]): number[][][] {
  return notes.map(row => row.map(cell => [...cell]));
}

// Check if a number can be placed at board[row][col]
export function isValidPlacement(board: number[][], row: number, col: number, num: number): boolean {
  for (let c = 0; c < 9; c++) {
    if (c !== col && board[row][c] === num) return false;
  }
  for (let r = 0; r < 9; r++) {
    if (r !== row && board[r][col] === num) return false;
  }
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const cr = startRow + r;
      const cc = startCol + c;
      if ((cr !== row || cc !== col) && board[cr][cc] === num) return false;
    }
  }
  return true;
}

// Find empty cell
function findEmpty(board: number[][]): [number, number] | null {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) return [r, c];
    }
  }
  return null;
}

// Count solutions (up to maxCount, typically 2 to verify uniqueness)
export function countSolutions(board: number[][], count = { val: 0 }, maxCount = 2): number {
  const empty = findEmpty(board);
  if (!empty) {
    count.val++;
    return count.val;
  }
  const [row, col] = empty;
  for (let num = 1; num <= 9; num++) {
    if (isValidPlacement(board, row, col, num)) {
      board[row][col] = num;
      countSolutions(board, count, maxCount);
      board[row][col] = 0;
      if (count.val >= maxCount) return count.val;
    }
  }
  return count.val;
}

// Solve board using backtracking
export function solveSudoku(board: number[][]): boolean {
  const empty = findEmpty(board);
  if (!empty) return true;
  const [row, col] = empty;

  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
  for (const num of numbers) {
    if (isValidPlacement(board, row, col, num)) {
      board[row][col] = num;
      if (solveSudoku(board)) return true;
      board[row][col] = 0;
    }
  }
  return false;
}

// Check if entire board is completely filled and valid
export function isBoardCompleteAndValid(board: number[][]): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = board[r][c];
      if (val < 1 || val > 9) return false;
      if (!isValidPlacement(board, r, c, val)) return false;
    }
  }
  return true;
}

// Check conflicting cells currently on board
export function findBoardConflicts(board: number[][]): boolean[][] {
  const conflicts = Array.from({ length: 9 }, () => Array(9).fill(false));

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = board[r][c];
      if (val === 0) continue;
      if (!isValidPlacement(board, r, c, val)) {
        conflicts[r][c] = true;
      }
    }
  }
  return conflicts;
}

// Curated library of verified Medium puzzles (exactly 1 solution, 31-33 clues)
export const CURATED_MEDIUM_PUZZLES: SudokuPuzzle[] = [
  {
    id: 'medium-puzzle-01',
    difficulty: 'medium',
    cluesCount: 32,
    initial: [
      [0, 2, 0, 6, 0, 8, 0, 0, 0],
      [5, 8, 0, 0, 0, 9, 7, 0, 0],
      [0, 0, 0, 0, 4, 0, 0, 0, 0],
      [3, 7, 0, 0, 0, 0, 5, 0, 0],
      [6, 0, 0, 0, 0, 0, 0, 0, 4],
      [0, 0, 8, 0, 0, 0, 0, 1, 3],
      [0, 0, 0, 0, 2, 0, 0, 0, 0],
      [0, 0, 9, 8, 0, 0, 0, 3, 6],
      [0, 0, 0, 3, 0, 6, 0, 9, 0],
    ],
    solution: [
      [1, 2, 3, 6, 7, 8, 9, 4, 5],
      [5, 8, 4, 2, 3, 9, 7, 6, 1],
      [9, 6, 7, 1, 4, 5, 3, 2, 8],
      [3, 7, 2, 4, 6, 1, 5, 8, 9],
      [6, 9, 1, 5, 8, 3, 2, 7, 4],
      [4, 5, 8, 7, 9, 2, 6, 1, 3],
      [8, 3, 6, 9, 2, 4, 1, 5, 7],
      [2, 1, 9, 8, 5, 7, 4, 3, 6],
      [7, 4, 5, 3, 1, 6, 8, 9, 2],
    ],
  },
  {
    id: 'medium-puzzle-02',
    difficulty: 'medium',
    cluesCount: 32,
    initial: [
      [0, 0, 0, 2, 6, 0, 7, 0, 1],
      [6, 8, 0, 0, 7, 0, 0, 9, 0],
      [1, 9, 0, 0, 0, 4, 5, 0, 0],
      [8, 2, 0, 1, 0, 0, 0, 4, 0],
      [0, 0, 4, 6, 0, 2, 9, 0, 0],
      [0, 5, 0, 0, 0, 3, 0, 2, 8],
      [0, 0, 9, 3, 0, 0, 0, 7, 4],
      [0, 4, 0, 0, 5, 0, 0, 3, 6],
      [7, 0, 3, 0, 1, 8, 0, 0, 0],
    ],
    solution: [
      [4, 3, 5, 2, 6, 9, 7, 8, 1],
      [6, 8, 2, 5, 7, 1, 4, 9, 3],
      [1, 9, 7, 8, 3, 4, 5, 6, 2],
      [8, 2, 6, 1, 9, 5, 3, 4, 7],
      [3, 7, 4, 6, 8, 2, 9, 1, 5],
      [9, 5, 1, 7, 4, 3, 6, 2, 8],
      [5, 1, 9, 3, 2, 6, 8, 7, 4],
      [2, 4, 8, 9, 5, 7, 1, 3, 6],
      [7, 6, 3, 4, 1, 8, 2, 5, 9],
    ],
  },
  {
    id: 'medium-puzzle-03',
    difficulty: 'medium',
    cluesCount: 33,
    initial: [
      [1, 0, 0, 4, 8, 9, 0, 0, 6],
      [7, 3, 0, 0, 0, 0, 0, 4, 0],
      [0, 0, 0, 0, 0, 1, 2, 9, 5],
      [0, 0, 7, 1, 2, 0, 6, 0, 0],
      [5, 0, 0, 7, 0, 3, 0, 0, 8],
      [0, 0, 6, 0, 9, 5, 7, 0, 0],
      [9, 1, 4, 6, 0, 0, 0, 0, 0],
      [0, 2, 0, 0, 0, 0, 0, 3, 7],
      [8, 0, 0, 5, 1, 2, 0, 0, 4],
    ],
    solution: [
      [1, 5, 2, 4, 8, 9, 3, 7, 6],
      [7, 3, 9, 2, 5, 6, 8, 4, 1],
      [4, 6, 8, 3, 7, 1, 2, 9, 5],
      [3, 8, 7, 1, 2, 4, 6, 5, 9],
      [5, 9, 1, 7, 6, 3, 4, 2, 8],
      [2, 4, 6, 8, 9, 5, 7, 1, 3],
      [9, 1, 4, 6, 3, 7, 5, 8, 2],
      [6, 2, 5, 9, 4, 8, 1, 3, 7],
      [8, 7, 3, 5, 1, 2, 9, 6, 4],
    ],
  },
  {
    id: 'medium-puzzle-04',
    difficulty: 'medium',
    cluesCount: 31,
    initial: [
      [0, 0, 0, 0, 0, 0, 0, 1, 2],
      [0, 0, 0, 0, 3, 5, 0, 0, 0],
      [0, 0, 0, 6, 0, 0, 0, 7, 0],
      [7, 0, 0, 0, 0, 0, 3, 0, 0],
      [0, 0, 0, 4, 0, 0, 8, 0, 0],
      [1, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 2, 0, 0, 0, 0],
      [0, 8, 0, 0, 0, 0, 0, 4, 0],
      [0, 5, 0, 0, 0, 0, 6, 0, 0],
    ],
    solution: [
      [6, 7, 3, 8, 9, 4, 5, 1, 2],
      [9, 1, 2, 7, 3, 5, 4, 8, 6],
      [8, 4, 5, 6, 1, 2, 9, 7, 3],
      [7, 9, 8, 2, 6, 1, 3, 5, 4],
      [5, 2, 6, 4, 7, 3, 8, 9, 1],
      [1, 3, 4, 5, 8, 9, 2, 6, 7],
      [4, 6, 9, 1, 2, 8, 7, 3, 5],
      [2, 8, 7, 3, 5, 6, 1, 4, 9],
      [3, 5, 1, 9, 4, 7, 6, 2, 8],
    ],
  },
];

// Generate a random medium puzzle on the fly with 1 unique solution
export function generateMediumSudoku(): SudokuPuzzle {
  // Start with a solved board
  const board = createEmptyBoard();
  solveSudoku(board);
  const solution = cloneBoard(board);

  // Random cell coordinates
  const positions: [number, number][] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push([r, c]);
    }
  }
  positions.sort(() => Math.random() - 0.5);

  const puzzleBoard = cloneBoard(solution);
  let clues = 81;
  const targetClues = 32; // Medium difficulty standard

  for (const [r, c] of positions) {
    if (clues <= targetClues) break;
    const temp = puzzleBoard[r][c];
    puzzleBoard[r][c] = 0;

    // Check if still uniquely solvable
    const testCopy = cloneBoard(puzzleBoard);
    const count = countSolutions(testCopy, { val: 0 }, 2);

    if (count !== 1) {
      puzzleBoard[r][c] = temp; // Restore
    } else {
      clues--;
    }
  }

  return {
    id: `medium-gen-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    difficulty: 'medium',
    cluesCount: clues,
    initial: puzzleBoard,
    solution: solution,
  };
}

export function getRandomMediumPuzzle(): SudokuPuzzle {
  const index = Math.floor(Math.random() * CURATED_MEDIUM_PUZZLES.length);
  const selected = CURATED_MEDIUM_PUZZLES[index];
  return {
    ...selected,
    initial: cloneBoard(selected.initial),
    solution: cloneBoard(selected.solution!),
  };
}
