import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { subtaskDB, todoDB } from '@/lib/db';

type RouteParams = Promise<{ id: string }>;

export async function PUT(request: NextRequest, { params }: { params: RouteParams }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const subtask = subtaskDB.getById(Number(id));

  if (!subtask) {
    return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
  }

  // Verify ownership through todo
  const todo = todoDB.getById(subtask.todo_id);
  if (!todo || todo.user_id !== session.userId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  try {
    const data = await request.json();
    
    // Convert boolean completed to 0/1 for SQLite
    if ('completed' in data && typeof data.completed === 'boolean') {
      data.completed = data.completed ? 1 : 0;
    }
    
    subtaskDB.update(Number(id), data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update subtask error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: RouteParams }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const subtask = subtaskDB.getById(Number(id));

  if (!subtask) {
    return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
  }

  // Verify ownership through todo
  const todo = todoDB.getById(subtask.todo_id);
  if (!todo || todo.user_id !== session.userId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  subtaskDB.delete(Number(id));
  return NextResponse.json({ success: true });
}
