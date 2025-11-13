import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB } from '@/lib/db';
import { getSingaporeNow, parseSingaporeDate, addTime } from '@/lib/timezone';

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

    // Validate due date if provided
    if (data.due_date) {
      const dueDate = new Date(data.due_date);
      const now = getSingaporeNow();
      const minimumDueDate = addTime(now, 1, 'minutes');
      
      if (dueDate < minimumDueDate) {
        return NextResponse.json({ 
          error: 'Due date must be at least 1 minute in the future (Singapore timezone)' 
        }, { status: 400 });
      }
    }

    // Validate recurring todos require due date
    if (data.is_recurring && !data.due_date) {
      return NextResponse.json({ 
        error: 'Recurring todos require a due date' 
      }, { status: 400 });
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
