import type { TriviaQuestion, Player, Score, Photo } from './types';

export const sampleQuestions: TriviaQuestion[] = [
  {
    id: '1',
    question: 'What year did the Seattle Seahawks win their first Super Bowl?',
    imageUrl: null,
    options: ['2012', '2013', '2014', '2015'],
    correctAnswer: 1,
    difficulty: 'easy',
    category: 'History',
    explanation: 'The Seahawks won Super Bowl XLVIII on February 2, 2014, defeating the Denver Broncos 43-8.'
  },
  {
    id: '2',
    question: 'Who was named Super Bowl XLVIII MVP?',
    imageUrl: null,
    options: ['Russell Wilson', 'Marshawn Lynch', 'Malcolm Smith', 'Richard Sherman'],
    correctAnswer: 2,
    difficulty: 'medium',
    category: 'Players',
    explanation: 'Linebacker Malcolm Smith was named MVP after recording an interception return for a touchdown and a fumble recovery.'
  },
  {
    id: '3',
    question: 'What was the final score of Super Bowl XLVIII?',
    imageUrl: null,
    options: ['43-8', '34-17', '28-24', '31-10'],
    correctAnswer: 0,
    difficulty: 'easy',
    category: 'History',
    explanation: 'The Seahawks dominated the Broncos 43-8, the largest margin of victory in Super Bowl history at the time.'
  },
  {
    id: '4',
    question: 'Who returned the opening kickoff of Super Bowl XLVIII for a touchdown?',
    imageUrl: null,
    options: ['Golden Tate', 'Percy Harvin', 'Doug Baldwin', 'Jermaine Kearse'],
    correctAnswer: 1,
    difficulty: 'hard',
    category: 'Plays',
    explanation: 'Percy Harvin returned the second-half kickoff 87 yards for a touchdown.'
  },
  {
    id: '5',
    question: 'What nickname was given to the Seahawks\' dominant defense?',
    imageUrl: null,
    options: ['Steel Curtain', 'Legion of Doom', 'Legion of Boom', 'Fearsome Foursome'],
    correctAnswer: 2,
    difficulty: 'easy',
    category: 'Trivia',
    explanation: 'The Legion of Boom featured stars like Richard Sherman, Earl Thomas, Kam Chancellor, and Bobby Wagner.'
  },
  {
    id: '6',
    question: 'How many touchdowns did Russell Wilson throw in Super Bowl XLVIII?',
    imageUrl: null,
    options: ['1', '2', '3', '4'],
    correctAnswer: 1,
    difficulty: 'medium',
    category: 'Stats',
    explanation: 'Russell Wilson threw 2 touchdown passes in the Super Bowl victory.'
  },
  {
    id: '7',
    question: 'Which team did the Seahawks defeat in the NFC Championship to reach Super Bowl XLVIII?',
    imageUrl: null,
    options: ['Green Bay Packers', 'San Francisco 49ers', 'New Orleans Saints', 'Carolina Panthers'],
    correctAnswer: 1,
    difficulty: 'medium',
    category: 'History',
    explanation: 'The Seahawks defeated the 49ers 23-17 in the NFC Championship Game.'
  },
  {
    id: '8',
    question: 'What was the halftime score of Super Bowl XLVIII?',
    imageUrl: null,
    options: ['15-0', '22-0', '29-0', '36-0'],
    correctAnswer: 1,
    difficulty: 'hard',
    category: 'History',
    explanation: 'The Seahawks led 22-0 at halftime, completely dominating the Broncos.'
  },
  {
    id: '9',
    question: 'Who caught a 23-yard touchdown pass from Russell Wilson in Super Bowl XLVIII?',
    imageUrl: null,
    options: ['Golden Tate', 'Doug Baldwin', 'Jermaine Kearse', 'Luke Willson'],
    correctAnswer: 2,
    difficulty: 'hard',
    category: 'Plays',
    explanation: 'Jermaine Kearse caught a 23-yard touchdown pass in the fourth quarter.'
  },
  {
    id: '10',
    question: 'In what stadium was Super Bowl XLVIII played?',
    imageUrl: null,
    options: ['University of Phoenix Stadium', 'MetLife Stadium', 'Levi\'s Stadium', 'Mercedes-Benz Stadium'],
    correctAnswer: 1,
    difficulty: 'medium',
    category: 'Trivia',
    explanation: 'Super Bowl XLVIII was played at MetLife Stadium in East Rutherford, New Jersey.'
  },
];

