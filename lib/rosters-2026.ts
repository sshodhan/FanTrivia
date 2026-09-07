import type { Player } from './database.types'

export type CurrentRosterCategory = '2026-hawks' | '2026-pats'

export interface RosterSource {
  url: string
  label: string
  verifiedAt: string
  scope: string
}

const POSITIONS = {
  QB: 'Quarterback', RB: 'Running Back', FB: 'Fullback', WR: 'Wide Receiver',
  TE: 'Tight End', T: 'Offensive Tackle', G: 'Offensive Guard',
  'G/T': 'Offensive Guard / Tackle', C: 'Center', OL: 'Offensive Line',
  DE: 'Defensive End', DT: 'Defensive Tackle', NT: 'Nose Tackle',
  DL: 'Defensive Line', LB: 'Linebacker', CB: 'Cornerback', S: 'Safety',
  K: 'Kicker', P: 'Punter', LS: 'Long Snapper',
} as const

type RosterEntry = [
  name: string, number: number, position: keyof typeof POSITIONS,
  height: string, weight: number, experience: number | 'R', college: string,
]

// Active-list snapshots only: reserve lists, practice squads and coaches are excluded.
// Keep this verification date tied to the source review, not the date of each request.
const VERIFIED_AT = '2026-09-07'

const SEAHAWKS: RosterEntry[] = [
  ['Elijah Arroyo', 18, 'TE', '6-5', 254, 2, 'Miami'],
  ['AJ Barner', 88, 'TE', '6-6', 251, 3, 'Michigan'],
  ['Anthony Bradford', 75, 'G', '6-4', 335, 4, 'LSU'],
  ['Bryce Cabeldue', 77, 'G', '6-4', 308, 2, 'Kansas'],
  ['Charles Cross', 67, 'T', '6-5', 317, 5, 'Mississippi State'],
  ['Sam Darnold', 14, 'QB', '6-3', 225, 9, 'USC'],
  ['Michael Dickson', 4, 'P', '6-2', 208, 9, 'Texas'],
  ['Nick Emmanwori', 3, 'S', '6-3', 220, 2, 'South Carolina'],
  ['Montorie Foster Jr', 87, 'WR', '5-11', 188, 1, 'Michigan State'],
  ['Dante Fowler Jr.', 56, 'LB', '6-3', 264, 12, 'Florida'],
  ['Derick Hall', 58, 'LB', '6-3', 260, 4, 'Auburn'],
  ['Christian Haynes', 64, 'G', '6-3', 317, 3, 'Connecticut'],
  ['George Holani', 36, 'RB', '5-11', 210, 3, 'Boise State'],
  ['Tory Horton', 15, 'WR', '6-2', 196, 2, 'Colorado State'],
  ['Josh Jobe', 29, 'CB', '5-11', 190, 5, 'Alabama'],
  ['Ernest Jones IV', 13, 'LB', '6-2', 233, 6, 'South Carolina'],
  ['Josh Jones', 74, 'G/T', '6-7', 339, 7, 'Houston'],
  ['Nick Kallerup', 89, 'TE', '6-5', 266, 2, 'Minnesota'],
  ['Tyrice Knight', 48, 'LB', '6-0', 233, 3, 'Texas-El Paso'],
  ['Cooper Kupp', 10, 'WR', '6-1', 205, 10, 'Eastern Washington'],
  ['DeMarcus Lawrence', 0, 'LB', '6-3', 254, 13, 'Boise State'],
  ['Drew Lock', 2, 'QB', '6-4', 228, 8, 'Missouri'],
  ['Julian Love', 20, 'S', '5-11', 195, 8, 'Notre Dame'],
  ['Abraham Lucas', 72, 'T', '6-6', 322, 5, 'Washington State'],
  ['Rylie Mills', 98, 'DE', '6-5', 296, 1, 'Notre Dame'],
  ['Jalen Milroe', 6, 'QB', '6-2', 216, 2, 'Alabama'],
  ['Mike Morris', 94, 'DE', '6-6', 306, 4, 'Michigan'],
  ['Byron Murphy II', 91, 'DT', '6-0', 306, 3, 'Texas'],
  ['Jason Myers', 5, 'K', '5-10', 190, 12, 'Marist'],
  ['Julian Neal', 1, 'CB', '6-2', 203, 'R', 'Arkansas'],
  ['Uchenna Nwosu', 7, 'LB', '6-2', 265, 9, 'USC'],
  ["Patrick O'Connell", 52, 'LB', '6-1', 231, 3, 'Montana'],
  ['Ty Okada', 39, 'S', '5-11', 200, 2, 'Montana State'],
  ['Olu Oluwatimi', 55, 'C', '6-3', 309, 4, 'Michigan'],
  ["Connor O'Toole", 57, 'LB', '6-3', 248, 2, 'Utah'],
  ['Brandon Pili', 95, 'NT', '6-3', 334, 4, 'USC'],
  ['Jadarian Price', 8, 'RB', '5-11', 209, 'R', 'Notre Dame'],
  ['Nehemiah Pritchett', 28, 'CB', '6-0', 190, 3, 'Auburn'],
  ['Jarran Reed', 90, 'NT', '6-3', 315, 11, 'Alabama'],
  ['Brady Russell', 38, 'FB', '6-3', 250, 4, 'Colorado'],
  ['Eric Saubert', 81, 'TE', '6-5', 248, 9, 'Drake'],
  ['Rashid Shaheed', 22, 'WR', '6-0', 180, 5, 'Weber State'],
  ['Avery Smith', 27, 'CB', '5-11', 196, 'R', 'Toledo'],
  ['Jaxon Smith-Njigba', 11, 'WR', '6-0', 197, 4, 'Ohio State'],
  ['Beau Stephens', 70, 'G', '6-5', 315, 'R', 'Iowa'],
  ['Chris Stoll', 41, 'LS', '6-2', 255, 4, 'Penn State'],
  ['Jalen Sundell', 61, 'C', '6-5', 301, 3, 'North Dakota State'],
  ['Chazz Surratt', 44, 'LB', '6-2', 233, 5, 'North Carolina'],
  ['Drake Thomas', 32, 'LB', '5-11', 228, 4, 'N.C. State'],
  ['Leonard Williams', 99, 'DT', '6-5', 310, 12, 'USC'],
  ['Emanuel Wilson', 23, 'RB', '5-10', 226, 4, 'Fort Valley State College'],
  ['Devon Witherspoon', 21, 'CB', '6-0', 185, 4, 'Illinois'],
  ['Grey Zabel', 76, 'G', '6-6', 316, 2, 'North Dakota State'],
]

