import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// ===========================================
// Schemas
// ===========================================

const UpdateTaskSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'skipped']).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  due_date: z.string().datetime().nullable().optional(),
});

// ===========================================
// PATCH - Update task status
// ===========================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const supabase = await createClient();
  const { id, taskId } = await params;

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Verify project ownership and task belongs to project
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id, project_id, projects!inner(user_id)')
    .eq('id', taskId)
    .eq('project_id', id)
    .single();

  if (taskError || !task) {
    return NextResponse.json(
      { error: 'Task not found' },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const parseResult = UpdateTaskSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const updates = parseResult.data;

    // Update task
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating task:', updateError);
      return NextResponse.json(
        { error: 'Failed to update task' },
        { status: 500 }
      );
    }

    return NextResponse.json({ task: updatedTask });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

// ===========================================
// DELETE - Delete a task
// ===========================================

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const supabase = await createClient();
  const { id, taskId } = await params;

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Verify project ownership and task belongs to project
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id, project_id, projects!inner(user_id)')
    .eq('id', taskId)
    .eq('project_id', id)
    .single();

  if (taskError || !task) {
    return NextResponse.json(
      { error: 'Task not found' },
      { status: 404 }
    );
  }

  // Delete task
  const { error: deleteError } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (deleteError) {
    console.error('Error deleting task:', deleteError);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
