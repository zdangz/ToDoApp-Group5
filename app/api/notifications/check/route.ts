import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB } from '@/lib/db';
import { getSingaporeNow } from '@/lib/timezone';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const todos = todoDB.listByUserId(session.userId);
    const now = getSingaporeNow();
    const currentTime = now.getTime();

    // Filter todos that need notifications
    const todosNeedingNotification = todos.filter(todo => {
      // Skip if no reminder set
      if (!todo.reminder_minutes || !todo.due_date) return false;
      
      // Skip if already completed
      if (todo.completed) return false;

      // Parse due date
      const dueDate = new Date(todo.due_date);
      const reminderTime = dueDate.getTime() - (todo.reminder_minutes * 60 * 1000);

      // Check if it's time to notify (within the next minute to account for polling interval)
      const shouldNotify = currentTime >= reminderTime && currentTime <= (reminderTime + 60000);

      // Check if we haven't already sent a notification
      if (todo.last_notification_sent) {
        const lastSent = new Date(todo.last_notification_sent).getTime();
        // Don't send again if we sent within the last hour
        if (currentTime - lastSent < 3600000) {
          return false;
        }
      }

      return shouldNotify;
    });

    return NextResponse.json({ todos: todosNeedingNotification });
  } catch (error) {
    console.error('Error checking notifications:', error);
    return NextResponse.json({ error: 'Failed to check notifications' }, { status: 500 });
  }
}
