import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB, tagDB, todoTagDB } from '@/lib/db';

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

  const tags = todoTagDB.getTagsForTodo(Number(id));
  return NextResponse.json(tags);
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

    if (!data.tag_id) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
    }

    // Verify tag belongs to user
    const tag = tagDB.getById(data.tag_id);
    if (!tag || tag.user_id !== session.userId) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    todoTagDB.add(Number(id), data.tag_id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Add tag to todo error:', error);
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

  try {
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('tag_id');

    if (!tagId) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
    }

    // Verify tag belongs to user
    const tag = tagDB.getById(Number(tagId));
    if (!tag || tag.user_id !== session.userId) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    todoTagDB.remove(Number(id), Number(tagId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove tag from todo error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
