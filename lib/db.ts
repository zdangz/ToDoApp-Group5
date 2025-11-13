import Database from 'better-sqlite3';
import path from 'path';

// Types
export type Priority = 'high' | 'medium' | 'low';
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface User {
  id: number;
  username: string;
  created_at: string;
}

export interface Authenticator {
  id: number;
  user_id: number;
  credential_id: string;
  public_key: string;
  counter: number;
  created_at: string;
}

export interface Todo {
  id: number;
  user_id: number;
  title: string;
  completed: boolean;
  priority: Priority;
  due_date: string | null;
  is_recurring: boolean;
  recurrence_pattern: RecurrencePattern | null;
  reminder_minutes: number | null;
  last_notification_sent: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subtask {
  id: number;
  todo_id: number;
  title: string;
  completed: boolean;
  position: number;
  created_at: string;
}

export interface Tag {
  id: number;
  user_id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface Template {
  id: number;
  user_id: number;
  name: string;
  description: string;
  category: string;
  todo_data: string; // JSON
  subtasks_data: string; // JSON
  created_at: string;
}

export interface Holiday {
  id: number;
  date: string;
  name: string;
  year: number;
}

// Database path - use Railway volume if available, otherwise project root
const dbPath = process.env.RAILWAY_VOLUME_MOUNT_PATH 
  ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'todos.db')
  : path.join(process.cwd(), 'todos.db');

// Initialize database schema
function initializeSchema(database: Database.Database) {
  database.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS authenticators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    credential_id TEXT UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    counter INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT 0,
    priority TEXT DEFAULT 'medium',
    due_date TEXT,
    is_recurring BOOLEAN DEFAULT 0,
    recurrence_pattern TEXT,
    reminder_minutes INTEGER,
    last_notification_sent TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS subtasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    todo_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT 0,
    position INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, name)
  );

  CREATE TABLE IF NOT EXISTS todo_tags (
    todo_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (todo_id, tag_id),
    FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    todo_data TEXT NOT NULL,
    subtasks_data TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS holidays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    name TEXT NOT NULL,
    year INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
  CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
  CREATE INDEX IF NOT EXISTS idx_subtasks_todo_id ON subtasks(todo_id);
  CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
`);
}

// Lazy database initialization to prevent issues during build/startup
let db: Database.Database | null = null;
let isInitialized = false;

function initDB(): Database.Database {
  if (!db && !isInitialized) {
    isInitialized = true;
    
    // Skip initialization during build phase
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      throw new Error('Database cannot be accessed during build phase');
    }
    
    try {
      console.log('Initializing database at:', dbPath);
      db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
      
      // Initialize schema
      initializeSchema(db);
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      isInitialized = false;
      throw error;
    }
  }
  
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  return db;
}

// Database operations
export const userDB = {
  create: (username: string): User => {
    const db = initDB();
    const stmt = db.prepare('INSERT INTO users (username) VALUES (?)');
    const result = stmt.run(username);
    return userDB.getById(Number(result.lastInsertRowid))!;
  },
  getById: (id: number): User | undefined => {
    const db = initDB();
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
  },
  getByUsername: (username: string): User | undefined => {
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
  },
  list: (): User[] => {
    return db.prepare('SELECT * FROM users ORDER BY created_at DESC').all() as User[];
  },
};

export const authenticatorDB = {
  create: (userId: number, credentialId: string, publicKey: string, counter: number): Authenticator => {
    const stmt = db.prepare('INSERT INTO authenticators (user_id, credential_id, public_key, counter) VALUES (?, ?, ?, ?)');
    const result = stmt.run(userId, credentialId, publicKey, counter);
    return authenticatorDB.getById(Number(result.lastInsertRowid))!;
  },
  getByCredentialId: (credentialId: string): Authenticator | undefined => {
    return db.prepare('SELECT * FROM authenticators WHERE credential_id = ?').get(credentialId) as Authenticator | undefined;
  },
  getById: (id: number): Authenticator | undefined => {
    return db.prepare('SELECT * FROM authenticators WHERE id = ?').get(id) as Authenticator | undefined;
  },
  getByUserId: (userId: number): Authenticator[] => {
    return db.prepare('SELECT * FROM authenticators WHERE user_id = ?').all(userId) as Authenticator[];
  },
  updateCounter: (id: number, counter: number): void => {
    db.prepare('UPDATE authenticators SET counter = ? WHERE id = ?').run(counter, id);
  },
};

export const todoDB = {
  create: (data: Partial<Todo>): Todo => {
    const stmt = db.prepare(`
      INSERT INTO todos (user_id, title, priority, due_date, is_recurring, recurrence_pattern, reminder_minutes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.user_id!,
      data.title!,
      data.priority || 'medium',
      data.due_date || null,
      data.is_recurring ? 1 : 0,
      data.recurrence_pattern || null,
      data.reminder_minutes || null
    );
    return todoDB.getById(Number(result.lastInsertRowid))!;
  },
  getById: (id: number): Todo | undefined => {
    return db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as Todo | undefined;
  },
  listByUserId: (userId: number): Todo[] => {
    return db.prepare('SELECT * FROM todos WHERE user_id = ? ORDER BY completed ASC, priority DESC, due_date ASC').all(userId) as Todo[];
  },
  update: (id: number, data: Partial<Todo>): void => {
    const fields = Object.keys(data).filter(k => k !== 'id').map(k => `${k} = ?`).join(', ');
    const values = Object.keys(data).filter(k => k !== 'id').map(k => {
      const val = (data as any)[k];
      // Convert boolean to 0/1 for SQLite
      if (typeof val === 'boolean') return val ? 1 : 0;
      return val;
    });
    db.prepare(`UPDATE todos SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values, id);
  },
  updateLastNotificationSent: (id: number, timestamp: string): void => {
    db.prepare('UPDATE todos SET last_notification_sent = ? WHERE id = ?').run(timestamp, id);
  },
  delete: (id: number): void => {
    db.prepare('DELETE FROM todos WHERE id = ?').run(id);
  },
};

export const subtaskDB = {
  create: (todoId: number, title: string, position: number): Subtask => {
    const stmt = db.prepare('INSERT INTO subtasks (todo_id, title, position) VALUES (?, ?, ?)');
    const result = stmt.run(todoId, title, position);
    return subtaskDB.getById(Number(result.lastInsertRowid))!;
  },
  getById: (id: number): Subtask | undefined => {
    return db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id) as Subtask | undefined;
  },
  listByTodoId: (todoId: number): Subtask[] => {
    return db.prepare('SELECT * FROM subtasks WHERE todo_id = ? ORDER BY position ASC').all(todoId) as Subtask[];
  },
  update: (id: number, data: Partial<Subtask>): void => {
    const fields = Object.keys(data).filter(k => k !== 'id').map(k => `${k} = ?`).join(', ');
    const values = Object.keys(data).filter(k => k !== 'id').map(k => (data as any)[k]);
    db.prepare(`UPDATE subtasks SET ${fields} WHERE id = ?`).run(...values, id);
  },
  delete: (id: number): void => {
    db.prepare('DELETE FROM subtasks WHERE id = ?').run(id);
  },
};

export const tagDB = {
  create: (userId: number, name: string, color: string): Tag => {
    const stmt = db.prepare('INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)');
    const result = stmt.run(userId, name, color);
    return tagDB.getById(Number(result.lastInsertRowid))!;
  },
  getById: (id: number): Tag | undefined => {
    return db.prepare('SELECT * FROM tags WHERE id = ?').get(id) as Tag | undefined;
  },
  listByUserId: (userId: number): Tag[] => {
    return db.prepare('SELECT * FROM tags WHERE user_id = ? ORDER BY name ASC').all(userId) as Tag[];
  },
  update: (id: number, data: Partial<Tag>): void => {
    const fields = Object.keys(data).filter(k => k !== 'id').map(k => `${k} = ?`).join(', ');
    const values = Object.keys(data).filter(k => k !== 'id').map(k => (data as any)[k]);
    db.prepare(`UPDATE tags SET ${fields} WHERE id = ?`).run(...values, id);
  },
  delete: (id: number): void => {
    db.prepare('DELETE FROM tags WHERE id = ?').run(id);
  },
};

export const todoTagDB = {
  add: (todoId: number, tagId: number): void => {
    db.prepare('INSERT OR IGNORE INTO todo_tags (todo_id, tag_id) VALUES (?, ?)').run(todoId, tagId);
  },
  remove: (todoId: number, tagId: number): void => {
    db.prepare('DELETE FROM todo_tags WHERE todo_id = ? AND tag_id = ?').run(todoId, tagId);
  },
  getTagsForTodo: (todoId: number): Tag[] => {
    return db.prepare(`
      SELECT t.* FROM tags t
      INNER JOIN todo_tags tt ON t.id = tt.tag_id
      WHERE tt.todo_id = ?
    `).all(todoId) as Tag[];
  },
};

export const holidayDB = {
  create: (date: string, name: string, year: number): Holiday => {
    const stmt = db.prepare('INSERT INTO holidays (date, name, year) VALUES (?, ?, ?)');
    const result = stmt.run(date, name, year);
    return holidayDB.getById(Number(result.lastInsertRowid))!;
  },
  getById: (id: number): Holiday | undefined => {
    return db.prepare('SELECT * FROM holidays WHERE id = ?').get(id) as Holiday | undefined;
  },
  getByYear: (year: number): Holiday[] => {
    return db.prepare('SELECT * FROM holidays WHERE year = ? ORDER BY date ASC').all(year) as Holiday[];
  },
  getByDateRange: (startDate: string, endDate: string): Holiday[] => {
    return db.prepare('SELECT * FROM holidays WHERE date >= ? AND date <= ? ORDER BY date ASC')
      .all(startDate, endDate) as Holiday[];
  },
  list: (): Holiday[] => {
    return db.prepare('SELECT * FROM holidays ORDER BY date DESC').all() as Holiday[];
  },
  deleteByYear: (year: number): void => {
    db.prepare('DELETE FROM holidays WHERE year = ?').run(year);
  },
};

export const templateDB = {
  create: (userId: number, name: string, todoData: string, subtasksData: string | null, description?: string, category?: string): Template => {
    const stmt = db.prepare(`
      INSERT INTO templates (user_id, name, description, category, todo_data, subtasks_data)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(userId, name, description || '', category || '', todoData, subtasksData || '[]');
    return templateDB.getById(Number(result.lastInsertRowid))!;
  },
  getById: (id: number): Template | undefined => {
    return db.prepare('SELECT * FROM templates WHERE id = ?').get(id) as Template | undefined;
  },
  listByUserId: (userId: number): Template[] => {
    return db.prepare('SELECT * FROM templates WHERE user_id = ? ORDER BY created_at DESC')
      .all(userId) as Template[];
  },
  listByCategory: (userId: number, category: string): Template[] => {
    return db.prepare('SELECT * FROM templates WHERE user_id = ? AND category = ? ORDER BY created_at DESC')
      .all(userId, category) as Template[];
  },
  update: (id: number, data: Partial<Template>): void => {
    const fields = Object.keys(data).filter(k => k !== 'id').map(k => `${k} = ?`).join(', ');
    const values = Object.keys(data).filter(k => k !== 'id').map(k => (data as any)[k]);
    db.prepare(`UPDATE templates SET ${fields} WHERE id = ?`).run(...values, id);
  },
  delete: (id: number): void => {
    const db = initDB();
    db.prepare('DELETE FROM templates WHERE id = ?').run(id);
  },
};
