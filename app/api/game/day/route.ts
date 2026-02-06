import { NextResponse } from 'next/server'
import { createSupabaseAdminClient, isDemoMode } from '@/lib/supabase'
import { dayIdentifierToNumber } from '@/lib/category-data'

export async function GET() {
  try {
    if (isDemoMode()) {
      return NextResponse.json({ current_day: 1, day_identifier: 'day_minus_4' })
    }

    const supabase = createSupabaseAdminClient()
    if (!supabase) {
      return NextResponse.json({ current_day: 1, day_identifier: 'day_minus_4' })
    }

    const { data: settings, error } = await supabase
      .from('game_settings')
      .select('current_day')
      .eq('id', 1)
      .single()

    if (error || !settings) {
      return NextResponse.json({ current_day: 1, day_identifier: 'day_minus_4' })
    }

    return NextResponse.json({
      current_day: dayIdentifierToNumber(settings.current_day),
      day_identifier: settings.current_day,
    })
  } catch {
    return NextResponse.json({ current_day: 1, day_identifier: 'day_minus_4' })
  }
}
