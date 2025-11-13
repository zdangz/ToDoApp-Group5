'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/lib/hooks/useNotifications';

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
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDataMenu, setShowDataMenu] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  
  // Advanced filter states
  const [completionFilter, setCompletionFilter] = useState('all'); // 'all', 'pending', 'completed'
  const [dueDateFrom, setDueDateFrom] = useState('');
  const [dueDateTo, setDueDateTo] = useState('');
  
  // Subtasks state
  const [expandedTodos, setExpandedTodos] = useState<Set<number>>(new Set());
  const [subtasks, setSubtasks] = useState<{ [todoId: number]: any[] }>({});
  const [newSubtaskTitle, setNewSubtaskTitle] = useState<{ [todoId: number]: string }>({});
  
  // Template state
  const [templates, setTemplates] = useState<any[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [currentTodoForTemplate, setCurrentTodoForTemplate] = useState<any>(null);

  // Notification state
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Tag state
  const [tags, setTags] = useState<any[]>([]);
  const [todoTags, setTodoTags] = useState<{ [todoId: number]: any[] }>({});
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [tagFilter, setTagFilter] = useState<number | null>(null);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#3b82f6');
  const [editingTag, setEditingTag] = useState<any>(null);
  const [tagError, setTagError] = useState('');

  // Edit todo state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPriority, setEditPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [editDueDate, setEditDueDate] = useState('');
  const [editIsRecurring, setEditIsRecurring] = useState(false);
  const [editRecurrencePattern, setEditRecurrencePattern] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
  const [editReminderMinutes, setEditReminderMinutes] = useState<number | null>(null);

  // Use notifications hook
  useNotifications(notificationsEnabled, fetchTodos);

  useEffect(() => {
    // Check notification permission on mount
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
      // Load notification preference from localStorage
      const savedPref = localStorage.getItem('notificationsEnabled');
      setNotificationsEnabled(savedPref === 'true' && Notification.permission === 'granted');
    }
  }, []);

  useEffect(() => {
    fetchTodos();
    fetchTemplates();
    fetchTags();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDataMenu]);
  
  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function checkAuth() {
    const res = await fetch('/api/auth/me');
    if (!res.ok) {
      router.push('/login');
    } else {
      const data = await res.json();
      setUsername(data.username);
    }
  }

  async function toggleNotifications() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Your browser does not support notifications');
      return;
    }

    if (!notificationsEnabled) {
      // Request permission
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        localStorage.setItem('notificationsEnabled', 'true');
      } else {
        alert('Notification permission denied. Please enable it in your browser settings.');
      }
    } else {
      // Disable notifications
      setNotificationsEnabled(false);
      localStorage.setItem('notificationsEnabled', 'false');
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
    
    // Validate: Recurring todos require a due date
    if (isRecurring && !dueDate) {
      alert('Recurring todos require a due date. Please set a due date.');
      return;
    }

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

  function openEditModal(todo: any) {
    setEditingTodo(todo);
    setEditTitle(todo.title);
    setEditPriority(todo.priority);
    setEditDueDate(todo.due_date ? todo.due_date.slice(0, 16) : '');
    setEditIsRecurring(!!todo.recurrence_pattern);
    setEditRecurrencePattern(todo.recurrence_pattern || 'weekly');
    setEditReminderMinutes(todo.reminder_minutes);
    setShowEditModal(true);
  }

  async function updateTodo() {
    if (!editingTodo || !editTitle.trim()) return;
    
    // Validate: Recurring todos require a due date
    if (editIsRecurring && !editDueDate) {
      alert('Recurring todos require a due date. Please set a due date.');
      return;
    }

    try {
      const res = await fetch(`/api/todos/${editingTodo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          priority: editPriority,
          due_date: editDueDate || null,
          recurrence_pattern: editIsRecurring ? editRecurrencePattern : null,
          reminder_minutes: editReminderMinutes,
        }),
      });

      if (res.ok) {
        setShowEditModal(false);
        setEditingTodo(null);
        fetchTodos();
      }
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }
  
  // Subtask functions
  async function toggleSubtasksExpanded(todoId: number) {
    const newExpanded = new Set(expandedTodos);
    if (newExpanded.has(todoId)) {
      newExpanded.delete(todoId);
    } else {
      newExpanded.add(todoId);
      // Fetch subtasks if not already loaded
      if (!subtasks[todoId]) {
        await fetchSubtasks(todoId);
      }
    }
    setExpandedTodos(newExpanded);
  }
  
  async function fetchSubtasks(todoId: number) {
    try {
      const res = await fetch(`/api/todos/${todoId}/subtasks`);
      if (res.ok) {
        const data = await res.json();
        setSubtasks(prev => ({ ...prev, [todoId]: data }));
      }
    } catch (error) {
      console.error('Failed to fetch subtasks:', error);
    }
  }
  
  async function addSubtask(todoId: number) {
    const title = newSubtaskTitle[todoId]?.trim();
    if (!title) return;
    
    try {
      const res = await fetch(`/api/todos/${todoId}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      
      if (res.ok) {
        const subtask = await res.json();
        setSubtasks(prev => ({
          ...prev,
          [todoId]: [...(prev[todoId] || []), subtask]
        }));
        setNewSubtaskTitle(prev => ({ ...prev, [todoId]: '' }));
      }
    } catch (error) {
      console.error('Failed to add subtask:', error);
    }
  }
  
  async function toggleSubtask(subtaskId: number, todoId: number, completed: boolean) {
    // Optimistic update
    setSubtasks(prev => ({
      ...prev,
      [todoId]: prev[todoId].map(st => 
        st.id === subtaskId ? { ...st, completed: !completed } : st
      )
    }));
    
    try {
      const res = await fetch(`/api/subtasks/${subtaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      });
      
      if (!res.ok) {
        // Revert on failure
        setSubtasks(prev => ({
          ...prev,
          [todoId]: prev[todoId].map(st => 
            st.id === subtaskId ? { ...st, completed: completed } : st
          )
        }));
      }
    } catch (error) {
      console.error('Failed to toggle subtask:', error);
      // Revert on error
      setSubtasks(prev => ({
        ...prev,
        [todoId]: prev[todoId].map(st => 
          st.id === subtaskId ? { ...st, completed: completed } : st
        )
      }));
    }
  }
  
  async function deleteSubtask(subtaskId: number, todoId: number) {
    try {
      const res = await fetch(`/api/subtasks/${subtaskId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setSubtasks(prev => ({
          ...prev,
          [todoId]: prev[todoId].filter(st => st.id !== subtaskId)
        }));
      }
    } catch (error) {
      console.error('Failed to delete subtask:', error);
    }
  }
  
  // Calculate progress for a todo
  function calculateProgress(todoId: number): { completed: number; total: number; percentage: number } {
    const todoSubtasks = subtasks[todoId] || [];
    const total = todoSubtasks.length;
    const completed = todoSubtasks.filter(st => st.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  }
  
  // Template functions
  async function fetchTemplates() {
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  }

  async function fetchTags() {
    try {
      const res = await fetch('/api/tags');
      if (res.ok) {
        const data = await res.json();
        setTags(data);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  }

  async function fetchTodoTags(todoId: number) {
    try {
      const res = await fetch(`/api/todos/${todoId}/tags`);
      if (res.ok) {
        const data = await res.json();
        setTodoTags(prev => ({ ...prev, [todoId]: data }));
      }
    } catch (error) {
      console.error('Failed to fetch todo tags:', error);
    }
  }

  async function createTag(e: React.FormEvent) {
    e.preventDefault();
    if (!tagName.trim()) return;

    setTagError('');
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tagName.trim(), color: tagColor }),
      });

      if (res.ok) {
        setTagName('');
        setTagColor('#3b82f6');
        await fetchTags();
      } else {
        const error = await res.json();
        setTagError(error.error || 'Failed to create tag');
      }
    } catch (error) {
      setTagError('Failed to create tag');
    }
  }

  async function updateTag() {
    if (!editingTag || !tagName.trim()) return;

    setTagError('');
    try {
      const res = await fetch(`/api/tags/${editingTag.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tagName.trim(), color: tagColor }),
      });

      if (res.ok) {
        setEditingTag(null);
        setTagName('');
        setTagColor('#3b82f6');
        await fetchTags();
      } else {
        const error = await res.json();
        setTagError(error.error || 'Failed to update tag');
      }
    } catch (error) {
      setTagError('Failed to update tag');
    }
  }

  async function deleteTag(tagId: number) {
    if (!confirm('Delete this tag? It will be removed from all todos.')) return;

    try {
      const res = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchTags();
        // Refresh todo tags for all todos
        const updatedTodoTags = { ...todoTags };
        Object.keys(updatedTodoTags).forEach(todoId => {
          updatedTodoTags[Number(todoId)] = updatedTodoTags[Number(todoId)].filter(t => t.id !== tagId);
        });
        setTodoTags(updatedTodoTags);
      }
    } catch (error) {
      console.error('Failed to delete tag:', error);
    }
  }

  async function toggleTodoTag(todoId: number, tagId: number) {
    const currentTags = todoTags[todoId] || [];
    const hasTag = currentTags.some(t => t.id === tagId);

    try {
      if (hasTag) {
        // Remove tag
        const res = await fetch(`/api/todos/${todoId}/tags?tag_id=${tagId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          await fetchTodoTags(todoId);
        }
      } else {
        // Add tag
        const res = await fetch(`/api/todos/${todoId}/tags`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tag_id: tagId }),
        });
        if (res.ok) {
          await fetchTodoTags(todoId);
        }
      }
    } catch (error) {
      console.error('Failed to toggle todo tag:', error);
    }
  }

  function startEditTag(tag: any) {
    setEditingTag(tag);
    setTagName(tag.name);
    setTagColor(tag.color);
    setTagError('');
  }

  function cancelEditTag() {
    setEditingTag(null);
    setTagName('');
    setTagColor('#3b82f6');
    setTagError('');
  }
  
  async function openSaveTemplateModal() {
    if (!title.trim()) {
      alert('Please enter a todo title first');
      return;
    }
    
    setCurrentTodoForTemplate({
      title,
      priority,
      due_date: dueDate,
      is_recurring: isRecurring,
      recurrence_pattern: recurrencePattern,
      reminder_minutes: reminderMinutes,
    });
    setShowSaveTemplateModal(true);
  }
  
  async function saveAsTemplate() {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }
    
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName.trim(),
          description: templateDescription.trim(),
          category: templateCategory.trim(),
          todo_data: currentTodoForTemplate,
          subtasks_data: [], // Can be extended later to include subtasks
        }),
      });
      
      if (res.ok) {
        alert('Template saved successfully!');
        setShowSaveTemplateModal(false);
        setTemplateName('');
        setTemplateDescription('');
        setTemplateCategory('');
        fetchTemplates();
      } else {
        const error = await res.json();
        alert('Failed to save template: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Error saving template');
    }
  }
  
  async function applyTemplate(templateId: number) {
    try {
      const res = await fetch(`/api/templates/${templateId}/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      if (res.ok) {
        setShowTemplateModal(false);
        setSelectedTemplate(''); // Reset dropdown
        fetchTodos();
        alert('Todo created from template!');
      } else {
        const error = await res.json();
        alert('Failed to use template: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to use template:', error);
      alert('Error using template');
    }
  }
  
  async function deleteTemplate(templateId: number) {
    if (!confirm('Delete this template?')) return;
    
    try {
      const res = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        fetchTemplates();
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
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

  // Filter todos based on search, priority, and advanced filters
  const filteredTodos = todos.filter(todo => {
    // Search filter (case-insensitive, matches title)
    const matchesSearch = todo.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    
    // Priority filter
    const matchesPriority = priorityFilter === 'all' || todo.priority === priorityFilter;
    
    // Completion status filter (advanced)
    let matchesCompletion = true;
    if (completionFilter === 'pending') {
      matchesCompletion = !todo.completed;
    } else if (completionFilter === 'completed') {
      matchesCompletion = todo.completed;
    }
    
    // Due date range filter (advanced)
    let matchesDueDate = true;
    if (dueDateFrom && todo.due_date) {
      matchesDueDate = matchesDueDate && new Date(todo.due_date) >= new Date(dueDateFrom);
    }
    if (dueDateTo && todo.due_date) {
      matchesDueDate = matchesDueDate && new Date(todo.due_date) <= new Date(dueDateTo + 'T23:59:59');
    }
    
    // Tag filter
    const matchesTag = !tagFilter || (todoTags[todo.id] && todoTags[todo.id].some(t => t.id === tagFilter));
    
    return matchesSearch && matchesPriority && matchesCompletion && matchesDueDate && matchesTag;
  });

  const activeTodos = filteredTodos.filter(t => !t.completed);
  const completedTodos = filteredTodos.filter(t => t.completed);
  
  // Count active filters
  const activeFiltersCount = [
    debouncedSearchQuery !== '',
    priorityFilter !== 'all',
    completionFilter !== 'all',
    dueDateFrom !== '',
    dueDateTo !== '',
    tagFilter !== null
  ].filter(Boolean).length;
  
  // Clear all filters function
  const clearAllFilters = () => {
    setSearchQuery('');
    setPriorityFilter('all');
    setCompletionFilter('all');
    setDueDateFrom('');
    setDueDateTo('');
    setTagFilter(null);
  };
  
  // Calculate dashboard statistics
  const now = new Date();
  const overdueTodos = todos.filter(todo => 
    !todo.completed && todo.due_date && new Date(todo.due_date) < now
  ).length;
  const pendingTodos = activeTodos.length;
  const completedTodosCount = completedTodos.length;

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
            <button 
              onClick={() => setShowTemplateModal(true)}
              className="px-4 py-2 rounded-lg font-medium text-white transition-all hover:shadow-md" 
              style={{ backgroundColor: '#3b82f6' }}
            >
              📋 Templates
            </button>
            <button 
              onClick={toggleNotifications}
              className="px-4 py-2 rounded-lg font-medium transition-all hover:shadow-md"
              style={{ 
                backgroundColor: notificationsEnabled ? 'transparent' : '#f97316',
                color: notificationsEnabled ? '#64748b' : '#ffffff',
                border: notificationsEnabled ? '2px solid #e2e8f0' : 'none'
              }}
              title={notificationsEnabled ? 'Notifications enabled' : 'Notifications muted'}
            >
              {notificationsEnabled ? '🔔' : '🔕'}
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
                  disabled={!dueDate}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <option value="120">2 hours before</option>
                  <option value="1440">1 day before</option>
                  <option value="2880">2 days before</option>
                  <option value="10080">1 week before</option>
                </select>
              </label>

              <label className="flex items-center gap-2" style={{ color: '#4a5568' }}>
                Use Template:
                <select
                  value={selectedTemplate}
                  onChange={(e) => {
                    const templateId = e.target.value;
                    setSelectedTemplate(templateId);
                    if (templateId) {
                      applyTemplate(Number(templateId));
                    }
                  }}
                  className="px-3 py-1.5 border rounded-lg"
                  style={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    color: '#2d3748'
                  }}
                >
                  <option value="">Select a template...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </label>

              {title && (
                <button
                  type="button"
                  onClick={openSaveTemplateModal}
                  className="px-4 py-1.5 rounded-lg font-medium text-white transition-all hover:shadow-md flex items-center gap-2"
                  style={{ backgroundColor: '#10b981' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
                >
                  💾 Save as Template
                </button>
              )}
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
                className="px-4 py-2 border rounded-lg font-medium transition-all flex items-center gap-2"
                style={{
                  backgroundColor: showAdvanced ? '#3b82f6' : '#f3f4f6',
                  borderColor: '#e2e8f0',
                  color: showAdvanced ? '#ffffff' : '#4a5568'
                }}
              >
                <span style={{ transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▶</span>
                Advanced
              </button>
              
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 border rounded-lg font-medium transition-all hover:bg-red-50"
                  style={{
                    backgroundColor: '#ffffff',
                    borderColor: '#ef4444',
                    color: '#ef4444'
                  }}
                >
                  Clear Filters ({activeFiltersCount})
                </button>
              )}
            </div>
            
            {/* Advanced Filters Panel */}
            {showAdvanced && (
              <div className="mt-4 p-6 border rounded-lg" style={{ backgroundColor: '#f9fafb', borderColor: '#e2e8f0' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#1a202c' }}>Advanced Filters</h3>
                
                {/* Completion Status */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#4a5568' }}>
                    Completion Status
                  </label>
                  <select
                    value={completionFilter}
                    onChange={(e) => setCompletionFilter(e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg font-medium"
                    style={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      color: '#2d3748'
                    }}
                  >
                    <option value="all">All Todos</option>
                    <option value="pending">Pending Only</option>
                    <option value="completed">Completed Only</option>
                  </select>
                </div>
                
                {/* Due Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#4a5568' }}>
                      Due Date From
                    </label>
                    <input
                      type="date"
                      value={dueDateFrom}
                      onChange={(e) => setDueDateFrom(e.target.value)}
                      className="w-full px-4 py-2.5 border rounded-lg"
                      style={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        color: '#2d3748'
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#4a5568' }}>
                      Due Date To
                    </label>
                    <input
                      type="date"
                      value={dueDateTo}
                      onChange={(e) => setDueDateTo(e.target.value)}
                      className="w-full px-4 py-2.5 border rounded-lg"
                      style={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        color: '#2d3748'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Filter Summary */}
          {activeFiltersCount > 0 && (
            <div className="mb-4 p-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{filteredTodos.length} result(s) found with filters:</span>
                {debouncedSearchQuery && <span className="px-2 py-1 bg-white rounded text-sm">Search: &quot;{debouncedSearchQuery}&quot;</span>}
                {priorityFilter !== 'all' && <span className="px-2 py-1 bg-white rounded text-sm">Priority: {priorityFilter}</span>}
                {completionFilter !== 'all' && <span className="px-2 py-1 bg-white rounded text-sm">Status: {completionFilter}</span>}
                {dueDateFrom && <span className="px-2 py-1 bg-white rounded text-sm">From: {dueDateFrom}</span>}
                {dueDateTo && <span className="px-2 py-1 bg-white rounded text-sm">To: {dueDateTo}</span>}
              </div>
            </div>
          )}

          {/* Todos List */}
          {activeTodos.length === 0 && completedTodos.length === 0 && (
            <div className="text-center py-16" style={{ color: '#9ca3af' }}>
              {activeFiltersCount > 0 ? (
                <>
                  <p className="text-lg mb-2">No todos match your filters</p>
                  <button
                    onClick={clearAllFilters}
                    className="text-blue-500 hover:underline"
                  >
                    Clear all filters
                  </button>
                </>
              ) : (
                <p className="text-lg">No todos yet. Add one above!</p>
              )}
            </div>
          )}

          {activeTodos.length > 0 && (
            <>
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#2563eb' }}>
                Pending ({pendingTodos})
              </h2>
              <div className="space-y-3">
                {activeTodos.map((todo) => {
                  const progress = calculateProgress(todo.id);
                  const isExpanded = expandedTodos.has(todo.id);
                  
                  return (
                    <div
                      key={todo.id}
                      className="border rounded-lg hover:shadow-md transition-all"
                      style={{ borderColor: '#e2e8f0', backgroundColor: '#ffffff' }}
                    >
                      <div className="flex items-center gap-4 p-4">
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => toggleTodo(todo.id, todo.completed)}
                          className="w-5 h-5 rounded cursor-pointer"
                          style={{ accentColor: '#3b82f6' }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium" style={{ color: '#1a202c' }}>{todo.title}</span>
                            <span 
                              className="px-2 py-0.5 rounded text-xs font-medium"
                              style={{ 
                                backgroundColor: todo.priority === 'high' ? '#fef2f2' : todo.priority === 'medium' ? '#fefce8' : '#eff6ff',
                                color: todo.priority === 'high' ? '#dc2626' : todo.priority === 'medium' ? '#ca8a04' : '#2563eb'
                              }}
                            >
                              {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
                            </span>
                            {todo.is_recurring && (
                              <span 
                                className="px-2 py-0.5 rounded text-xs font-medium"
                                style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}
                                title={`Repeats ${todo.recurrence_pattern}`}
                              >
                                🔄 {todo.recurrence_pattern?.charAt(0).toUpperCase() + todo.recurrence_pattern?.slice(1)}
                              </span>
                            )}
                            {progress.total > 0 && (
                              <span className="text-sm font-medium" style={{ color: '#6b7280' }}>
                                {progress.completed}/{progress.total}
                              </span>
                            )}
                          </div>
                          {todo.due_date && (
                            <span className="text-sm" style={{ color: new Date(todo.due_date) < now ? '#ef4444' : '#9ca3af' }}>
                              {new Date(todo.due_date).toLocaleString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                hour: 'numeric', 
                                minute: '2-digit' 
                              })}
                            </span>
                          )}
                        </div>
                        
                        <button
                          onClick={() => toggleSubtasksExpanded(todo.id)}
                          className="px-3 py-1.5 rounded-lg font-medium transition-all hover:bg-gray-100 flex items-center gap-1"
                          style={{ color: '#4a5568' }}
                        >
                          <span style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▶</span>
                          Subtasks
                        </button>
                        
                        <button
                          onClick={() => openEditModal(todo)}
                          className="px-3 py-1.5 rounded-lg font-medium transition-all hover:bg-blue-50"
                          style={{ color: '#3b82f6' }}
                        >
                          Edit
                        </button>
                        
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className="px-3 py-1.5 rounded-lg font-medium transition-all hover:bg-red-50"
                          style={{ color: '#ef4444' }}
                        >
                          Delete
                        </button>
                      </div>
                      
                      {/* Subtasks Section */}
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t" style={{ borderColor: '#e2e8f0' }}>
                          <div className="pt-4">
                            {/* Progress Bar */}
                            {progress.total > 0 && (
                              <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium" style={{ color: '#6b7280' }}>
                                    Progress: {progress.completed}/{progress.total} completed ({progress.percentage}%)
                                  </span>
                                </div>
                                <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#e5e7eb' }}>
                                  <div 
                                    className="h-2 rounded-full transition-all duration-300"
                                    style={{ 
                                      width: `${progress.percentage}%`,
                                      backgroundColor: progress.percentage === 100 ? '#10b981' : '#3b82f6'
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                            
                            {/* Add Subtask Input */}
                            <div className="flex gap-2 mb-3">
                              <input
                                type="text"
                                value={newSubtaskTitle[todo.id] || ''}
                                onChange={(e) => setNewSubtaskTitle(prev => ({ ...prev, [todo.id]: e.target.value }))}
                                onKeyPress={(e) => e.key === 'Enter' && addSubtask(todo.id)}
                                placeholder="Add a subtask..."
                                className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                style={{
                                  backgroundColor: '#ffffff',
                                  borderColor: '#e2e8f0',
                                  color: '#2d3748'
                                }}
                              />
                              <button
                                onClick={() => addSubtask(todo.id)}
                                className="px-4 py-2 rounded-lg font-medium text-white transition-all hover:shadow-md text-sm"
                                style={{ backgroundColor: '#3b82f6' }}
                              >
                                Add
                              </button>
                            </div>
                            
                            {/* Subtasks List */}
                            {subtasks[todo.id] && subtasks[todo.id].length > 0 ? (
                              <div className="space-y-2">
                                {subtasks[todo.id].map((subtask: any) => (
                                  <div 
                                    key={subtask.id}
                                    className="flex items-center gap-3 p-2 rounded hover:bg-gray-50"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={subtask.completed}
                                      onChange={() => toggleSubtask(subtask.id, todo.id, subtask.completed)}
                                      className="w-4 h-4 rounded cursor-pointer"
                                      style={{ accentColor: '#3b82f6' }}
                                    />
                                    <span 
                                      className={`flex-1 text-sm ${subtask.completed ? 'line-through' : ''}`}
                                      style={{ color: subtask.completed ? '#9ca3af' : '#2d3748' }}
                                    >
                                      {subtask.title}
                                    </span>
                                    <button
                                      onClick={() => deleteSubtask(subtask.id, todo.id)}
                                      className="text-sm text-red-500 hover:text-red-700"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-center py-4" style={{ color: '#9ca3af' }}>
                                No subtasks yet. Add one above!
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Dashboard Statistics */}
              <div className="mt-6 pt-6 border-t" style={{ borderColor: '#e2e8f0' }}>
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-4xl font-bold mb-1" style={{ color: '#ef4444' }}>{overdueTodos}</div>
                    <div className="text-sm" style={{ color: '#6b7280' }}>Overdue</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold mb-1" style={{ color: '#3b82f6' }}>{pendingTodos}</div>
                    <div className="text-sm" style={{ color: '#6b7280' }}>Pending</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold mb-1" style={{ color: '#10b981' }}>{completedTodosCount}</div>
                    <div className="text-sm" style={{ color: '#6b7280' }}>Completed</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Completed Todos */}
          {completedTodos.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#10b981' }}>
                Completed ({completedTodosCount})
              </h2>
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
                      <div className="flex items-center gap-2">
                        <span className="line-through" style={{ color: '#9ca3af' }}>{todo.title}</span>
                        {todo.is_recurring && (
                          <span 
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}
                            title={`Repeats ${todo.recurrence_pattern}`}
                          >
                            🔄 {todo.recurrence_pattern?.charAt(0).toUpperCase() + todo.recurrence_pattern?.slice(1)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => openEditModal(todo)}
                      className="px-3 py-1.5 rounded-lg font-medium transition-all hover:bg-blue-50"
                      style={{ color: '#3b82f6' }}
                    >
                      Edit
                    </button>
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

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowSaveTemplateModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#1e293b' }}>
              Save as Template
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>
                  Template Name *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Weekly Planning"
                  className="w-full px-4 py-2.5 border rounded-lg"
                  style={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    color: '#2d3748'
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>
                  Description (Optional)
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Describe when to use this template..."
                  rows={3}
                  className="w-full px-4 py-2.5 border rounded-lg resize-none"
                  style={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    color: '#2d3748'
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>
                  Category (Optional)
                </label>
                <input
                  type="text"
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  placeholder="e.g., Work, Personal, Planning"
                  className="w-full px-4 py-2.5 border rounded-lg"
                  style={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    color: '#2d3748'
                  }}
                />
              </div>
            </div>

            <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#f0f9ff', borderLeft: '4px solid #3b82f6' }}>
              <p className="text-sm font-medium mb-2" style={{ color: '#1e40af' }}>
                Template will save:
              </p>
              <ul className="text-sm space-y-1" style={{ color: '#475569' }}>
                <li>• Title: {title}</li>
                <li>• Priority: {priority}</li>
                {isRecurring && <li>• Recurrence: {recurrencePattern}</li>}
                {reminderMinutes && <li>• Reminder: {reminderMinutes} minutes before</li>}
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSaveTemplateModal(false);
                  setTemplateName('');
                  setTemplateDescription('');
                  setTemplateCategory('');
                }}
                className="flex-1 px-6 py-2.5 rounded-lg font-medium border transition-all"
                style={{
                  borderColor: '#e2e8f0',
                  color: '#64748b',
                  backgroundColor: '#ffffff'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => saveAsTemplate()}
                disabled={!templateName}
                className="flex-1 px-6 py-2.5 rounded-lg font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#3b82f6' }}
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Todo Modal */}
      {showEditModal && editingTodo && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-8 max-w-xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#1e293b' }}>
              Edit Todo
            </h2>

            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>
                Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg"
                style={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  color: '#2d3748'
                }}
              />
            </div>

            {/* Priority */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>
                Priority
              </label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as any)}
                className="w-full px-4 py-2.5 border rounded-lg font-medium"
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
            </div>

            {/* Due Date */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>
                Due Date (optional)
              </label>
              <input
                type="datetime-local"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg"
                style={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  color: '#2d3748'
                }}
              />
            </div>

            {/* Recurrence */}
            <div className="mb-4 flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editIsRecurring}
                  onChange={(e) => setEditIsRecurring(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span style={{ color: '#4a5568' }}>Repeat</span>
              </label>

              {editIsRecurring && (
                <select
                  value={editRecurrencePattern}
                  onChange={(e) => setEditRecurrencePattern(e.target.value as any)}
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
            </div>

            {/* Reminder */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>
                Reminder
              </label>
              <select
                value={editReminderMinutes || ''}
                onChange={(e) => setEditReminderMinutes(e.target.value ? Number(e.target.value) : null)}
                disabled={!editDueDate}
                className="w-full px-4 py-2.5 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
                <option value="120">2 hours before</option>
                <option value="1440">1 day before</option>
                <option value="2880">2 days before</option>
                <option value="10080">1 week before</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={updateTodo}
                className="flex-1 px-6 py-3 rounded-lg font-medium text-white transition-all hover:shadow-md"
                style={{ backgroundColor: '#3b82f6' }}
              >
                Update
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-3 rounded-lg font-medium transition-all"
                style={{ 
                  backgroundColor: '#f1f5f9',
                  color: '#475569'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates List Modal */}
      {showTemplateModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowTemplateModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#1e293b' }}>
                Templates
              </h2>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {templates.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-lg mb-2" style={{ color: '#64748b' }}>
                  No templates yet
                </p>
                <p className="text-sm" style={{ color: '#94a3b8' }}>
                  Create a todo and save it as a template!
                </p>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="mt-6 px-6 py-2.5 rounded-lg font-medium text-white transition-all"
                  style={{ backgroundColor: '#3b82f6' }}
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {templates.map((template) => {
                  const todoData = typeof template.todo_data === 'string' 
                    ? JSON.parse(template.todo_data) 
                    : template.todo_data;
                  const subtasksData = template.subtasks_data 
                    ? (typeof template.subtasks_data === 'string' 
                        ? JSON.parse(template.subtasks_data) 
                        : template.subtasks_data)
                    : [];

                  return (
                    <div
                      key={template.id}
                      className="border rounded-xl p-5 transition-all hover:shadow-md"
                      style={{ borderColor: '#e2e8f0' }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold mb-1" style={{ color: '#1e293b' }}>
                            {template.name}
                          </h3>
                          {template.description && (
                            <p className="text-sm mb-2" style={{ color: '#64748b' }}>
                              {template.description}
                            </p>
                          )}
                          {template.category && (
                            <span
                              className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                              style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}
                            >
                              {template.category}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#f8fafc' }}>
                        <p className="text-xs font-medium mb-2" style={{ color: '#64748b' }}>
                          PREVIEW:
                        </p>
                        <div className="space-y-1 text-sm" style={{ color: '#475569' }}>
                          <p>• Title: {todoData.title}</p>
                          <p>• Priority: {todoData.priority}</p>
                          {todoData.recurrence_pattern && (
                            <p>• Recurrence: {todoData.recurrence_pattern}</p>
                          )}
                          {todoData.reminder_minutes && (
                            <p>• Reminder: {todoData.reminder_minutes} minutes before</p>
                          )}
                          {subtasksData.length > 0 && (
                            <p>• Subtasks: {subtasksData.length} item(s)</p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => applyTemplate(template.id)}
                          className="flex-1 px-4 py-2 rounded-lg font-medium text-white transition-all hover:shadow-md"
                          style={{ backgroundColor: '#3b82f6' }}
                        >
                          Use Template
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete template "' + template.name + '"?')) {
                              deleteTemplate(template.id);
                            }
                          }}
                          className="px-4 py-2 rounded-lg font-medium transition-all"
                          style={{ 
                            color: '#ef4444',
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fee2e2'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
