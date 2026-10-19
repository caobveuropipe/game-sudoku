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

// Curated library of verified Medium puzzles (exactly 1 solution, 34 balanced clues, center box always populated)
export const CURATED_MEDIUM_PUZZLES: SudokuPuzzle[] = [
  {
    "id": "medium-puzzle-01",
    "difficulty": "medium",
    "cluesCount": 34,
    "initial": [
      [
        8,
        4,
        1,
        0,
        0,
        0,
        9,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        9,
        0,
        0,
        8,
        1
      ],
      [
        0,
        3,
        0,
        1,
        8,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        8,
        0,
        2,
        7,
        0,
        9,
        5
      ],
      [
        5,
        1,
        0,
        0,
        0,
        3,
        0,
        0,
        0
      ],
      [
        0,
        2,
        0,
        5,
        0,
        0,
        0,
        0,
        4
      ],
      [
        0,
        0,
        0,
        7,
        0,
        2,
        6,
        4,
        9
      ],
      [
        4,
        5,
        0,
        0,
        0,
        9,
        7,
        0,
        8
      ],
      [
        0,
        9,
        7,
        0,
        0,
        0,
        0,
        3,
        0
      ]
    ],
    "solution": [
      [
        8,
        4,
        1,
        2,
        7,
        6,
        9,
        5,
        3
      ],
      [
        2,
        7,
        6,
        3,
        9,
        5,
        4,
        8,
        1
      ],
      [
        9,
        3,
        5,
        1,
        8,
        4,
        2,
        7,
        6
      ],
      [
        3,
        6,
        8,
        4,
        2,
        7,
        1,
        9,
        5
      ],
      [
        5,
        1,
        4,
        9,
        6,
        3,
        8,
        2,
        7
      ],
      [
        7,
        2,
        9,
        5,
        1,
        8,
        3,
        6,
        4
      ],
      [
        1,
        8,
        3,
        7,
        5,
        2,
        6,
        4,
        9
      ],
      [
        4,
        5,
        2,
        6,
        3,
        9,
        7,
        1,
        8
      ],
      [
        6,
        9,
        7,
        8,
        4,
        1,
        5,
        3,
        2
      ]
    ]
  },
  {
    "id": "medium-puzzle-02",
    "difficulty": "medium",
    "cluesCount": 34,
    "initial": [
      [
        0,
        0,
        0,
        7,
        0,
        0,
        2,
        8,
        6
      ],
      [
        0,
        3,
        9,
        0,
        4,
        0,
        0,
        0,
        0
      ],
      [
        8,
        2,
        7,
        0,
        0,
        1,
        0,
        0,
        0
      ],
      [
        3,
        5,
        0,
        0,
        8,
        7,
        6,
        0,
        0
      ],
      [
        0,
        0,
        8,
        0,
        3,
        2,
        4,
        0,
        0
      ],
      [
        0,
        0,
        4,
        0,
        6,
        0,
        0,
        0,
        8
      ],
      [
        5,
        8,
        0,
        0,
        0,
        4,
        0,
        6,
        7
      ],
      [
        0,
        0,
        3,
        8,
        0,
        0,
        0,
        5,
        0
      ],
      [
        0,
        4,
        0,
        9,
        7,
        0,
        0,
        0,
        0
      ]
    ],
    "solution": [
      [
        4,
        1,
        5,
        7,
        9,
        3,
        2,
        8,
        6
      ],
      [
        6,
        3,
        9,
        2,
        4,
        8,
        7,
        1,
        5
      ],
      [
        8,
        2,
        7,
        6,
        5,
        1,
        3,
        4,
        9
      ],
      [
        3,
        5,
        1,
        4,
        8,
        7,
        6,
        9,
        2
      ],
      [
        9,
        6,
        8,
        5,
        3,
        2,
        4,
        7,
        1
      ],
      [
        2,
        7,
        4,
        1,
        6,
        9,
        5,
        3,
        8
      ],
      [
        5,
        8,
        2,
        3,
        1,
        4,
        9,
        6,
        7
      ],
      [
        7,
        9,
        3,
        8,
        2,
        6,
        1,
        5,
        4
      ],
      [
        1,
        4,
        6,
        9,
        7,
        5,
        8,
        2,
        3
      ]
    ]
  },
  {
    "id": "medium-puzzle-03",
    "difficulty": "medium",
    "cluesCount": 34,
    "initial": [
      [
        7,
        0,
        2,
        0,
        0,
        8,
        9,
        0,
        0
      ],
      [
        0,
        0,
        8,
        0,
        0,
        9,
        0,
        0,
        2
      ],
      [
        0,
        0,
        9,
        0,
        1,
        0,
        0,
        0,
        4
      ],
      [
        1,
        0,
        3,
        0,
        5,
        2,
        0,
        6,
        0
      ],
      [
        0,
        2,
        0,
        9,
        0,
        1,
        3,
        0,
        0
      ],
      [
        0,
        5,
        0,
        0,
        0,
        0,
        0,
        1,
        8
      ],
      [
        0,
        0,
        0,
        0,
        2,
        4,
        0,
        9,
        5
      ],
      [
        0,
        7,
        0,
        8,
        0,
        0,
        6,
        0,
        3
      ],
      [
        4,
        0,
        5,
        6,
        0,
        3,
        0,
        0,
        0
      ]
    ],
    "solution": [
      [
        7,
        1,
        2,
        5,
        4,
        8,
        9,
        3,
        6
      ],
      [
        5,
        4,
        8,
        3,
        6,
        9,
        1,
        7,
        2
      ],
      [
        3,
        6,
        9,
        2,
        1,
        7,
        5,
        8,
        4
      ],
      [
        1,
        8,
        3,
        7,
        5,
        2,
        4,
        6,
        9
      ],
      [
        6,
        2,
        4,
        9,
        8,
        1,
        3,
        5,
        7
      ],
      [
        9,
        5,
        7,
        4,
        3,
        6,
        2,
        1,
        8
      ],
      [
        8,
        3,
        6,
        1,
        2,
        4,
        7,
        9,
        5
      ],
      [
        2,
        7,
        1,
        8,
        9,
        5,
        6,
        4,
        3
      ],
      [
        4,
        9,
        5,
        6,
        7,
        3,
        8,
        2,
        1
      ]
    ]
  },
  {
    "id": "medium-puzzle-04",
    "difficulty": "medium",
    "cluesCount": 34,
    "initial": [
      [
        0,
        9,
        6,
        3,
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        0,
        4,
        7,
        0,
        6
      ],
      [
        0,
        5,
        0,
        0,
        0,
        6,
        3,
        0,
        0
      ],
      [
        4,
        3,
        7,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        0,
        8,
        9,
        4,
        0
      ],
      [
        5,
        0,
        0,
        4,
        3,
        2,
        0,
        0,
        7
      ],
      [
        0,
        4,
        2,
        7,
        8,
        0,
        0,
        9,
        0
      ],
      [
        9,
        0,
        8,
        0,
        2,
        0,
        0,
        0,
        4
      ],
      [
        0,
        7,
        0,
        0,
        0,
        1,
        2,
        3,
        8
      ]
    ],
    "solution": [
      [
        8,
        9,
        6,
        3,
        5,
        7,
        4,
        1,
        2
      ],
      [
        1,
        2,
        3,
        8,
        9,
        4,
        7,
        5,
        6
      ],
      [
        7,
        5,
        4,
        2,
        1,
        6,
        3,
        8,
        9
      ],
      [
        4,
        3,
        7,
        1,
        6,
        9,
        8,
        2,
        5
      ],
      [
        2,
        6,
        1,
        5,
        7,
        8,
        9,
        4,
        3
      ],
      [
        5,
        8,
        9,
        4,
        3,
        2,
        1,
        6,
        7
      ],
      [
        3,
        4,
        2,
        7,
        8,
        5,
        6,
        9,
        1
      ],
      [
        9,
        1,
        8,
        6,
        2,
        3,
        5,
        7,
        4
      ],
      [
        6,
        7,
        5,
        9,
        4,
        1,
        2,
        3,
        8
      ]
    ]
  },
  {
    "id": "medium-puzzle-05",
    "difficulty": "medium",
    "cluesCount": 34,
    "initial": [
      [
        0,
        0,
        0,
        5,
        7,
        0,
        0,
        4,
        0
      ],
      [
        0,
        0,
        6,
        0,
        0,
        0,
        8,
        0,
        7
      ],
      [
        7,
        0,
        9,
        0,
        8,
        0,
        2,
        0,
        0
      ],
      [
        8,
        0,
        0,
        1,
        2,
        0,
        0,
        5,
        4
      ],
      [
        0,
        0,
        4,
        8,
        0,
        3,
        0,
        0,
        0
      ],
      [
        0,
        9,
        2,
        0,
        0,
        5,
        0,
        0,
        6
      ],
      [
        0,
        2,
        0,
        0,
        1,
        7,
        4,
        0,
        0
      ],
      [
        0,
        8,
        0,
        2,
        0,
        0,
        0,
        6,
        0
      ],
      [
        4,
        0,
        1,
        9,
        6,
        0,
        0,
        2,
        0
      ]
    ],
    "solution": [
      [
        3,
        1,
        8,
        5,
        7,
        2,
        6,
        4,
        9
      ],
      [
        2,
        5,
        6,
        4,
        3,
        9,
        8,
        1,
        7
      ],
      [
        7,
        4,
        9,
        6,
        8,
        1,
        2,
        3,
        5
      ],
      [
        8,
        3,
        7,
        1,
        2,
        6,
        9,
        5,
        4
      ],
      [
        5,
        6,
        4,
        8,
        9,
        3,
        1,
        7,
        2
      ],
      [
        1,
        9,
        2,
        7,
        4,
        5,
        3,
        8,
        6
      ],
      [
        6,
        2,
        5,
        3,
        1,
        7,
        4,
        9,
        8
      ],
      [
        9,
        8,
        3,
        2,
        5,
        4,
        7,
        6,
        1
      ],
      [
        4,
        7,
        1,
        9,
        6,
        8,
        5,
        2,
        3
      ]
    ]
  },
  {
    "id": "medium-puzzle-06",
    "difficulty": "medium",
    "cluesCount": 34,
    "initial": [
      [
        0,
        0,
        0,
        9,
        4,
        6,
        0,
        5,
        0
      ],
      [
        7,
        2,
        0,
        8,
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        6,
        0,
        1,
        0,
        0,
        0,
        4,
        8
      ],
      [
        1,
        0,
        0,
        0,
        8,
        0,
        0,
        0,
        6
      ],
      [
        6,
        0,
        7,
        0,
        0,
        1,
        8,
        0,
        0
      ],
      [
        0,
        9,
        5,
        0,
        6,
        3,
        1,
        0,
        0
      ],
      [
        2,
        0,
        0,
        0,
        1,
        0,
        0,
        8,
        0
      ],
      [
        9,
        0,
        0,
        3,
        0,
        0,
        0,
        0,
        7
      ],
      [
        0,
        0,
        6,
        0,
        9,
        7,
        2,
        3,
        0
      ]
    ],
    "solution": [
      [
        3,
        1,
        8,
        9,
        4,
        6,
        7,
        5,
        2
      ],
      [
        7,
        2,
        4,
        8,
        3,
        5,
        6,
        1,
        9
      ],
      [
        5,
        6,
        9,
        1,
        7,
        2,
        3,
        4,
        8
      ],
      [
        1,
        3,
        2,
        4,
        8,
        9,
        5,
        7,
        6
      ],
      [
        6,
        4,
        7,
        2,
        5,
        1,
        8,
        9,
        3
      ],
      [
        8,
        9,
        5,
        7,
        6,
        3,
        1,
        2,
        4
      ],
      [
        2,
        7,
        3,
        6,
        1,
        4,
        9,
        8,
        5
      ],
      [
        9,
        5,
        1,
        3,
        2,
        8,
        4,
        6,
        7
      ],
      [
        4,
        8,
        6,
        5,
        9,
        7,
        2,
        3,
        1
      ]
    ]
  }
];

