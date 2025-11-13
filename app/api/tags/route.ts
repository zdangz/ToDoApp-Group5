import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { tagDB } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const tags = tagDB.listByUserId(session.userId);
  return NextResponse.json(tags);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const data = await request.json();
    
    if (!data.name || !data.name.trim()) {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }

    if (!data.color || !data.color.trim()) {
      return NextResponse.json({ error: 'Tag color is required' }, { status: 400 });
    }

    // Check for duplicate tag name
    const existingTags = tagDB.listByUserId(session.userId);
    if (existingTags.some(t => t.name.toLowerCase() === data.name.trim().toLowerCase())) {
      return NextResponse.json({ error: 'Tag name already exists' }, { status: 400 });
    }

    const tag = tagDB.create(session.userId, data.name.trim(), data.color.trim());
    return NextResponse.json(tag);
  } catch (error) {
    console.error('Create tag error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
