import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB, subtaskDB, tagDB, todoTagDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Get all todos for the user
    const todos = todoDB.listByUserId(session.userId);
    
    // Get all tags for the user
    const tags = tagDB.listByUserId(session.userId);
    
    // Get subtasks and tag associations for each todo
    const todosWithRelations = todos.map(todo => {
      const subtasks = subtaskDB.listByTodoId(todo.id);
      const todoTags = todoTagDB.getTagsForTodo(todo.id);
      
      return {
        ...todo,
        subtasks,
        tag_ids: todoTags.map(t => t.id),
      };
    });

    // Create export format
    const exportData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      user_id: session.userId,
      todos: todosWithRelations,
      tags: tags,
    };

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
