import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { logServer, logServerError } from '@/lib/error-tracking/server-logger';

// GET /api/squares/audit?game_id=xxx - Get audit log for a game
export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get('game_id');

  if (!gameId) {
    return NextResponse.json({ error: 'game_id is required' }, { status: 400 });
  }

  const { data: logs, error } = await supabase
    .from('squares_audit_log')
    .select('*')
    .eq('game_id', gameId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    logServerError('squares-audit', 'fetch_audit_log_failed', error, { gameId });
    return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 });
  }

  return NextResponse.json({ logs: logs || [] });
}

// POST /api/squares/audit - Create an audit log entry
export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { game_id, action, details, performed_by } = body;

    if (!game_id || !action || !performed_by) {
      return NextResponse.json({ error: 'game_id, action, and performed_by are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('squares_audit_log')
      .insert({
        game_id,
        action,
        details: details || {},
        performed_by,
      })
      .select()
      .single();

    if (error) {
      logServerError('squares-audit', 'create_audit_log_failed', error, { gameId: game_id, action });
      return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 });
    }

    logServer({ level: 'info', component: 'squares-audit', event: 'audit_log_created', data: { gameId: game_id, action, performedBy: performed_by } });

    return NextResponse.json({ log: data }, { status: 201 });
  } catch (err) {
    logServerError('squares-audit', 'audit_log_error', err);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
