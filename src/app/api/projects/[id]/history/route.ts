import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ===========================================
// Types for History API
// ===========================================

interface HistoryEntry {
  id: string;
  version: number | null;
  type: 'code' | 'business' | 'competitor' | 'full';
  created_at: string;
  alignment_score: number | null;
  summary: string | null;
  label: string | null;
  metadata: Record<string, unknown> | null;
}

interface HistoryResponse {
  history: HistoryEntry[];
  total: number;
}

interface CompareResponse {
  version1: {
    id: string;
    version: number | null;
    type: string;
    created_at: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result: any;
    alignment_score: number | null;
    summary: string | null;
    label: string | null;
  } | null;
  version2: {
    id: string;
    version: number | null;
    type: string;
    created_at: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result: any;
    alignment_score: number | null;
    summary: string | null;
    label: string | null;
  } | null;
}

// ===========================================
// GET - Get analysis history for timeline or compare two versions
// ===========================================
// Query params:
//   - compare=v1,v2  : Return full data for two versions for comparison
//   - type=full|code|business|competitor : Filter by analysis type
//   - limit=10 : Limit number of results
//   - offset=0 : Pagination offset

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Verify project ownership
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', id)
    .single();

  if (projectError || !project) {
    return NextResponse.json(
      { error: 'Project not found' },
      { status: 404 }
    );
  }

  // Check if comparing two versions
  const compare = searchParams.get('compare');
  if (compare) {
    const versions = compare.split(',').map(v => parseInt(v.trim(), 10));
    if (versions.length !== 2 || versions.some(isNaN)) {
      return NextResponse.json(
        { error: 'Invalid compare parameter. Use: compare=v1,v2' },
        { status: 400 }
      );
    }

    // Fetch both versions with full data
    const { data: analyses, error } = await supabase
      .from('analyses')
      .select('id, version, type, created_at, result, alignment_score, summary, label')
      .eq('project_id', id)
      .in('version', versions)
      .order('version', { ascending: true });

    if (error) {
      console.error('Error fetching versions for compare:', error);
      return NextResponse.json(
        { error: 'Failed to fetch versions' },
        { status: 500 }
      );
    }

    const response: CompareResponse = {
      version1: analyses?.find(a => a.version === versions[0]) || null,
      version2: analyses?.find(a => a.version === versions[1]) || null,
    };

    return NextResponse.json(response);
  }

  // Otherwise, return history list (lightweight, no full results)
  const type = searchParams.get('type');
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  let query = supabase
    .from('analyses')
    .select('id, version, type, created_at, alignment_score, summary, label, metadata', { count: 'exact' })
    .eq('project_id', id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Filter by type if specified
  const validTypes = ['code', 'business', 'competitor', 'full'] as const;
  type AnalysisType = typeof validTypes[number];
  if (type && validTypes.includes(type as AnalysisType)) {
    query = query.eq('type', type as AnalysisType);
  }

  const { data: history, count, error } = await query;

  if (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }

  const response: HistoryResponse = {
    history: (history || []) as HistoryEntry[],
    total: count || 0,
  };

  return NextResponse.json(response);
}

// ===========================================
// PATCH - Update analysis label (for naming versions)
// ===========================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Verify project ownership
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', id)
    .single();

  if (projectError || !project) {
    return NextResponse.json(
      { error: 'Project not found' },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const { analysis_id, label } = body as { analysis_id: string; label: string };

    if (!analysis_id) {
      return NextResponse.json(
        { error: 'analysis_id is required' },
        { status: 400 }
      );
    }

    // Update the label
    const { data: updated, error: updateError } = await supabase
      .from('analyses')
      .update({ label })
      .eq('id', analysis_id)
      .eq('project_id', id)
      .select('id, version, label')
      .single();

    if (updateError) {
      console.error('Error updating label:', updateError);
      return NextResponse.json(
        { error: 'Failed to update label' },
        { status: 500 }
      );
    }

    return NextResponse.json({ analysis: updated });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