const PATRIOTS: RosterEntry[] = [
  ['Tanner Arkin', 84, 'TE', '6-4', 262, 'R', 'Illinois'],
  ['Julian Ashby', 47, 'LS', '6-1', 231, 2, 'Vanderbilt'],
  ['Christian Barmore', 90, 'DT', '6-5', 315, 6, 'Alabama'],
  ['Andy Borregales', 8, 'K', '5-11', 202, 2, 'Miami'],
  ['A.J. Brown', 1, 'WR', '6-1', 226, 8, 'Mississippi'],
  ['Ben Brown', 77, 'C', '6-5', 313, 4, 'Mississippi'],
  ['Kevin Byard III', 31, 'S', '5-11', 212, 11, 'Middle Tennessee State'],
  ['Will Campbell', 66, 'T', '6-6', 319, 2, 'LSU'],
  ['Channing Canada', 29, 'CB', '5-11', 190, 'R', 'Texas Christian'],
  ['Efton Chism III', 86, 'WR', '5-10', 198, 2, 'Eastern Washington'],
  ['Dametrious Crownover', 68, 'T', '6-7', 319, 'R', 'Texas A&M'],
  ['Carlton Davis III', 7, 'CB', '6-1', 200, 8, 'Auburn'],
  ['Tommy DeVito', 16, 'QB', '6-2', 210, 4, 'Illinois'],
  ['Romeo Doubs', 87, 'WR', '6-2', 210, 5, 'Nevada'],
  ['DeMario Douglas', 3, 'WR', '5-8', 185, 4, 'Liberty'],
  ['Cory Durden', 94, 'DT', '6-4', 305, 2, 'North Carolina State'],
  ['Christian Elliss', 53, 'LB', '6-2', 231, 5, 'Idaho'],
  ['Joshua Farmer', 92, 'DT', '6-3', 312, 2, 'Florida State'],
  ['Reggie Gilliam', 44, 'FB', '6-1', 255, 7, 'Toledo'],
  ['Christian Gonzalez', 0, 'CB', '6-1', 205, 4, 'Oregon'],
  ['TreVeyon Henderson', 32, 'RB', '5-10', 202, 2, 'Ohio State'],
  ['Hunter Henry', 85, 'TE', '6-5', 249, 11, 'Arkansas'],
  ['Mack Hollins', 13, 'WR', '6-4', 221, 10, 'North Carolina'],
  ['Erick Hunter', 49, 'LB', '6-2', 225, 'R', 'Morgan State'],
  ['Quintayvious Hutchins', 45, 'LB', '6-3', 245, 'R', 'Boston College'],
  ['Gabe Jacas', 50, 'LB', '6-4', 261, 'R', 'Illinois'],
  ["Dre'Mont Jones", 5, 'DE', '6-3', 268, 8, 'Ohio State'],
  ['Marcus Jones', 25, 'CB', '5-8', 188, 5, 'Houston'],
  ['Corey Kiner', 9, 'RB', '5-9', 209, 2, 'Cincinnati'],
  ['Cameron Latu', 36, 'TE', '6-5', 244, 3, 'Alabama'],
  ['Caleb Lomu', 74, 'T', '6-6', 313, 'R', 'Utah'],
  ['Drake Maye', 10, 'QB', '6-4', 225, 3, 'North Carolina'],
  ['Behren Morton', 15, 'QB', '6-2', 218, 'R', 'Texas Tech'],
  ['Morgan Moses', 76, 'T', '6-6', 320, 13, 'Virginia'],
  ['Darius Muasau', 54, 'LB', '6-1', 230, 3, 'UCLA'],
  ['Namdi Obiazor', 48, 'LB', '6-3', 229, 'R', 'Texas Christian'],
  ['Mike Onwenu', 71, 'OL', '6-3', 350, 7, 'Michigan'],
  ['Dell Pettus', 24, 'S', '5-11', 200, 3, 'Troy'],
  ['Elijah Ponder', 91, 'LB', '6-3', 261, 2, 'Cal Poly'],
  ['Karon Prunty', 21, 'CB', '6-1', 192, 'R', 'Wake Forest'],
  ['Eli Raridon', 82, 'TE', '6-6', 245, 'R', 'Notre Dame'],
  ['Jaylen Reed', 23, 'S', '6-0', 212, 2, 'Penn State'],
  ['Walter Rouse', 72, 'OL', '6-6', 314, 3, 'Oklahoma'],
  ['Robert Spillane', 14, 'LB', '6-1', 234, 8, 'Western Michigan'],
  ['Rhamondre Stevenson', 38, 'RB', '6-0', 227, 6, 'Oklahoma'],
  ['Leonard Taylor III', 93, 'DL', '6-3', 305, 3, 'Miami'],
  ['Greg Van Roten', 70, 'OL', '6-3', 305, 12, 'Penn'],
  ['Alijah Vera-Tucker', 75, 'G', '6-4', 308, 6, 'USC'],
  ['Kyle Williams', 18, 'WR', '5-11', 190, 2, 'Washington State'],
  ['Milton Williams', 97, 'DT', '6-3', 290, 6, 'Louisiana Tech'],
  ['Jared Wilson', 55, 'OL', '6-3', 310, 2, 'Georgia'],
  ['Charles Woods', 22, 'CB', '5-11', 185, 3, 'SMU'],
  ['Craig Woodson', 4, 'S', '6-0', 200, 2, 'California'],
]

