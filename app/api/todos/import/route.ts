import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB, subtaskDB, tagDB, todoTagDB } from '@/lib/db';

interface ImportData {
  version: string;
  todos: any[];
  tags: any[];
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const data: ImportData = await request.json();

    // Validate format
    if (!data.version || !Array.isArray(data.todos) || !Array.isArray(data.tags)) {
      return NextResponse.json(
        { error: 'Invalid import format. Required fields: version, todos, tags' },
        { status: 400 }
      );
    }

    // Validate version
    if (data.version !== '1.0') {
      return NextResponse.json(
        { error: `Unsupported version: ${data.version}. Expected: 1.0` },
        { status: 400 }
      );
    }

    // Map old tag IDs to new tag IDs (reuse existing tags with same name)
    const tagIdMap = new Map<number, number>();
    const existingTags = tagDB.listByUserId(session.userId);
    
    for (const importTag of data.tags) {
      // Check if tag with same name already exists
      const existingTag = existingTags.find(t => t.name === importTag.name);
      
      if (existingTag) {
        // Reuse existing tag
        tagIdMap.set(importTag.id, existingTag.id);
      } else {
        // Create new tag
        const newTag = tagDB.create(
          session.userId,
          importTag.name,
          importTag.color || '#3b82f6'
        );
        tagIdMap.set(importTag.id, newTag.id);
      }
    }

    // Map old todo IDs to new todo IDs
    const todoIdMap = new Map<number, number>();
    let importedTodosCount = 0;
    let importedSubtasksCount = 0;

    for (const importTodo of data.todos) {
      // Validate required fields
      if (!importTodo.title) {
        return NextResponse.json(
          { error: 'Invalid todo: title is required' },
          { status: 400 }
        );
      }

      // Create new todo
      const newTodo = todoDB.create({
        user_id: session.userId,
        title: importTodo.title,
        priority: importTodo.priority || 'medium',
        due_date: importTodo.due_date || null,
        is_recurring: importTodo.is_recurring ? 1 : 0,
        recurrence_pattern: importTodo.recurrence_pattern || null,
        reminder_minutes: importTodo.reminder_minutes || null,
      });

      todoIdMap.set(importTodo.id, newTodo.id);
      importedTodosCount++;

      // Import subtasks
      if (importTodo.subtasks && Array.isArray(importTodo.subtasks)) {
        for (const subtask of importTodo.subtasks) {
          subtaskDB.create(newTodo.id, subtask.title, subtask.position || 0);
          importedSubtasksCount++;
        }
      }

      // Import tag associations
      if (importTodo.tag_ids && Array.isArray(importTodo.tag_ids)) {
        for (const oldTagId of importTodo.tag_ids) {
          const newTagId = tagIdMap.get(oldTagId);
          if (newTagId) {
            try {
              todoTagDB.add(newTodo.id, newTagId);
            } catch (error) {
              // Ignore duplicate tag associations
              console.warn(`Tag association already exists: todo ${newTodo.id}, tag ${newTagId}`);
            }
          }
        }
      }

      // Set completed status if needed
      if (importTodo.completed) {
        todoDB.update(newTodo.id, { completed: 1 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Import successful',
      counts: {
        todos: importedTodosCount,
        subtasks: importedSubtasksCount,
        tags: tagIdMap.size,
      },
    });
  } catch (error) {
    console.error('Import error:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON format' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Import failed: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