// Generate a random medium puzzle on the fly with strict balance & 1 unique solution
export function generateMediumSudoku(): SudokuPuzzle {
  const targetClues = 34; // Medium difficulty standard (34 clues)

  for (let attempt = 0; attempt < 200; attempt++) {
    const board = createEmptyBoard();
    solveSudoku(board);
    const solution = cloneBoard(board);
    const puzzleBoard = cloneBoard(solution);

    const rowClues = Array(9).fill(9);
    const colClues = Array(9).fill(9);
    const boxClues = Array(9).fill(9);
    let clues = 81;

    // Random cell coordinates
    const positions: [number, number][] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        positions.push([r, c]);
      }
    }
    positions.sort(() => Math.random() - 0.5);

    for (const [r, c] of positions) {
      if (clues <= targetClues) break;
      const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);

      // Strict balance constraints for Medium level:
      // 1. Center box (b === 4) MUST keep at least 4 clues (never empty!)
      // 2. All other boxes MUST keep at least 3 clues
      // 3. Every row and column MUST keep at least 3 clues
      const minBox = (b === 4) ? 4 : 3;
      if (rowClues[r] <= 3 || colClues[c] <= 3 || boxClues[b] <= minBox) continue;

      const temp = puzzleBoard[r][c];
      puzzleBoard[r][c] = 0;

      // Check if still uniquely solvable
      const testCopy = cloneBoard(puzzleBoard);
      const count = countSolutions(testCopy, { val: 0 }, 2);

      if (count !== 1) {
        puzzleBoard[r][c] = temp; // Restore
      } else {
        rowClues[r]--;
        colClues[c]--;
        boxClues[b]--;
        clues--;
      }
    }

    if (clues >= 32 && clues <= 36 && boxClues[4] >= 4) {
      return {
        id: 'medium-gen-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        difficulty: 'medium',
        cluesCount: clues,
        initial: puzzleBoard,
        solution: solution,
      };
    }
  }

  // Fallback to one of the curated verified puzzles if generation timed out
  return getRandomMediumPuzzle();
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
