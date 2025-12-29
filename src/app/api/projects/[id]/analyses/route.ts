import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

// ===========================================
// Schemas
// ===========================================

const CreateAnalysisSchema = z.object({
  type: z.enum(['code', 'business', 'competitor', 'full']),
  result: z.record(z.unknown()),
  metadata: z.record(z.unknown()).optional(),
});

// ===========================================
// GET - List analyses for a project
// ===========================================

export async function GET(
  _request: NextRequest,
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

  // Get analyses
  const { data: analyses, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching analyses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analyses' },
      { status: 500 }
    );
  }

  return NextResponse.json({ analyses });
}

// ===========================================
// POST - Create new analysis for a project
// ===========================================

export async function POST(
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
    .select('id, repo_url')
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
    const parseResult = CreateAnalysisSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { type, result, metadata } = parseResult.data;

    // Create analysis
    const { data: analysis, error: createError } = await supabase
      .from('analyses')
      .insert({
        project_id: id,
        type,
        result: result as Json,
        metadata: (metadata || null) as Json | null,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating analysis:', createError);
      return NextResponse.json(
        { error: 'Failed to create analysis' },
        { status: 500 }
      );
    }

    // If the analysis has tasks, create them in the tasks table
    const resultData = result as { analysis?: { tasks?: Array<{
      title: string;
      description: string;
      priority: string;
      category?: string;
      estimated_minutes?: number;
    }> } };

    if (resultData.analysis?.tasks && resultData.analysis.tasks.length > 0) {
      const tasksToInsert = resultData.analysis.tasks.map(task => ({
        project_id: id,
        analysis_id: analysis.id,
        title: task.title,
        description: task.description || null,
        priority: task.priority as 'critical' | 'high' | 'medium' | 'low',
        status: 'pending' as const,
      }));

      const { error: tasksError } = await supabase
        .from('tasks')
        .insert(tasksToInsert);

      if (tasksError) {
        console.error('Error creating tasks:', tasksError);
        // Don't fail the whole request, just log the error
      }
    }

    return NextResponse.json({ analysis }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
