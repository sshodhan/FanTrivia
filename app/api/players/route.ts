import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Player } from '@/lib/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

// Player categories for filtering
type PlayerCategory = 'all' | 'sb48' | '2025-hawks' | 'lob' | 'hof'

// Demo players data organized by category
const DEMO_PLAYERS: Player[] = [
  // Super Bowl XLVIII Heroes
  {
    id: 'sbxlviii-russell-wilson',
    name: 'Russell Wilson',
    jersey_number: 3,
    position: 'Quarterback',
    image_url: null,
    stats: { 'Pass Yds': '206', 'Pass TD': '2', 'Rating': '123.1' },
    bio: 'Super Bowl XLVIII Champion QB',
    super_bowl_highlight: 'Led the Seahawks to a 43-8 victory in Super Bowl XLVIII',
    trivia: ['Became 2nd Black QB to win a Super Bowl', 'Led game-opening 80-yard TD drive'],
    display_order: 30,
    is_active: false,
  },
  {
    id: 'sbxlviii-marshawn-lynch',
    name: 'Marshawn Lynch',
    jersey_number: 24,
    position: 'Running Back',
    image_url: null,
    stats: { 'Rush Yds': '39', 'Rush TD': '1', 'Carries': '15' },
    bio: 'Super Bowl XLVIII Champion RB - Beast Mode',
    super_bowl_highlight: 'Beast Mode touchdown run in Super Bowl XLVIII',
    trivia: ['Scored Seahawks first Super Bowl TD', 'Famous Beast Quake run in 2011 playoffs'],
    display_order: 31,
    is_active: false,
  },
  {
    id: 'sbxlviii-richard-sherman',
    name: 'Richard Sherman',
    jersey_number: 25,
    position: 'Cornerback',
    image_url: null,
    stats: { 'Tackles': '3', 'Pass Def': '2', 'Pro Bowls': '5' },
    bio: 'Legion of Boom - All-Pro Corner',
    super_bowl_highlight: 'Key interception sealing NFC Championship',
    trivia: ['3-time First-Team All-Pro', 'Stanford graduate'],
    display_order: 32,
    is_active: false,
  },
  {
    id: 'sbxlviii-malcolm-smith',
    name: 'Malcolm Smith',
    jersey_number: 53,
    position: 'Linebacker',
    image_url: null,
    stats: { 'Tackles': '10', 'INT': '1', 'INT TD': '1' },
    bio: 'Super Bowl XLVIII MVP',
    super_bowl_highlight: 'Super Bowl XLVIII MVP with pick-six',
    trivia: ['Returned interception 69 yards for TD', 'Also recovered a fumble'],
    display_order: 33,
    is_active: false,
  },
  {
    id: 'sbxlviii-earl-thomas',
    name: 'Earl Thomas',
    jersey_number: 29,
    position: 'Safety',
    image_url: null,
    stats: { 'Tackles': '5', 'Pass Def': '2', 'Pro Bowls': '7' },
    bio: 'Legion of Boom - Elite Free Safety',
    super_bowl_highlight: 'Legion of Boom leader, 2 interceptions in playoffs',
    trivia: ['3-time First-Team All-Pro', 'Fastest safety in LOB'],
    display_order: 34,
    is_active: false,
  },
  {
    id: 'sbxlviii-kam-chancellor',
    name: 'Kam Chancellor',
    jersey_number: 31,
    position: 'Safety',
    image_url: null,
    stats: { 'Tackles': '7', 'FF': '1', 'Pass Def': '1' },
    bio: 'Legion of Boom - The Enforcer',
    super_bowl_highlight: 'Devastating hits and forced fumbles',
    trivia: ['Known as Bam Bam Kam', '4-time Pro Bowl selection'],
    display_order: 35,
    is_active: false,
  },
  // 2025 Seahawks
  {
    id: '2025-sam-darnold',
    name: 'Sam Darnold',
    jersey_number: 14,
    position: 'Quarterback',
    image_url: 'https://a.espncdn.com/i/headshots/nfl/players/full/3912547.png',
    stats: { 'Pass Yds': '4,048', 'Pass TD': '25', 'Rating': '99.1' },
    bio: 'Seahawks QB - 2025 Season - Super Bowl LX',
    super_bowl_highlight: 'Leading Seahawks to Super Bowl LX appearance',
    trivia: ['Led Seahawks to 14-3 record', 'Signed after 2024 season in Minnesota'],
    display_order: 1,
    is_active: true,
  },
  {
    id: '2025-jaxon-smith-njigba',
    name: 'Jaxon Smith-Njigba',
    jersey_number: 11,
    position: 'Wide Receiver',
    image_url: 'https://a.espncdn.com/i/headshots/nfl/players/full/4430878.png',
    stats: { 'Rec': '119', 'Rec Yds': '1,793', 'Rec TD': '10' },
    bio: 'Seahawks WR - 2025 NFL Receiving Leader',
    super_bowl_highlight: 'NFL receiving yards leader heading into Super Bowl LX',
    trivia: ['Led NFL in receiving yards with 1,793', 'Set Seahawks franchise record'],
    display_order: 2,
    is_active: true,
  },
  {
    id: '2025-kenneth-walker-iii',
    name: 'Kenneth Walker III',
    jersey_number: 9,
    position: 'Running Back',
    image_url: 'https://a.espncdn.com/i/headshots/nfl/players/full/4567048.png',
    stats: { 'Rush Yds': '1,027', 'Rush TD': '5', 'Yds/Carry': '4.6' },
    bio: 'Seahawks RB - 2025 Workhorse Back',
    super_bowl_highlight: '4 rushing TDs in final two playoff games',
    trivia: ['Rushed for over 1,000 yards in 2025', 'Career-high 1,309 scrimmage yards'],
    display_order: 3,
    is_active: true,
  },
  {
    id: '2025-devon-witherspoon',
    name: 'Devon Witherspoon',
    jersey_number: 21,
    position: 'Cornerback',
    image_url: 'https://a.espncdn.com/i/headshots/nfl/players/full/4429013.png',
    stats: { 'Tackles': '54', 'INT': '1', 'Pressures': '10' },
    bio: 'Seahawks CB - 2025 Pro Bowl',
    super_bowl_highlight: 'Shutdown corner for league-leading defense',
    trivia: ['2025 Pro Bowl selection', 'Led all CBs with 10 pressures'],
    display_order: 4,
    is_active: true,
  },
  // Hall of Fame Legends
  {
    id: 'hof-steve-largent',
    name: 'Steve Largent',
    jersey_number: 80,
    position: 'Wide Receiver',
    image_url: 'https://www.profootballhof.com/pfhof/media/Default/Items/Largent_Steve_HS_150.jpg',
    stats: { 'HOF Class': '1995', 'Career Rec': '819', 'Career TD': '100' },
    bio: 'Seahawks Legend - Hall of Fame (1995)',
    super_bowl_highlight: 'Franchise icon before Super Bowl era',
    trivia: ['First Seahawk in Hall of Fame', 'Played 14 years with Seattle'],
    display_order: 50,
    is_active: false,
  },
  {
    id: 'hof-walter-jones',
    name: 'Walter Jones',
    jersey_number: 71,
    position: 'Offensive Tackle',
    image_url: 'https://www.profootballhof.com/pfhof/media/Default/Items/Jones_Walter_HS-Capsule.jpg',
    stats: { 'HOF Class': '2014', 'Pro Bowls': '9', 'All-Pro': '4x' },
    bio: 'Seahawks Legend - Hall of Fame (2014)',
    super_bowl_highlight: 'Protected QBs for 13 seasons',
    trivia: ['One of greatest LTs ever', 'Only 23 sacks allowed in career'],
    display_order: 51,
    is_active: false,
  },
  {
    id: 'hof-cortez-kennedy',
    name: 'Cortez Kennedy',
    jersey_number: 96,
    position: 'Defensive Tackle',
    image_url: 'https://www.profootballhof.com/pfhof/media/Default/Items/Kennedy_Cortez_Action_Bio.jpg',
    stats: { 'HOF Class': '2012', 'Pro Bowls': '8', 'Sacks': '58' },
    bio: 'Seahawks Legend - Hall of Fame (2012)',
    super_bowl_highlight: 'Franchise defensive star',
    trivia: ['1992 NFL Defensive Player of the Year', '8-time Pro Bowl selection'],
    display_order: 52,
    is_active: false,
  },
  // Legion of Boom
  {
    id: 'lob-richard-sherman',
    name: 'Richard Sherman',
    jersey_number: 25,
    position: 'Cornerback',
    image_url: null,
    stats: { 'INT': '32', 'Pro Bowls': '5', 'All-Pro': '3x' },
    bio: 'Legion of Boom - All-Pro Cornerback',
    super_bowl_highlight: 'NFC Championship tip that sealed Super Bowl berth',
    trivia: ['Led NFL in interceptions in 2013', 'Stanford graduate with 3.9 GPA', 'Famous post-game interview after NFC Championship'],
    display_order: 40,
    is_active: false,
  },
  {
    id: 'lob-earl-thomas',
    name: 'Earl Thomas',
    jersey_number: 29,
    position: 'Free Safety',
    image_url: null,
    stats: { 'INT': '28', 'Pro Bowls': '7', 'All-Pro': '3x' },
    bio: 'Legion of Boom - Elite Free Safety',
    super_bowl_highlight: 'Patrolled the deep middle, 2 playoff interceptions',
    trivia: ['7-time Pro Bowl selection', 'Fastest player in the LOB', 'Known for elite ball-hawking skills'],
    display_order: 41,
    is_active: false,
  },
  {
    id: 'lob-kam-chancellor',
    name: 'Kam Chancellor',
    jersey_number: 31,
    position: 'Strong Safety',
    image_url: null,
    stats: { 'Tackles': '607', 'Pro Bowls': '4', 'FF': '7' },
    bio: 'Legion of Boom - The Enforcer',
    super_bowl_highlight: 'Devastating hits that set the tone for the defense',
    trivia: ['Known as Bam Bam Kam', 'Most feared hitter in the NFL', 'Career ended due to neck injury in 2017'],
    display_order: 42,
    is_active: false,
  },
  {
    id: 'lob-byron-maxwell',
    name: 'Byron Maxwell',
    jersey_number: 41,
    position: 'Cornerback',
    image_url: null,
    stats: { 'INT': '7', 'Pass Def': '39', 'Tackles': '175' },
    bio: 'Legion of Boom - Lockdown Corner',
    super_bowl_highlight: 'Shut down receivers opposite Sherman',
    trivia: ['Started opposite Richard Sherman', 'Key part of #1 ranked defense', 'Earned big contract after 2014 season'],
    display_order: 43,
    is_active: false,
  },
]

