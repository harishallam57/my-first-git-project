const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'db.json');

// In-memory state
let state = {
  users: [],
  events: [],
  registrations: []
};

// Initial admin data if empty
const initData = () => {
  if (fs.existsSync(DB_FILE)) {
    try {
      state = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
      console.error('Failed to parse db.json', e);
    }
  } else {
    saveData();
  }
};

const saveData = () => {
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2));
};

initData();

// Mock query engine that implements the exact SQL interface used in routes.js
const db = {
  execute: async (queryOrObj) => {
    let sql = typeof queryOrObj === 'string' ? queryOrObj : queryOrObj.sql;
    let args = queryOrObj.args || [];
    sql = sql.trim();

    if (sql.startsWith('INSERT INTO users')) {
      const [name, email, password_hash, role] = args;
      if (state.users.some(u => u.email === email)) {
        throw new Error('UNIQUE constraint failed');
      }
      const id = state.users.length ? Math.max(...state.users.map(u => u.id)) + 1 : 1;
      state.users.push({ id, name, email, password_hash, role });
      saveData();
      return { lastInsertRowid: id };
    }
    
    if (sql.startsWith('SELECT * FROM users WHERE email')) {
      const [email] = args;
      const user = state.users.find(u => u.email === email);
      return { rows: user ? [user] : [] };
    }
    
    if (sql.startsWith('INSERT INTO events')) {
      const [title, description, start_time, admin_id, status] = args;
      const id = state.events.length ? Math.max(...state.events.map(e => e.id)) + 1 : 1;
      state.events.push({ id, title, description, start_time, admin_id, status });
      saveData();
      return { lastInsertRowid: id };
    }
    
    if (sql.startsWith('SELECT * FROM events WHERE admin_id')) {
      const [admin_id] = args;
      return { rows: state.events.filter(e => e.admin_id === admin_id).sort((a,b) => new Date(b.start_time) - new Date(a.start_time)) };
    }
    
    if (sql.startsWith('SELECT * FROM events ORDER BY')) {
      return { rows: [...state.events].sort((a,b) => new Date(b.start_time) - new Date(a.start_time)) };
    }
    
    if (sql.startsWith('SELECT * FROM events WHERE id = ?')) {
      const [id] = args;
      const event = state.events.find(e => e.id == id);
      return { rows: event ? [event] : [] };
    }
    
    if (sql.startsWith('SELECT event_id FROM registrations')) {
      const [student_id] = args;
      return { rows: state.registrations.filter(r => r.student_id === student_id) };
    }
    
    if (sql.startsWith('INSERT INTO registrations')) {
      const [student_id, event_id] = args;
      if (state.registrations.some(r => r.student_id === student_id && r.event_id == event_id)) {
        throw new Error('UNIQUE constraint failed');
      }
      state.registrations.push({ student_id, event_id });
      saveData();
      return { lastInsertRowid: null };
    }
    
    if (sql.startsWith('UPDATE events SET status = ?')) {
      const [status, event_id, admin_id] = args;
      const event = state.events.find(e => e.id == event_id && e.admin_id === admin_id);
      if (event) {
        event.status = status;
        saveData();
      }
      return { changes: event ? 1 : 0 };
    }
    
    console.log('Unmocked SQL:', sql);
    return { rows: [] };
  }
};

module.exports = db;
