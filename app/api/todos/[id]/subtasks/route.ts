import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB, subtaskDB } from '@/lib/db';

type RouteParams = Promise<{ id: string }>;

export async function GET(request: NextRequest, { params }: { params: RouteParams }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const todo = todoDB.getById(Number(id));

  if (!todo || todo.user_id !== session.userId) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
  }

  const subtasks = subtaskDB.listByTodoId(Number(id));
  return NextResponse.json(subtasks);
}

export async function POST(request: NextRequest, { params }: { params: RouteParams }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const todo = todoDB.getById(Number(id));

  if (!todo || todo.user_id !== session.userId) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
  }

  try {
    const data = await request.json();
    
    if (!data.title || !data.title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Get current subtasks count for position
    const existingSubtasks = subtaskDB.listByTodoId(Number(id));
    const position = data.position !== undefined ? data.position : existingSubtasks.length;

    const subtask = subtaskDB.create(Number(id), data.title.trim(), position);
    return NextResponse.json(subtask);
  } catch (error) {
    console.error('Create subtask error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