// Filter players by category using display_order ranges and is_active flag
// Database structure:
// - 2025 Seahawks: is_active = true, display_order 1-10
// - Super Bowl XLVIII Heroes: is_active = false, display_order 30-39
// - Legion of Boom: is_active = false, display_order 40-49
// - Hall of Fame: is_active = false, display_order 50-59
function filterByCategory(players: Player[], category: PlayerCategory): Player[] {
  switch (category) {
    case 'sb48':
      return players.filter(p => !p.is_active && p.display_order >= 30 && p.display_order < 40)
    case '2025-hawks':
      return players.filter(p => p.is_active === true)
    case 'lob':
      return players.filter(p => !p.is_active && p.display_order >= 40 && p.display_order < 50)
    case 'hof':
      return players.filter(p => !p.is_active && p.display_order >= 50 && p.display_order < 60)
    case 'all':
    default:
      return players
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const position = searchParams.get('position')
    const category = (searchParams.get('category') || 'sb48') as PlayerCategory

    const supabase = getSupabase()

    // Demo mode
    if (!supabase) {
      let players = filterByCategory([...DEMO_PLAYERS], category)

      if (position && position !== 'all') {
        players = players.filter(p =>
          p.position.toLowerCase().includes(position.toLowerCase())
        )
      }

      // Sort by display_order
      players.sort((a, b) => a.display_order - b.display_order)

      return NextResponse.json({
        players,
        total: players.length,
        category,
      })
    }

    // Build query - get all players (we'll filter by category)
    let query = supabase
      .from('players')
      .select('*')
      .order('display_order', { ascending: true })

    if (position && position !== 'all') {
      query = query.ilike('position', `%${position}%`)
    }

    const { data: allPlayers, error } = await query

    if (error) {
      console.error('Players fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch players' },
        { status: 500 }
      )
    }

    // Filter by category
    const players = filterByCategory(allPlayers || [], category)

    return NextResponse.json({
      players,
      total: players.length,
      category,
    })

  } catch (error) {
    console.error('Players error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
