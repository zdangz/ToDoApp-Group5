'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [todos, setTodos] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodos();
    checkAuth();
  }, []);

  async function checkAuth() {
    const res = await fetch('/api/auth/me');
    if (!res.ok) {
      router.push('/login');
    }
  }

  async function fetchTodos() {
    try {
      const res = await fetch('/api/todos');
      if (res.ok) {
        const data = await res.json();
        setTodos(data);
      }
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          priority,
          due_date: dueDate || null,
        }),
      });

      if (res.ok) {
        setTitle('');
        setDueDate('');
        fetchTodos();
      }
    } catch (error) {
      console.error('Failed to add todo:', error);
    }
  }

  async function toggleTodo(id: number, completed: boolean) {
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      });

      if (res.ok) {
        fetchTodos();
      }
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  }

  async function deleteTodo(id: number) {
    if (!confirm('Delete this todo?')) return;

    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchTodos();
      }
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const priorityColors = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-blue-500',
  };

  const activeTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Todo App</h1>
          <button
            onClick={logout}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Logout
          </button>
        </div>

        {/* Add Todo Form */}
        <form onSubmit={addTodo} className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex gap-4 flex-wrap">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="flex-1 min-w-[200px] px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add
            </button>
          </div>
        </form>

        {/* Active Todos */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Active ({activeTodos.length})</h2>
          <div className="space-y-2">
            {activeTodos.map((todo) => (
              <div
                key={todo.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center gap-4"
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id, todo.completed)}
                  className="w-5 h-5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${priorityColors[todo.priority as keyof typeof priorityColors]}`} />
                    <span>{todo.title}</span>
                  </div>
                  {todo.due_date && (
                    <span className="text-sm text-gray-500">
                      Due: {new Date(todo.due_date).toLocaleString()}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="px-3 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Completed Todos */}
        {completedTodos.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Completed ({completedTodos.length})</h2>
            <div className="space-y-2">
              {completedTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center gap-4 opacity-60"
                >
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id, todo.completed)}
                    className="w-5 h-5"
                  />
                  <div className="flex-1">
                    <span className="line-through">{todo.title}</span>
                  </div>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="px-3 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
