export interface Team {
  id: string;
  name: string;
  imageUrl: string | null;
  createdAt: string;
}

export interface TriviaQuestion {
  id: string;
  question: string;
  imageUrl: string | null;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  explanation?: string;
}

export interface DailyTriviaSet {
  id: string;
  date: string;
  questions: TriviaQuestion[];
  isGameDay: boolean;
}

export interface Score {
  id: string;
  teamId: string;
  teamName: string;
  teamImage: string | null;
  points: number;
  correctAnswers: number;
  totalAnswers: number;
  streak: number;
  lastPlayedDate: string;
}

export interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  imageUrl: string;
  stats: {
    label: string;
    value: string;
  }[];
  superBowlHighlight: string;
  trivia: string[];
}

export interface Photo {
  id: string;
  teamId: string;
  teamName: string;
  imageUrl: string;
  caption: string;
  likes: number;
  createdAt: string;
}

export interface GameState {
  currentQuestionIndex: number;
  answers: (number | null)[];
  timeRemaining: number;
  isComplete: boolean;
  score: number;
  streak: number;
}
