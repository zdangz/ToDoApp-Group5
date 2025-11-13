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
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDataMenu, setShowDataMenu] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  useEffect(() => {
    fetchTodos();
    checkAuth();

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showDataMenu && !target.closest('.data-menu-container')) {
        setShowDataMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDataMenu]);

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

    console.log('Adding todo with data:', {
      title: title.trim(),
      priority,
      due_date: dueDate || null,
      is_recurring: isRecurring,
      recurrence_pattern: isRecurring ? recurrencePattern : null,
      reminder_minutes: reminderMinutes,
    });

    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          priority,
          due_date: dueDate || null,
          is_recurring: isRecurring,
          recurrence_pattern: isRecurring ? recurrencePattern : null,
          reminder_minutes: reminderMinutes,
        }),
      });

      console.log('Add todo response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('Todo created:', data);
        setTitle('');
        setDueDate('');
        setIsRecurring(false);
        setRecurrencePattern('weekly');
        setReminderMinutes(null);
        fetchTodos();
      } else {
        const errorData = await res.json();
        console.error('Failed to add todo:', res.status, errorData);
        alert('Failed to add todo: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to add todo:', error);
      alert('Error: ' + (error as Error).message);
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
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to update todo:', res.status, errorData);
        // Revert on failure
        setTodos(todos.map(t => t.id === id ? { ...t, completed: completed } : t));
      }
    } catch (error) {
      console.error('Failed to update todo:', error);
      // Revert on error
      setTodos(todos.map(t => t.id === id ? { ...t, completed: completed } : t));
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

  async function exportJSON() {
    try {
      const res = await fetch('/api/todos/export');
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `todos-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShowDataMenu(false);
      } else {
        alert('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed');
    }
  }

  async function exportCSV() {
    try {
      const res = await fetch('/api/todos/export');
      if (res.ok) {
        const data = await res.json();
        
        // Convert to CSV
        let csv = 'Title,Priority,Due Date,Completed,Recurring,Reminder,Tags\n';
        
        for (const todo of data.todos) {
          const tagNames = todo.tag_ids
            .map((tagId: number) => data.tags.find((t: any) => t.id === tagId)?.name)
            .filter(Boolean)
            .join('; ');
          
          const row = [
            `"${todo.title.replace(/"/g, '""')}"`,
            todo.priority,
            todo.due_date || '',
            todo.completed ? 'Yes' : 'No',
            todo.is_recurring ? 'Yes' : 'No',
            todo.reminder_minutes ? `${todo.reminder_minutes} min` : '',
            `"${tagNames}"`
          ];
          
          csv += row.join(',') + '\n';
        }
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `todos-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShowDataMenu(false);
      } else {
        alert('Export failed');
      }
    } catch (error) {
      console.error('Export CSV error:', error);
      alert('Export failed');
    }
  }

  async function handleImportJSON(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError('');
    setImportSuccess('');

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const res = await fetch('/api/todos/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok) {
        setImportSuccess(
          `Import successful! Imported ${result.counts.todos} todos, ${result.counts.subtasks} subtasks, and ${result.counts.tags} tags.`
        );
        setShowDataMenu(false);
        fetchTodos(); // Refresh the todo list
        
        // Clear success message after 5 seconds
        setTimeout(() => setImportSuccess(''), 5000);
      } else {
        setImportError(result.error || 'Import failed');
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        setImportError('Invalid JSON file');
      } else {
        setImportError('Import failed: ' + (error as Error).message);
      }
    }

    // Reset file input
    event.target.value = '';
  }

  const priorityColors = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-blue-500',
  };

  // Filter todos based on search and priority
  const filteredTodos = todos.filter(todo => {
    const matchesSearch = todo.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || todo.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const activeTodos = filteredTodos.filter(t => !t.completed);
  const completedTodos = filteredTodos.filter(t => t.completed);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8" style={{ 
      backgroundColor: '#e8ecf1',
      fontFamily: "'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header with Navigation */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-1" style={{ color: '#1a202c' }}>Todo App</h1>
            <p className="text-base" style={{ color: '#718096' }}>Welcome, {username}</p>
          </div>
          <div className="flex gap-3">
            {/* Data Button with Dropdown */}
            <div className="relative data-menu-container">
              <button 
                onClick={() => setShowDataMenu(!showDataMenu)}
                className="px-4 py-2 bg-white rounded-lg font-medium transition-all hover:shadow-md flex items-center gap-2" 
                style={{ color: '#4a5568' }}
              >
                📊 Data
              </button>
              
              {showDataMenu && (
                <div 
                  className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg py-2 z-10 min-w-[180px]"
                  style={{ border: '1px solid #e2e8f0' }}
                >
                  <button
                    onClick={exportJSON}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                    style={{ color: '#2d3748' }}
                  >
                    Export JSON
                  </button>
                  <button
                    onClick={exportCSV}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                    style={{ color: '#2d3748' }}
                  >
                    Export CSV
                  </button>
                  <label className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors cursor-pointer block" style={{ color: '#2d3748' }}>
                    Import JSON
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportJSON}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            <button 
              onClick={() => router.push('/calendar')}
              className="px-4 py-2 rounded-lg font-medium text-white transition-all hover:shadow-md"
              style={{ backgroundColor: '#9333ea' }}
            >
              📅 Calendar
            </button>
            <button className="px-4 py-2 rounded-lg font-medium text-white transition-all hover:shadow-md" style={{ backgroundColor: '#3b82f6' }}>
              📋 Templates
            </button>
            <button className="px-4 py-2 rounded-lg font-medium text-white transition-all hover:shadow-md" style={{ backgroundColor: '#f97316' }}>
              🔔
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg font-medium text-white transition-all hover:shadow-md"
              style={{ backgroundColor: '#6b7280' }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Import Success/Error Messages */}
        {importSuccess && (
          <div className="mb-6 p-4 rounded-lg flex items-center gap-2" style={{ backgroundColor: '#d1fae5', color: '#065f46' }}>
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            <span>{importSuccess}</span>
          </div>
        )}

        {importError && (
          <div className="mb-6 p-4 rounded-lg flex items-center gap-2" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            <span>{importError}</span>
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Add Todo Form */}
          <form onSubmit={addTodo} className="mb-6">
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a new todo..."
                className="flex-1 px-4 py-2.5 border rounded-lg transition-all"
                style={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  color: '#2d3748'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4285f4';
                  e.target.style.outline = 'none';
                  e.target.style.boxShadow = '0 0 0 3px rgba(66, 133, 244, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="px-4 py-2.5 border rounded-lg font-medium"
                style={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  color: '#2d3748'
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="px-4 py-2.5 border rounded-lg"
                style={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  color: '#2d3748'
                }}
              />
              <button
                type="submit"
                className="px-8 py-2.5 rounded-lg font-medium text-white transition-all hover:shadow-md"
                style={{ backgroundColor: '#3b82f6' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                Add
              </button>
            </div>

            {/* Additional Options */}
            <div className="flex gap-4 items-center text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span style={{ color: '#4a5568' }}>Repeat</span>
              </label>

              {isRecurring && (
                <select
                  value={recurrencePattern}
                  onChange={(e) => setRecurrencePattern(e.target.value as any)}
                  className="px-3 py-1.5 border rounded-lg"
                  style={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    color: '#2d3748'
                  }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              )}

              <label className="flex items-center gap-2" style={{ color: '#4a5568' }}>
                Reminder:
                <select
                  value={reminderMinutes || ''}
                  onChange={(e) => setReminderMinutes(e.target.value ? Number(e.target.value) : null)}
                  className="px-3 py-1.5 border rounded-lg"
                  style={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    color: '#2d3748'
                  }}
                >
                  <option value="">None</option>
                  <option value="15">15 minutes before</option>
                  <option value="30">30 minutes before</option>
                  <option value="60">1 hour before</option>
                  <option value="1440">1 day before</option>
                </select>
              </label>

              <label className="flex items-center gap-2" style={{ color: '#4a5568' }}>
                Use Template:
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="px-3 py-1.5 border rounded-lg"
                  style={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    color: '#2d3748'
                  }}
                >
                  <option value="">Select a template...</option>
                </select>
              </label>
            </div>
          </form>

          {/* Search and Filters */}
          <div className="mb-6">
            <div className="relative mb-4">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search todos and subtasks..."
                className="w-full pl-10 pr-4 py-3 border rounded-lg"
                style={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  color: '#2d3748'
                }}
              />
            </div>

            <div className="flex gap-3 items-center">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg font-medium"
                style={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  color: '#2d3748'
                }}
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>

              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="px-4 py-2 border rounded-lg font-medium transition-all"
                style={{
                  backgroundColor: '#f3f4f6',
                  borderColor: '#e2e8f0',
                  color: '#4a5568'
                }}
              >
                ▶ Advanced
              </button>
            </div>
          </div>

          {/* Todos List */}
          {activeTodos.length === 0 && (
            <div className="text-center py-16" style={{ color: '#9ca3af' }}>
              <p className="text-lg">No todos yet. Add one above!</p>
            </div>
          )}

          {activeTodos.length > 0 && (
            <div className="space-y-3">
              {activeTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-all"
                  style={{ borderColor: '#e2e8f0', backgroundColor: '#ffffff' }}
                >
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id, todo.completed)}
                    className="w-5 h-5 rounded cursor-pointer"
                    style={{ accentColor: '#3b82f6' }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${priorityColors[todo.priority as keyof typeof priorityColors]}`} />
                      <span className="font-medium" style={{ color: '#1a202c' }}>{todo.title}</span>
                    </div>
                    {todo.due_date && (
                      <span className="text-sm" style={{ color: '#9ca3af' }}>
                        Due: {new Date(todo.due_date).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="px-3 py-1.5 rounded-lg font-medium transition-all hover:bg-red-50"
                    style={{ color: '#ef4444' }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Completed Todos */}
          {completedTodos.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-3" style={{ color: '#4a5568' }}>
                Completed ({completedTodos.length})
              </h3>
              <div className="space-y-3">
                {completedTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-center gap-4 p-4 border rounded-lg opacity-60"
                    style={{ borderColor: '#e2e8f0', backgroundColor: '#f9fafb' }}
                  >
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo.id, todo.completed)}
                      className="w-5 h-5 rounded cursor-pointer"
                      style={{ accentColor: '#3b82f6' }}
                    />
                    <div className="flex-1">
                      <span className="line-through" style={{ color: '#9ca3af' }}>{todo.title}</span>
                    </div>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="px-3 py-1.5 rounded-lg font-medium transition-all hover:bg-red-50"
                      style={{ color: '#ef4444' }}
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
    </div>
  );
}
