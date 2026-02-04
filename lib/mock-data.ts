import { AVATARS, type AvatarId } from './database.types'

// Re-export avatars for components
export const teamAvatars = Object.values(AVATARS).map(avatar => ({
  id: avatar.id as AvatarId,
  name: avatar.name,
  emoji: avatar.emoji,
}))

// Suggested team names for quick selection
export const suggestedTeamNames = [
  'Legion of Boom',
  '12th Man Legends',
  'Sea Hawks Rising',
  'Beast Mode',
  'Blue Thunder',
  'Hawk Nation',
  'The 12s',
  'Super Bowl Champs',
]

// Demo questions (used when Supabase not configured)
export const sampleQuestions = [
  {
    id: 'demo-1',
    question_text: 'What year did the Seattle Seahawks win their first Super Bowl?',
    option_a: '2012',
    option_b: '2013',
    option_c: '2014',
    option_d: '2015',
    correct_answer: 'b' as const,
    hint_text: 'The season was 2013-2014',
    time_limit_seconds: 15,
    points: 100,
    difficulty: 'easy' as const,
    category: 'Super Bowl XLVIII',
  },
  {
    id: 'demo-2',
    question_text: 'Who was named MVP of Super Bowl XLVIII?',
    option_a: 'Russell Wilson',
    option_b: 'Marshawn Lynch',
    option_c: 'Malcolm Smith',
    option_d: 'Richard Sherman',
    correct_answer: 'c' as const,
    hint_text: 'He had a pick-six',
    time_limit_seconds: 15,
    points: 100,
    difficulty: 'easy' as const,
    category: 'Super Bowl XLVIII',
  },
  {
    id: 'demo-3',
    question_text: 'What was the final score of Super Bowl XLVIII?',
    option_a: '43-8',
    option_b: '34-7',
    option_c: '38-10',
    option_d: '41-14',
    correct_answer: 'a' as const,
    hint_text: 'It was the largest margin in Super Bowl history at the time',
    time_limit_seconds: 15,
    points: 100,
    difficulty: 'medium' as const,
    category: 'Super Bowl XLVIII',
  },
  {
    id: 'demo-4',
    question_text: 'Which team did the Seahawks defeat in Super Bowl XLVIII?',
    option_a: 'New England Patriots',
    option_b: 'San Francisco 49ers',
    option_c: 'Denver Broncos',
    option_d: 'Green Bay Packers',
    correct_answer: 'c' as const,
    hint_text: 'They had the #1 offense that year',
    time_limit_seconds: 15,
    points: 100,
    difficulty: 'easy' as const,
    category: 'Super Bowl XLVIII',
  },
  {
    id: 'demo-5',
    question_text: 'What was the nickname of the Seahawks legendary defense?',
    option_a: 'Steel Curtain',
    option_b: 'Legion of Boom',
    option_c: 'Purple People Eaters',
    option_d: 'Monsters of the Midway',
    correct_answer: 'b' as const,
    hint_text: 'It references their big hits',
    time_limit_seconds: 15,
    points: 100,
    difficulty: 'easy' as const,
    category: 'Seahawks History',
  },
]

// Demo players
export const samplePlayers = [
  {
    id: 'demo-1',
    name: 'Russell Wilson',
    jersey_number: 3,
    position: 'Quarterback',
    image_url: null,
    stats: { passing_yards: 206, touchdowns: 2, passer_rating: 123.1 },
    super_bowl_highlight: 'Led the Seahawks to a 43-8 victory in Super Bowl XLVIII',
    display_order: 1,
  },
  {
    id: 'demo-2',
    name: 'Marshawn Lynch',
    jersey_number: 24,
    position: 'Running Back',
    image_url: null,
    stats: { rushing_yards: 39, touchdowns: 1, carries: 15 },
    super_bowl_highlight: 'Beast Mode touchdown run in Super Bowl XLVIII',
    display_order: 2,
  },
  {
    id: 'demo-3',
    name: 'Richard Sherman',
    jersey_number: 25,
    position: 'Cornerback',
    image_url: null,
    stats: { interceptions: 8, passes_defended: 16 },
    super_bowl_highlight: 'Key interception sealing NFC Championship',
    display_order: 3,
  },
  {
    id: 'demo-4',
    name: 'Malcolm Smith',
    jersey_number: 53,
    position: 'Linebacker',
    image_url: null,
    stats: { tackles: 10, interceptions: 1, forced_fumbles: 1 },
    super_bowl_highlight: 'Super Bowl XLVIII MVP with pick-six',
    display_order: 4,
  },
  {
    id: 'demo-5',
    name: 'Earl Thomas',
    jersey_number: 29,
    position: 'Safety',
    image_url: null,
    stats: { interceptions: 5, tackles: 105 },
    super_bowl_highlight: 'Legion of Boom leader, 2 interceptions in playoffs',
    display_order: 5,
  },
  {
    id: 'demo-6',
    name: 'Kam Chancellor',
    jersey_number: 31,
    position: 'Safety',
    image_url: null,
    stats: { tackles: 99, forced_fumbles: 3 },
    super_bowl_highlight: 'Devastating hits and forced fumbles',
    display_order: 6,
  },
]

// Demo leaderboard
export const sampleLeaderboard = [
  { rank: 1, username: 'Legion of Boom', avatar: 'hawk' as AvatarId, total_points: 2450, current_streak: 5, days_played: 4 },
  { rank: 2, username: '12th Man Army', avatar: '12th_man' as AvatarId, total_points: 2100, current_streak: 3, days_played: 4 },
  { rank: 3, username: 'Beast Mode', avatar: 'champion' as AvatarId, total_points: 1850, current_streak: 2, days_played: 3 },
  { rank: 4, username: 'Sea Hawks Rising', avatar: 'fire' as AvatarId, total_points: 1600, current_streak: 4, days_played: 3 },
  { rank: 5, username: 'Blue Thunder', avatar: 'sparkle' as AvatarId, total_points: 1400, current_streak: 1, days_played: 2 },
]

// Demo photos
export const samplePhotos = [
  {
    id: 'demo-1',
    username: 'Legion of Boom',
    user_avatar: 'hawk' as AvatarId,
    image_url: '/photos/sample1.jpg',
    caption: 'Game day ready! Go Hawks!',
    like_count: 24,
    created_at: '2024-02-01T14:30:00Z',
  },
  {
    id: 'demo-2',
    username: '12th Man Army',
    user_avatar: '12th_man' as AvatarId,
    image_url: '/photos/sample2.jpg',
    caption: 'Throwback to Super Bowl XLVIII',
    like_count: 18,
    created_at: '2024-02-01T12:15:00Z',
  },
  {
    id: 'demo-3',
    username: 'Beast Mode',
    user_avatar: 'champion' as AvatarId,
    image_url: '/photos/sample3.jpg',
    caption: 'Beast Mode activated!',
    like_count: 31,
    created_at: '2024-01-31T18:45:00Z',
  },
]
