import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { tagDB } from '@/lib/db';

type RouteParams = Promise<{ id: string }>;

export async function GET(request: NextRequest, { params }: { params: RouteParams }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const tag = tagDB.getById(Number(id));

  if (!tag || tag.user_id !== session.userId) {
    return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
  }

  return NextResponse.json(tag);
}

export async function PUT(request: NextRequest, { params }: { params: RouteParams }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const tag = tagDB.getById(Number(id));

  if (!tag || tag.user_id !== session.userId) {
    return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
  }

  try {
    const data = await request.json();
    
    // Check for duplicate tag name (excluding current tag)
    if (data.name) {
      const existingTags = tagDB.listByUserId(session.userId);
      if (existingTags.some(t => t.id !== Number(id) && t.name.toLowerCase() === data.name.trim().toLowerCase())) {
        return NextResponse.json({ error: 'Tag name already exists' }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.color !== undefined) updateData.color = data.color.trim();

    tagDB.update(Number(id), updateData);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update tag error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: RouteParams }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const tag = tagDB.getById(Number(id));

  if (!tag || tag.user_id !== session.userId) {
    return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
  }

  try {
    tagDB.delete(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete tag error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
