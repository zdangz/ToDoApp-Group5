import { useEffect, useRef } from 'react';

interface Todo {
  id: number;
  title: string;
  due_date: string | null;
  reminder_minutes: number | null;
  completed: boolean;
}

export function useNotifications(enabled: boolean, onTodosChange?: () => void) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission !== 'granted') {
      return;
    }

    // Function to check for notifications
    const checkNotifications = async () => {
      try {
        const res = await fetch('/api/notifications/check');
        if (!res.ok) return;

        const data = await res.json();
        const { todos } = data;

        if (todos && todos.length > 0) {
          for (const todo of todos) {
            // Show browser notification
            const notification = new Notification('Todo Reminder', {
              body: `${todo.title}${todo.due_date ? ` - Due: ${new Date(todo.due_date).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })}` : ''}`,
              icon: '/favicon.ico',
              tag: `todo-${todo.id}`, // Prevent duplicate notifications
              requireInteraction: false,
            });

            // Update last notification sent timestamp
            await fetch(`/api/todos/${todo.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                last_notification_sent: new Date().toISOString(),
              }),
            });

            // Close notification after 10 seconds
            setTimeout(() => notification.close(), 10000);
          }

          // Refresh todos list if callback provided
          if (onTodosChange) {
            onTodosChange();
          }
        }
      } catch (error) {
        console.error('Error checking notifications:', error);
      }
    };

    // Check immediately
    checkNotifications();

    // Set up polling every 30 seconds
    intervalRef.current = setInterval(checkNotifications, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, onTodosChange]);
}
