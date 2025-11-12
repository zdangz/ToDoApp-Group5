import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const todos = todoDB.listByUserId(session.userId);
  return NextResponse.json(todos);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const data = await request.json();
    
    if (!data.title || !data.title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const todo = todoDB.create({
      user_id: session.userId,
      title: data.title.trim(),
      priority: data.priority || 'medium',
      due_date: data.due_date || null,
      is_recurring: data.is_recurring || false,
      recurrence_pattern: data.recurrence_pattern || null,
      reminder_minutes: data.reminder_minutes || null,
    });

    return NextResponse.json(todo);
  } catch (error) {
    console.error('Create todo error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
