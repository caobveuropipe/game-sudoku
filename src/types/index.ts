export type SudokuBoard = number[][];
export type SudokuNotes = number[][][]; // 9x9 array, each cell contains array of 1-9

export interface SudokuPuzzle {
  id: string;
  initial: number[][];
  solution?: number[][];
  cluesCount: number;
  difficulty: 'medium';
}

export interface SudokuGameState {
  puzzleId: string;
  initialBoard: number[][];
  currentBoard: number[][];
  notes: SudokuNotes;
  selectedCell: [number, number] | null;
  history: Array<{ board: number[][]; notes: SudokuNotes }>;
  isNoteMode: boolean;
  timeSeconds: number;
  isWon: boolean;
  checkedErrors: boolean[][];
}

export type LayerComponentType = 'title' | 'text' | 'image' | 'quiz' | 'next_button';

export interface QuizOption {
  id: string;
  label: string;
  targetLayerId?: string; // Branch destination; if undefined, goes to next layer
}

export interface LayerComponent {
  id: string;
  type: LayerComponentType;
  titleProps?: {
    text: string;
    align: 'left' | 'center' | 'right';
    fontSize: 'sm' | 'md' | 'lg' | 'xl';
  };
  textProps?: {
    text: string;
    align: 'left' | 'center' | 'right';
    style?: 'normal' | 'italic' | 'quote';
  };
  imageProps?: {
    url: string;
    caption?: string;
    alt?: string;
  };
  quizProps?: {
    question: string;
    options: QuizOption[];
  };
  buttonProps?: {
    label: string;
    targetLayerId?: string;
  };
}

export interface MessageLayer {
  id: string;
  title: string;
  theme: 'warm' | 'rose' | 'amber' | 'emerald' | 'indigo';
  components: LayerComponent[];
  defaultNextLayerId?: string;
}

export interface MessageSequence {
  id: string;
  version: number;
  updatedAt: string;
  publishedAt?: string;
  layers: MessageLayer[];
}

export interface AdminUser {
  email: string;
  name?: string;
  picture?: string;
}
