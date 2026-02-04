// Database types for Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ImageSource = 'web' | 'generated' | 'uploaded'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type GameMode = 'pre_game' | 'daily' | 'live' | 'ended'

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string
          name: string
          image_url: string | null
          is_preset_image: boolean
          device_fingerprint: string | null
          session_token: string | null
          created_at: string
          last_active: string | null
        }
        Insert: {
          id?: string
          name: string
          image_url?: string | null
          is_preset_image?: boolean
          device_fingerprint?: string | null
          session_token?: string | null
          created_at?: string
          last_active?: string | null
        }
        Update: {
          id?: string
          name?: string
          image_url?: string | null
          is_preset_image?: boolean
          device_fingerprint?: string | null
          session_token?: string | null
          created_at?: string
          last_active?: string | null
        }
      }
      trivia_questions: {
        Row: {
          id: string
          question_text: string
          image_url: string | null
          image_source: ImageSource | null
          options: string[]
          correct_answer_index: number
          hint_text: string | null
          time_limit_seconds: number
          points: number
          difficulty: Difficulty
          category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          question_text: string
          image_url?: string | null
          image_source?: ImageSource | null
          options: string[]
          correct_answer_index: number
          hint_text?: string | null
          time_limit_seconds?: number
          points?: number
          difficulty?: Difficulty
          category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          question_text?: string
          image_url?: string | null
          image_source?: ImageSource | null
          options?: string[]
          correct_answer_index?: number
          hint_text?: string | null
          time_limit_seconds?: number
          points?: number
          difficulty?: Difficulty
          category?: string | null
          created_at?: string
        }
      }
      daily_trivia_sets: {
        Row: {
          id: string
          day_identifier: string
          display_date: string
          question_ids: string[]
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          day_identifier: string
          display_date: string
          question_ids: string[]
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          day_identifier?: string
          display_date?: string
          question_ids?: string[]
          is_active?: boolean
          created_at?: string
        }
      }
      game_day_rounds: {
        Row: {
          id: string
          round_number: number
          question_ids: string[]
          is_live: boolean
          started_at: string | null
          ended_at: string | null
        }
        Insert: {
          id?: string
          round_number: number
          question_ids: string[]
          is_live?: boolean
          started_at?: string | null
          ended_at?: string | null
        }
        Update: {
          id?: string
          round_number?: number
          question_ids?: string[]
          is_live?: boolean
          started_at?: string | null
          ended_at?: string | null
        }
      }
      scores: {
        Row: {
          id: string
          team_id: string
          question_id: string
          day_identifier: string | null
          is_correct: boolean
          points_earned: number
          streak_bonus: number
          time_taken_ms: number | null
          answered_at: string
        }
        Insert: {
          id?: string
          team_id: string
          question_id: string
          day_identifier?: string | null
          is_correct: boolean
          points_earned?: number
          streak_bonus?: number
          time_taken_ms?: number | null
          answered_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          question_id?: string
          day_identifier?: string | null
          is_correct?: boolean
          points_earned?: number
          streak_bonus?: number
          time_taken_ms?: number | null
          answered_at?: string
        }
      }
      team_daily_progress: {
        Row: {
          id: string
          team_id: string
          day_identifier: string
          completed: boolean
          total_points: number
          completed_at: string | null
        }
        Insert: {
          id?: string
          team_id: string
          day_identifier: string
          completed?: boolean
          total_points?: number
          completed_at?: string | null
        }
        Update: {
          id?: string
          team_id?: string
          day_identifier?: string
          completed?: boolean
          total_points?: number
          completed_at?: string | null
        }
      }
      photo_uploads: {
        Row: {
          id: string
          team_id: string
          image_url: string
          caption: string | null
          likes: number
          is_approved: boolean
          is_hidden: boolean
          uploaded_at: string
        }
        Insert: {
          id?: string
          team_id: string
          image_url: string
          caption?: string | null
          likes?: number
          is_approved?: boolean
          is_hidden?: boolean
          uploaded_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          image_url?: string
          caption?: string | null
          likes?: number
          is_approved?: boolean
          is_hidden?: boolean
          uploaded_at?: string
        }
      }
      photo_likes: {
        Row: {
          id: string
          photo_id: string
          team_id: string
          created_at: string
        }
        Insert: {
          id?: string
          photo_id: string
          team_id: string
          created_at?: string
        }
        Update: {
          id?: string
          photo_id?: string
          team_id?: string
          created_at?: string
        }
      }
      seahawks_players: {
        Row: {
          id: string
          name: string
          position: string | null
          number: number | null
          image_url: string | null
          stats: Json | null
          bio: string | null
          super_bowl_highlight: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          position?: string | null
          number?: number | null
          image_url?: string | null
          stats?: Json | null
          bio?: string | null
          super_bowl_highlight?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          position?: string | null
          number?: number | null
          image_url?: string | null
          stats?: Json | null
          bio?: string | null
          super_bowl_highlight?: string | null
          is_active?: boolean
        }
      }
      admin_action_logs: {
        Row: {
          id: string
          action_type: string
          target_type: string | null
          target_id: string | null
          details: Json | null
          performed_at: string
        }
        Insert: {
          id?: string
          action_type: string
          target_type?: string | null
          target_id?: string | null
          details?: Json | null
          performed_at?: string
        }
        Update: {
          id?: string
          action_type?: string
          target_type?: string | null
          target_id?: string | null
          details?: Json | null
          performed_at?: string
        }
      }
      game_state: {
        Row: {
          id: number
          current_mode: GameMode
          current_day: string | null
          live_question_index: number
          is_paused: boolean
          leaderboard_locked: boolean
          updated_at: string
        }
        Insert: {
          id?: number
          current_mode?: GameMode
          current_day?: string | null
          live_question_index?: number
          is_paused?: boolean
          leaderboard_locked?: boolean
          updated_at?: string
        }
        Update: {
          id?: number
          current_mode?: GameMode
          current_day?: string | null
          live_question_index?: number
          is_paused?: boolean
          leaderboard_locked?: boolean
          updated_at?: string
        }
      }
    }
  }
}

