import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

/**
 * GET /api/squares/settlements/claims?game_id=xxx
 * Lists all identity claims for a game.
 */
export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const gameId = new URL(request.url).searchParams.get('game_id');
  if (!gameId) {
    return NextResponse.json({ error: 'game_id is required' }, { status: 400 });
  }

  const { data: claims, error } = await supabase
    .from('settlement_claims')
    .select('*')
    .eq('game_id', gameId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ claims: claims || [] });
}

/**
 * POST /api/squares/settlements/claims
 * Submit an identity claim: "I am this squares player, here's my WhatsApp name"
 *
 * Body: {
 *   game_id: string,
 *   squares_player_name: string,  // which squares player they're claiming to be
 *   whatsapp_name: string,        // their WhatsApp display name
 *   app_user_id?: string,         // HawkTrivia user_id if logged in
 *   app_username?: string,        // HawkTrivia username if logged in
 * }
 */
export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const body = await request.json();
  const { game_id, squares_player_name, whatsapp_name, app_user_id, app_username } = body;

  if (!game_id || !squares_player_name || !whatsapp_name) {
    return NextResponse.json(
      { error: 'game_id, squares_player_name, and whatsapp_name are required' },
      { status: 400 }
    );
  }

  // Verify the game exists
  const { data: game } = await supabase
    .from('squares_games')
    .select('id')
    .eq('id', game_id)
    .single();

  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  // Verify the squares player name actually exists in the game
  const { data: entries } = await supabase
    .from('squares_entries')
    .select('id')
    .eq('game_id', game_id)
    .eq('player_name', squares_player_name);

  if (!entries || entries.length === 0) {
    return NextResponse.json(
      { error: `No squares found for player "${squares_player_name}" in this game` },
      { status: 400 }
    );
  }

  // Upsert the claim (update if they already claimed this name)
  const { data: claim, error } = await supabase
    .from('settlement_claims')
    .upsert(
      {
        game_id,
        squares_player_name,
        whatsapp_name: whatsapp_name.trim(),
        app_user_id: app_user_id || null,
        app_username: app_username || null,
        squares_count: entries.length,
        status: 'pending',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'game_id,squares_player_name' }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ claim });
}
