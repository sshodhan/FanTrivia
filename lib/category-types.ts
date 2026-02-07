// Daily Categories Screen - Types & Interfaces

export type TabFilter = 'daily' | 'modern-era' | 'lob-era' | 'heritage';

export type CategoryState = 'completed' | 'unlocked' | 'locked-soon' | 'locked-far';

export interface CategoryTab {
  id: TabFilter;
  emoji: string;
  label: string;
}

export interface Category {
  id: string;
  title: string;
  emoji: string;
  questionCount: number;
  unlockDay: number;
  groupId: string;
  pillFilters: TabFilter[];
  isFinale?: boolean;
  /** The category value in the trivia_questions.category DB column */
  dbCategory?: string;
}

export interface CategoryProgress {
  categoryId: string;
  isCompleted: boolean;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  totalPoints: number;
}

export interface CategoryWithState extends Category {
  state: CategoryState;
  progress?: CategoryProgress;
}

export interface DailyCategoriesScreenProps {
  currentDay: number;
  completedCategories: CategoryProgress[];
  streak: number;
  onStartCategory: (id: string) => void;
  onViewResults: (id: string) => void;
  onRetakeCategory?: (id: string) => Promise<void>;
  onBack: () => void;
}
