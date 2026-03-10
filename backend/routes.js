const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_123';

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.sendStatus(401);
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// 1. Auth set - Register
router.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!['admin', 'student'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await db.execute({
      sql: 'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      args: [name, email, password_hash, role]
    });

    res.status(201).json({ message: 'User registered successfully', userId: result.lastInsertRowid });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Auth set - Login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email]
    });

    const user = result.rows[0];
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Events - Create (Admin only)
router.post('/events', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  
  try {
    const { title, description, start_time } = req.body;
    const result = await db.execute({
      sql: 'INSERT INTO events (title, description, start_time, admin_id, status) VALUES (?, ?, ?, ?, ?)',
      args: [title, description, start_time, req.user.id, 'upcoming']
    });
    
    res.status(201).json({ message: 'Event created', eventId: result.lastInsertRowid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Events - List
router.get('/events', authenticateToken, async (req, res) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await db.execute({
        sql: 'SELECT * FROM events WHERE admin_id = ? ORDER BY start_time DESC',
        args: [req.user.id]
      });
    } else {
      result = await db.execute('SELECT * FROM events ORDER BY start_time DESC');
    }
    
    // For students, also fetch their registrations
    let registeredEventIds = [];
    if (req.user.role === 'student') {
      const regResult = await db.execute({
        sql: 'SELECT event_id FROM registrations WHERE student_id = ?',
        args: [req.user.id]
      });
      registeredEventIds = regResult.rows.map(row => row.event_id);
    }
    
    res.json({ events: result.rows, registeredEventIds });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. Events - Register (Student only)
router.post('/events/:id/register', authenticateToken, async (req, res) => {
  if (req.user.role !== 'student') return res.sendStatus(403);
  
  try {
    const eventId = req.params.id;
    await db.execute({
      sql: 'INSERT INTO registrations (student_id, event_id) VALUES (?, ?)',
      args: [req.user.id, eventId]
    });
    res.json({ message: 'Successfully registered for event' });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Already registered' });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 6. Events - Update Status (Admin only)
router.put('/events/:id/status', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  
  try {
    const { status } = req.body;
    const eventId = req.params.id;
    
    if (!['upcoming', 'live', 'ended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await db.execute({
      sql: 'UPDATE events SET status = ? WHERE id = ? AND admin_id = ?',
      args: [status, eventId, req.user.id]
    });
    
    res.json({ message: 'Event status updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 7. Events - Get Single Event
router.get('/events/:id', authenticateToken, async (req, res) => {
  try {
    const eventId = req.params.id;
    const result = await db.execute({
      sql: 'SELECT * FROM events WHERE id = ?',
      args: [eventId]
    });
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
