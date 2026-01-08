import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

// ===========================================
// Schemas
// ===========================================

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(5000).optional(),
  repo_url: z.string().url().optional().nullable(),
});

const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(5000).optional(),
  repo_url: z.string().url().optional().nullable(),
});

// ===========================================
// GET - List user's projects
// ===========================================

export async function GET() {
  const supabase = await createClient();

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Get projects
  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
      id,
      name,
      description,
      repo_url,
      created_at,
      updated_at,
      analyses (
        id,
        type,
        created_at
      )
    `)
    .order('updated_at', { ascending: false });

  if (error) {
    logger.error('Error fetching projects', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }

  return NextResponse.json({ projects });
}

// ===========================================
// POST - Create new project
// ===========================================

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const parseResult = CreateProjectSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, description, repo_url } = parseResult.data;

    // Create project
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name,
        description: description || null,
        repo_url: repo_url || null,
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating project', error);
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      );
    }

    return NextResponse.json({ project }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
