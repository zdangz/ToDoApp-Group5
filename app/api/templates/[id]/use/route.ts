import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { templateDB, todoDB, subtaskDB } from '@/lib/db';
import { getSingaporeNow } from '@/lib/timezone';

type RouteParams = Promise<{ id: string }>;

export async function POST(request: NextRequest, { params }: { params: RouteParams }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const template = templateDB.getById(Number(id));

  if (!template || template.user_id !== session.userId) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  try {
    const data = await request.json();
    const todoData = JSON.parse(template.todo_data);

    // Calculate due date with offset if provided
    let dueDate = null;
    if (data.due_date_offset && todoData.priority) {
      const now = getSingaporeNow();
      now.setDate(now.getDate() + Number(data.due_date_offset));
      dueDate = now.toISOString();
    } else if (data.due_date) {
      dueDate = data.due_date;
    }

    // Create todo from template
    const todo = todoDB.create({
      user_id: session.userId,
      title: todoData.title,
      priority: todoData.priority || 'medium',
      due_date: dueDate,
      is_recurring: todoData.is_recurring || false,
      recurrence_pattern: todoData.recurrence_pattern || null,
      reminder_minutes: todoData.reminder_minutes || null,
    });

    // Create subtasks if template has them
    if (template.subtasks_data) {
      const subtasksData = JSON.parse(template.subtasks_data);
      for (const subtask of subtasksData) {
        subtaskDB.create(todo.id, subtask.title, subtask.position || 0);
      }
    }

    return NextResponse.json(todo);
  } catch (error) {
    console.error('Use template error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
