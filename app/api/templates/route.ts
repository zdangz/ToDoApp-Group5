import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { templateDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  const templates = category
    ? templateDB.listByCategory(session.userId, category)
    : templateDB.listByUserId(session.userId);

  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const data = await request.json();

    if (!data.name || !data.name.trim()) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
    }

    if (!data.todo_data) {
      return NextResponse.json({ error: 'Todo data is required' }, { status: 400 });
    }

    const template = templateDB.create(
      session.userId,
      data.name.trim(),
      JSON.stringify(data.todo_data),
      data.subtasks_data ? JSON.stringify(data.subtasks_data) : null,
      data.description,
      data.category
    );

    return NextResponse.json(template);
  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