// Convenience types for common operations
export type Team = Database['public']['Tables']['teams']['Row']
export type TeamInsert = Database['public']['Tables']['teams']['Insert']
export type TeamUpdate = Database['public']['Tables']['teams']['Update']

export type TriviaQuestion = Database['public']['Tables']['trivia_questions']['Row']
export type TriviaQuestionInsert = Database['public']['Tables']['trivia_questions']['Insert']

export type DailyTriviaSet = Database['public']['Tables']['daily_trivia_sets']['Row']
export type GameDayRound = Database['public']['Tables']['game_day_rounds']['Row']

export type Score = Database['public']['Tables']['scores']['Row']
export type ScoreInsert = Database['public']['Tables']['scores']['Insert']

export type TeamDailyProgress = Database['public']['Tables']['team_daily_progress']['Row']

export type PhotoUpload = Database['public']['Tables']['photo_uploads']['Row']
export type PhotoUploadInsert = Database['public']['Tables']['photo_uploads']['Insert']

export type SeahawksPlayer = Database['public']['Tables']['seahawks_players']['Row']
export type SeahawksPlayerInsert = Database['public']['Tables']['seahawks_players']['Insert']

export type GameState = Database['public']['Tables']['game_state']['Row']
export type GameStateUpdate = Database['public']['Tables']['game_state']['Update']

export type AdminActionLog = Database['public']['Tables']['admin_action_logs']['Row']

// Extended types for API responses
export interface TeamWithStats extends Team {
  total_points: number
  rank: number
  days_played: number
  current_streak: number
}

export interface QuestionWithoutAnswer {
  id: string
  question_text: string
  image_url: string | null
  options: string[]
  hint_text: string | null
  time_limit_seconds: number
  points: number
  difficulty: Difficulty
  category: string | null
}

export interface DailyTriviaResponse {
  day_identifier: string
  display_date: string
  questions: QuestionWithoutAnswer[]
  already_completed: boolean
  team_progress?: {
    total_points: number
    completed_at: string
  }
}

export interface AnswerSubmissionRequest {
  team_id: string
  question_id: string
  answer_index: number
  time_taken_ms: number
}

export interface AnswerSubmissionResponse {
  is_correct: boolean
  correct_answer_index: number
  points_earned: number
  streak_bonus: number
  current_streak: number
  explanation?: string
}

export interface LeaderboardEntry {
  rank: number
  team_id: string
  team_name: string
  team_image: string | null
  total_points: number
  days_played: number
  best_streak: number
}

export interface PhotoWithTeam extends PhotoUpload {
  team_name: string
  team_image: string | null
  has_liked?: boolean
}
