import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB, tagDB, todoTagDB } from '@/lib/db';
import { getSingaporeNow } from '@/lib/timezone';

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

  return NextResponse.json(todo);
}

export async function PUT(request: NextRequest, { params }: { params: RouteParams }) {
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
    
    // If marking as completed and it's a recurring todo, create next instance
    if (data.completed === true && todo.is_recurring && !todo.completed && todo.recurrence_pattern) {
      // Calculate next due date based on recurrence pattern
      let nextDueDate: string | null = null;
      if (todo.due_date) {
        const currentDue = new Date(todo.due_date);
        const nextDue = new Date(currentDue);

        switch (todo.recurrence_pattern) {
          case 'daily':
            nextDue.setDate(nextDue.getDate() + 1);
            break;
          case 'weekly':
            nextDue.setDate(nextDue.getDate() + 7);
            break;
          case 'monthly':
            nextDue.setMonth(nextDue.getMonth() + 1);
            break;
          case 'yearly':
            nextDue.setFullYear(nextDue.getFullYear() + 1);
            break;
        }

        nextDueDate = nextDue.toISOString();
      }

      // Get tags for this todo
      const tags = todoTagDB.getTagsForTodo(Number(id));

      // Create next instance
      const nextTodo = todoDB.create({
        user_id: session.userId,
        title: todo.title,
        priority: todo.priority,
        due_date: nextDueDate,
        is_recurring: true,
        recurrence_pattern: todo.recurrence_pattern,
        reminder_minutes: todo.reminder_minutes,
      });

      // Copy tags to next instance
      for (const tag of tags) {
        todoTagDB.add(nextTodo.id, tag.id);
      }
    }

    // Update the current todo
    todoDB.update(Number(id), data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update todo error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: RouteParams }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const todo = todoDB.getById(Number(id));

  if (!todo || todo.user_id !== session.userId) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
  }

  todoDB.delete(Number(id));
  return NextResponse.json({ success: true });
}