export const samplePlayers: Player[] = [
  {
    id: '1',
    name: 'Russell Wilson',
    number: 3,
    position: 'Quarterback',
    imageUrl: '/players/wilson.jpg',
    stats: [
      { label: 'Pass Yards', value: '206' },
      { label: 'TDs', value: '2' },
      { label: 'Passer Rating', value: '123.1' },
    ],
    superBowlHighlight: 'Led the offense with precision passing and two touchdown throws.'
  },
  {
    id: '2',
    name: 'Marshawn Lynch',
    number: 24,
    position: 'Running Back',
    imageUrl: '/players/lynch.jpg',
    stats: [
      { label: 'Rush Yards', value: '39' },
      { label: 'TDs', value: '1' },
      { label: 'Carries', value: '15' },
    ],
    superBowlHighlight: 'Beast Mode powered through for a crucial touchdown run.'
  },
  {
    id: '3',
    name: 'Richard Sherman',
    number: 25,
    position: 'Cornerback',
    imageUrl: '/players/sherman.jpg',
    stats: [
      { label: 'Tackles', value: '3' },
      { label: 'INTs', value: '0' },
      { label: 'Pass Def', value: '2' },
    ],
    superBowlHighlight: 'Locked down receivers as part of the Legion of Boom.'
  },
  {
    id: '4',
    name: 'Malcolm Smith',
    number: 53,
    position: 'Linebacker',
    imageUrl: '/players/smith.jpg',
    stats: [
      { label: 'Tackles', value: '9' },
      { label: 'INTs', value: '1' },
      { label: 'TD', value: '1' },
    ],
    superBowlHighlight: 'Super Bowl MVP with a pick-six and fumble recovery.'
  },
  {
    id: '5',
    name: 'Earl Thomas',
    number: 29,
    position: 'Free Safety',
    imageUrl: '/players/thomas.jpg',
    stats: [
      { label: 'Tackles', value: '5' },
      { label: 'INTs', value: '0' },
      { label: 'Pass Def', value: '1' },
    ],
    superBowlHighlight: 'Patrolled the deep middle and disrupted Denver\'s passing game.'
  },
  {
    id: '6',
    name: 'Kam Chancellor',
    number: 31,
    position: 'Strong Safety',
    imageUrl: '/players/chancellor.jpg',
    stats: [
      { label: 'Tackles', value: '7' },
      { label: 'INTs', value: '0' },
      { label: 'FF', value: '0' },
    ],
    superBowlHighlight: 'Delivered bone-crushing hits that intimidated Denver receivers.'
  },
  {
    id: '7',
    name: 'Percy Harvin',
    number: 11,
    position: 'Wide Receiver',
    imageUrl: '/players/harvin.jpg',
    stats: [
      { label: 'KR Yards', value: '87' },
      { label: 'KR TD', value: '1' },
      { label: 'Rec Yards', value: '45' },
    ],
    superBowlHighlight: 'Explosive 87-yard kickoff return TD to open the second half.'
  },
  {
    id: '8',
    name: 'Doug Baldwin',
    number: 89,
    position: 'Wide Receiver',
    imageUrl: '/players/baldwin.jpg',
    stats: [
      { label: 'Receptions', value: '5' },
      { label: 'Yards', value: '66' },
      { label: 'TDs', value: '0' },
    ],
    superBowlHighlight: 'Reliable target for Wilson throughout the game.'
  },
];

export const sampleScores: Score[] = [
  {
    id: '1',
    teamId: 't1',
    teamName: 'The 12th Men',
    teamImage: null,
    points: 450,
    correctAnswers: 45,
    totalAnswers: 50,
    streak: 5,
    lastPlayedDate: '2024-02-01',
  },
  {
    id: '2',
    teamId: 't2',
    teamName: 'Legion of Trivia',
    teamImage: null,
    points: 420,
    correctAnswers: 42,
    totalAnswers: 50,
    streak: 3,
    lastPlayedDate: '2024-02-01',
  },
  {
    id: '3',
    teamId: 't3',
    teamName: 'Beast Mode Quiz',
    teamImage: null,
    points: 380,
    correctAnswers: 38,
    totalAnswers: 50,
    streak: 2,
    lastPlayedDate: '2024-02-01',
  },
  {
    id: '4',
    teamId: 't4',
    teamName: 'Blue Thunder',
    teamImage: null,
    points: 350,
    correctAnswers: 35,
    totalAnswers: 50,
    streak: 0,
    lastPlayedDate: '2024-01-31',
  },
  {
    id: '5',
    teamId: 't5',
    teamName: 'Hawk Nation',
    teamImage: null,
    points: 320,
    correctAnswers: 32,
    totalAnswers: 50,
    streak: 1,
    lastPlayedDate: '2024-02-01',
  },
];

export const samplePhotos: Photo[] = [
  {
    id: '1',
    teamId: 't1',
    teamName: 'The 12th Men',
    imageUrl: '/photos/sample1.jpg',
    caption: 'Game day ready! Go Hawks!',
    likes: 24,
    createdAt: '2024-02-01T14:30:00Z',
  },
  {
    id: '2',
    teamId: 't2',
    teamName: 'Legion of Trivia',
    imageUrl: '/photos/sample2.jpg',
    caption: 'Throwback to Super Bowl XLVIII',
    likes: 18,
    createdAt: '2024-02-01T12:15:00Z',
  },
  {
    id: '3',
    teamId: 't3',
    teamName: 'Beast Mode Quiz',
    imageUrl: '/photos/sample3.jpg',
    caption: 'Beast Mode activated!',
    likes: 31,
    createdAt: '2024-01-31T18:45:00Z',
  },
];

export const teamAvatars = [
  { id: 'hawk', name: 'Hawk', emoji: '🦅' },
  { id: '12', name: '12th Man', emoji: '1️⃣2️⃣' },
  { id: 'football', name: 'Football', emoji: '🏈' },
  { id: 'trophy', name: 'Champion', emoji: '🏆' },
  { id: 'star', name: 'Star', emoji: '⭐' },
  { id: 'thunder', name: 'Thunder', emoji: '⚡' },
];