const TEAMS = {
  '2026-hawks': {
    name: 'Seattle Seahawks', entries: SEAHAWKS,
    url: 'https://www.seahawks.com/team/players-roster/',
  },
  '2026-pats': {
    name: 'New England Patriots', entries: PATRIOTS,
    url: 'https://www.patriots.com/team/players-roster/',
  },
} as const

export function isCurrentRosterCategory(category: string): category is CurrentRosterCategory {
  return category === '2026-hawks' || category === '2026-pats'
}

export function getCurrentRoster(category: CurrentRosterCategory): { players: Player[]; source: RosterSource } {
  const team = TEAMS[category]
  const players = team.entries.map(([name, number, position, height, weight, experience, college], index): Player => ({
    id: `${category}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')}`,
    name,
    jersey_number: number,
    position: POSITIONS[position],
    image_url: null,
    image_validated: false,
    stats: {
      Height: height.replace('-', ' ft ') + ' in',
      Weight: `${weight} lb`,
      Experience: experience === 'R' ? 'Rookie' : `${experience} ${experience === 1 ? 'year' : 'years'}`,
      Status: 'Active',
    },
    trivia: [
      `College: ${college}.`,
      `Listed on the ${team.name} active roster for the 2026 season.`,
    ],
    bio: `${team.name} ${POSITIONS[position]} — 2026 active roster`,
    super_bowl_highlight: null,
    display_order: index + 1,
    is_active: true,
  }))

  return {
    players,
    source: {
      url: team.url,
      label: `${team.name} official roster`,
      verifiedAt: VERIFIED_AT,
      scope: 'Active roster only; excludes reserve lists, practice squad and coaches.',
    },
  }
}
