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
  const [username, setUsername] = useState('');

  useEffect(() => {
    fetchTodos();
    checkAuth();
  }, []);

  async function checkAuth() {
    const res = await fetch('/api/auth/me');
    if (!res.ok) {
      router.push('/login');
    } else {
      const data = await res.json();
      setUsername(data.username);
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
    // Optimistic update
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !completed } : t));

    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      });

      if (!res.ok) {
        // Revert on failure
        setTodos(todos.map(t => t.id === id ? { ...t, completed: completed } : t));
        console.error('Failed to update todo');
      }
    } catch (error) {
      // Revert on error
      setTodos(todos.map(t => t.id === id ? { ...t, completed: completed } : t));
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">Todo App</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome, {username}!</p>
          </div>
          <button
            onClick={logout}
            className="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Add Todo Form */}
        <form onSubmit={addTodo} className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
          <div className="flex gap-4 flex-wrap">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="flex-1 min-w-[200px] px-4 py-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm hover:shadow-md"
            >
              Add Task
            </button>
          </div>
        </form>

        {/* Active Todos */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Active Tasks ({activeTodos.length})</h2>
          <div className="space-y-3">
            {activeTodos.map((todo) => (
              <div
                key={todo.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700 flex items-center gap-4"
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id, todo.completed)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${priorityColors[todo.priority as keyof typeof priorityColors]}`} />
                    <span className="font-medium text-gray-800 dark:text-gray-100">{todo.title}</span>
                  </div>
                  {todo.due_date && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Due: {new Date(todo.due_date).toLocaleString()}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors"
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
            <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Completed Tasks ({completedTodos.length})</h2>
            <div className="space-y-3">
              {completedTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 opacity-70"
                >
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id, todo.completed)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="line-through text-gray-600 dark:text-gray-400">{todo.title}</span>
                  </div>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors"
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
